import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { INITIAL_RECEPTIVE_PROMPT } from '@/lib/sbs-constants';

// Hardcoding the API key as requested.
const genAI = new GoogleGenerativeAI("AIzaSyD-tDr0hdkyFnJjqrEkP0D9qbCsimKiVxQ");

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const systemPrompt = `You are an expert in "Sympathetic Prompting," a system for creating highly effective and structured AI prompts. Your task is to generate a complete, well-structured "Receptive Prompt" in rich Markdown format based on a user's request.

You should create prompts that follow the structure and style of professional AI framework design, using clear sections, tables, and well-organized content. Focus on creating prompts that establish roles, missions, features, response formats, and practical applications.

Here is an excellent example of a well-structured Receptive Prompt that you should emulate in style and format:

--- EXAMPLE START ---
${INITIAL_RECEPTIVE_PROMPT}
--- EXAMPLE END ---

Your output should be ONLY the generated markdown prompt, without any additional explanation or preamble. It must be in the same rich Markdown style as the example provided, with clear sections, proper formatting, and comprehensive structure.

Create a prompt that includes:
1. A clear role definition
2. Mission statement
3. Key features/capabilities
4. Response format guidelines
5. Practical applications

User Request: "${query}"`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ prompt: text });
  } catch (error) {
    console.error('Error building prompt:', error);
    return NextResponse.json(
      { error: 'Failed to build receptive prompt' },
      { status: 500 }
    );
  }
}