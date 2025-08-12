import {
  GoogleGenerativeAI,
  Part,
  Content,
  FunctionCall,
} from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { toolDeclarations, executeTool, ToolResult } from "@/lib/tools";
import { neuralHighway } from "@/lib/neural-highway";

// Hardcoding the API key as requested.
const genAI = new GoogleGenerativeAI("AIzaSyD-tDr0hdkyFnJjqrEkP0D9qbCsimKiVxQ");

interface RequestBody {
  prompt: string;
  file?: {
    mimeType: string;
    data: string; // base64 encoded string
  };
  messages?: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    state?: string;
  }>;
  agentConfig?: {
    mainPrompt: string;
    commands: Array<any>;
    cartridges: Array<any>;
    updatedAt: number;
  };
  sessionId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, file, messages = [], agentConfig, sessionId } = (await req.json()) as RequestBody;

    // DEBUG LOGGING FOR SECOND REQUEST FAILURES
    console.log('=== CHAT REQUEST DEBUG ===');
    console.log('Request number (approx):', messages.length + 1);
    console.log('Messages count:', messages.length);
    console.log('Session ID:', sessionId);
    console.log('Has prompt:', !!prompt);
    console.log('Has file:', !!file);
    console.log('Agent Config received:', {
      hasConfig: !!agentConfig,
      hasMainPrompt: !!agentConfig?.mainPrompt,
      mainPromptLength: agentConfig?.mainPrompt?.length || 0,
      commandsCount: agentConfig?.commands?.length || 0,
      cartridgesCount: agentConfig?.cartridges?.length || 0
    });

    if (!prompt && !file) {
      return NextResponse.json(
        { error: "Prompt or file is required" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      tools: [{ functionDeclarations: toolDeclarations }], // Empty tools array - ready for REST API tools
      generationConfig: {
        maxOutputTokens: 32000,
        temperature: 0.7,
      }
    });

    // Build conversation history from previous messages
    const contents: Content[] = [];
    
    // Add system prompt with Neural Highway context
    if (agentConfig?.mainPrompt && agentConfig.mainPrompt.trim()) {
      let systemPrompt = agentConfig.mainPrompt;
      
      // 🧠👁️ ADD NEURAL HIGHWAY CONTEXT (including live vision analysis)
      if (sessionId) {
        try {
          console.log('🧠 Attempting to get Neural Highway context for session:', sessionId);
          // Use a conservative context limit - 10 items max to prevent REDIS overload
          const recentContext = await neuralHighway.getSessionContext(sessionId, 10, 'sylvia');
          console.log('🧠 Retrieved Neural Highway context:', recentContext?.length || 0, 'items');
          
          // DEBUG: Check if neural highway is causing issues
          if (!recentContext) {
            console.log('🚨 Neural Highway returned null/undefined context');
          }
          
          if (recentContext && recentContext.length > 0) {
            // Get LAST 5 vision contexts and 5 other contexts to keep it lightweight
            const allVisionContexts = recentContext.filter(ctx => ctx && ctx.agentId === 'vision').slice(0, 5);
            const otherContexts = recentContext.filter(ctx => ctx && ctx.agentId !== 'vision').slice(0, 5);
            
            let neuralContextAddendum = '\n\n--- NEURAL HIGHWAY LIVE CONTEXT ---\n';
            
            if (allVisionContexts.length > 0) {
              neuralContextAddendum += `👁️ RECENT SCREEN ANALYSIS (${allVisionContexts.length} snapshots):\n`;
              allVisionContexts.forEach((ctx, i) => {
                if (ctx && ctx.payload && ctx.timestamp) {
                  const timestamp = new Date(ctx.timestamp).toLocaleTimeString();
                  const analysis = ctx.payload.analysis || 'No analysis';
                  // Sanitize analysis to prevent role confusion
                  const cleanAnalysis = analysis.replace(/\b(user|model|assistant):/gi, 'person:');
                  neuralContextAddendum += `${timestamp}: ${cleanAnalysis}\n`;
                }
              });
            }
            
            if (otherContexts.length > 0) {
              neuralContextAddendum += '\n🧠 OTHER AGENT CONTEXT:\n';
              otherContexts.forEach((ctx, i) => {
                if (ctx && ctx.payload && ctx.agentId) {
                  try {
                    const preview = JSON.stringify(ctx.payload).slice(0, 150);
                    // Sanitize preview to prevent role confusion
                    const cleanPreview = preview.replace(/\b(user|model|assistant):/gi, 'person:');
                    neuralContextAddendum += `  ${i + 1}. [${ctx.agentId}]: ${cleanPreview}...\n`;
                  } catch (e) {
                    console.error('Error processing context payload:', e);
                  }
                }
              });
            }
            
            neuralContextAddendum += '--- END NEURAL HIGHWAY CONTEXT ---\n';
            systemPrompt += neuralContextAddendum;
          }
          
          // Add semantic admonition system awareness
          systemPrompt += '\n\n--- VISUAL FORMATTING SYSTEM ---\n';
          systemPrompt += 'IMPORTANT: The frontend automatically detects and styles certain text patterns with colored containers:\n\n';
          systemPrompt += '• [anything in brackets] → Purple containers (inner monologue, stage directions)\n';
          systemPrompt += '• "Here\'s how this works:" type phrases → Green containers (explanations)\n';
          systemPrompt += '• "For example:" type phrases → Orange containers (examples)\n';
          systemPrompt += '• "Important:" type phrases → Red containers (warnings)\n';
          systemPrompt += '• "The result:" type phrases → Yellow containers (conclusions)\n\n';
          systemPrompt += 'Use these patterns intentionally to create visually appealing, scannable responses that break up wall-of-text formatting.\n';
          systemPrompt += '--- END VISUAL FORMATTING SYSTEM ---\n';
        } catch (error) {
          console.error('Failed to retrieve Neural Highway context for main chat:', error);
        }
      }
      
      contents.push({
        role: "user",
        parts: [{ text: `System: ${systemPrompt}` }]
      });
      contents.push({
        role: "model",
        parts: [{ text: "I understand. I'll follow those instructions and integrate the Neural Highway live context into my responses." }]
      });
    }
    
    // Add conversation history (excluding the last assistant message if it's "thinking")
    for (const msg of messages) {
      if (msg.role === "assistant" && (msg.state === "thinking" || msg.content === "")) {
        continue; // Skip thinking/empty assistant messages
      }
      
      // 🔥 FIX: Convert "assistant" role to "model" for Gemini API
      const geminiRole = msg.role === "assistant" ? "model" : msg.role;
      
      contents.push({
        role: geminiRole,
        parts: [{ text: msg.content }]
      });
    }

    // Build current message parts
    const currentParts: Part[] = [];
    if (prompt) {
      currentParts.push({ text: prompt });
    }
    if (file) {
      currentParts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data,
        },
      });
    }

    // Add current user message to conversation
    contents.push({ role: "user", parts: currentParts });

    // DEBUG: Log final conversation state before sending to Gemini
    console.log('📝 Final conversation contents count:', contents.length);
    console.log('📝 Total conversation length (chars):', JSON.stringify(contents).length);

    const maxSteps = 8; // Safety cap for compositional loops

    // Compositional loop
    for (let step = 0; step < maxSteps; step++) {
      console.log('🤖 Sending request to Gemini, step:', step);
      try {
        const result = await model.generateContent({ contents });
        console.log('✅ Received response from Gemini, step:', step);
        const response = result.response;
        const functionCalls = response.functionCalls();

        if (functionCalls && functionCalls.length > 0) {
          // Append the model's turn that contained the tool call(s)
          contents.push(response.candidates![0].content);

          // Execute each call in parallel
          const toolResults = await Promise.all(
            functionCalls.map(async (call: FunctionCall) => {
              return executeTool(call);
            })
          );

          // Append tool results to the conversation history
          contents.push({
            role: "user",
            parts: toolResults.map((toolResult: ToolResult) => ({
              functionResponse: {
                name: toolResult.name,
                response: toolResult.error
                  ? { error: toolResult.error }
                  : { result: toolResult.result },
              },
            })),
          });

          // Continue loop for possible composition
          continue;
        } else {
          // No function calls, so we have the final response.
          const streamResult = await model.generateContentStream({ contents });

          const readableStream = new ReadableStream({
            async start(controller) {
              const encoder = new TextEncoder();
              for await (const chunk of streamResult.stream) {
                const text = chunk.text();
                if (text) {
                  controller.enqueue(encoder.encode(text));
                }
              }
              controller.close();
            },
          });

          return new Response(readableStream, {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        }
      } catch (error) {
        console.error('❌ Gemini request failed at step', step, ':', error);
        throw error; // Re-throw to trigger the outer catch
      }
    }

    // If loop finishes due to maxSteps, send a fallback message.
    const fallbackContent: Content[] = [
      ...contents,
      {
        role: "model",
        parts: [
          { text: "I seem to be stuck in a loop. Could you rephrase your request?" },
        ],
      },
    ];
    const streamResult = await model.generateContentStream({
      contents: fallbackContent,
    });
    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of streamResult.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
      },
    });
    return new Response(readableStream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("Error in chat API route:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}