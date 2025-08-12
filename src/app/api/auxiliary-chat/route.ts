import { NextRequest, NextResponse } from "next/server";
import { createOpenAIProvider } from "@/lib/openai-provider";

interface RequestBody {
  prompt: string;
  context?: string;
  apiKey?: string;
  model?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, context, apiKey, model } = (await req.json()) as RequestBody;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Use provided API key or fallback to your key
    const openaiKey = apiKey || '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';
    const selectedModel = model || 'gpt-5-nano-2025-08-07';

    const provider = createOpenAIProvider(openaiKey, selectedModel);

    const messages = [];
    
    // Add context if provided
    if (context) {
      messages.push({
        role: 'system' as const,
        content: `Context from main agent conversation: ${context}`
      });
    }

    messages.push({
      role: 'user' as const,
      content: prompt
    });

    const response = await provider.generateResponse(messages);

    // Handle GPT-5 vs non-GPT-5 models differently
    if (selectedModel.includes('gpt-5')) {
      // GPT-5 models return non-streaming response
      const content = response.choices[0]?.message?.content || '';
      return new Response(content, {
        headers: { 
          "Content-Type": "text/plain; charset=utf-8"
        },
      });
    } else {
      // Non-GPT-5 models support streaming
      const readableStream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          
          try {
            // Check if response is iterable (streaming)
            if (typeof (response as any)[Symbol.asyncIterator] === 'function') {
              for await (const chunk of response as any) {
                const content = chunk.choices[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(content));
                }
              }
            } else {
              // Non-streaming response
              const content = (response as any).choices[0]?.message?.content || '';
              controller.enqueue(encoder.encode(content));
            }
          } catch (error) {
            console.error('Streaming error:', error);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: { 
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        },
      });
    }

  } catch (error) {
    console.error("Error in auxiliary chat API route:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}