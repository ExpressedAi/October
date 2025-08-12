import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function GET() {
  try {
    // Use the official SDK with hardcoded credentials
    const redis = new Redis({
      url: 'https://supreme-dingo-48051.upstash.io',
      token: 'AbuzAAIjcDEyOGY3MzgyYzVjYTU0N2FhYmY3ZDQ5NTczZTg5MDg4OXAxMA',
    });
    
    // Set and get a test value
    await redis.set('nextjs-test', 'working');
    const result = await redis.get('nextjs-test');
    
    return NextResponse.json({
      success: true,
      message: 'Redis working from Next.js!',
      value: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}