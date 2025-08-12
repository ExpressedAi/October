import { NextRequest, NextResponse } from "next/server";
import { Groq } from 'groq-sdk';
import { neuralHighway, createNeuralContext } from "@/lib/neural-highway";

interface RequestBody {
  imageData: string;
  prompt: string;
  tokenLimit?: number;
  sessionId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { imageData, prompt, tokenLimit = 50, sessionId } = (await req.json()) as RequestBody;

    if (!imageData || !prompt) {
      return NextResponse.json(
        { error: "Image data and prompt are required" },
        { status: 400 }
      );
    }

    // 🚀 Use FREE Groq vision with the CORRECT model!
    const groq = new Groq({ 
      apiKey: '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'
    });

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: imageData.startsWith('data:') ? imageData : `data:image/png;base64,${imageData}`
              }
            }
          ]
        }
      ],
      model: "meta-llama/llama-4-scout-17b-16e-instruct", // 🎯 CORRECT model!
      temperature: 0.1,
      max_completion_tokens: Math.min(tokenLimit * 10, 1024),
      top_p: 0.9,
      stream: false
    });

    const result = chatCompletion.choices[0]?.message?.content || "No analysis generated";

    // 🧠👁️ BROADCAST VISION ANALYSIS TO NEURAL HIGHWAY
    if (sessionId && result) {
      try {
        await neuralHighway.broadcastContextPulse(
          createNeuralContext('vision', 'screen-analysis', {
            analysis: result,
            prompt: prompt,
            timestamp: Date.now(),
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            tokenLimit: tokenLimit
          }, sessionId, 'urgent') // Vision is URGENT priority!
        );
        console.log('🚀👁️ FREE Groq Llama 4 Scout vision analysis broadcasted to Neural Highway!');
      } catch (error) {
        console.error('Failed to broadcast vision analysis to Neural Highway:', error);
      }
    }

    return new Response(result, {
      headers: { 
        "Content-Type": "text/plain; charset=utf-8",
      },
    });

  } catch (error) {
    console.error("Error in vision analysis API route:", error);
    return NextResponse.json(
      { error: "An error occurred while processing vision analysis." },
      { status: 500 }
    );
  }
}