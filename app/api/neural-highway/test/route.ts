import { NextRequest, NextResponse } from 'next/server';
import { neuralHighway, createNeuralContext } from '@/lib/neural-highway';

export async function GET() {
  try {
    // Test the neural highway system directly
    const healthCheck = createNeuralContext(
      'health-check',
      'ping',
      { status: 'healthy', timestamp: Date.now() },
      'health-session',
      'background'
    );
    
    await neuralHighway.broadcastContextPulse(healthCheck);
    
    // Try to retrieve it back
    const retrievedContext = await neuralHighway.getSessionContext('health-session', 2);
    
    return NextResponse.json({
      status: 'healthy',
      message: 'Neural Highway is operational',
      contextsSaved: retrievedContext.length,
      latestContext: retrievedContext[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Neural Highway connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    
    // Test creating and broadcasting a neural context
    const testContext = createNeuralContext(
      'test-agent',
      'test-message',
      { message: message || 'Neural Highway test successful!' },
      'test-session-123',
      'background'
    );
    
    await neuralHighway.broadcastContextPulse(testContext);
    
    // Test retrieving context
    const retrievedContext = await neuralHighway.getSessionContext('test-session-123', 5);
    
    return NextResponse.json({
      success: true,
      message: 'Neural Highway connection successful!',
      testContext,
      retrievedContext: retrievedContext.slice(0, 3) // Show last 3 entries
    });
    
  } catch (error) {
    console.error('Neural Highway test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}