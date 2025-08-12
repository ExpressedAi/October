import { Redis } from '@upstash/redis';

// Neural Highway System - Living Context Between All Agents
// Based on the metaphor: Redis as spinal cord, agents as brain regions

interface NeuralContext {
  agentId: string;           // Which brain region (sylvia, auxiliary, sbs, articles)
  contextType: string;       // Type of neural signal (conversation, task, state, memory)
  payload: any;              // The actual impulse data
  timestamp: number;         // When the signal fired
  sessionId: string;         // Which conscious session
  priority: 'urgent' | 'background' | 'memory';
}

interface AgentContextSnapshot {
  currentTask: string;
  recentContext: string[];     // Recent context items
  agentState: Record<string, any>;
  capabilities: string[];
  lastActivity: number;
}

class NeuralHighway {
  private redis: Redis;
  private localMemory: Map<string, NeuralContext[]> = new Map(); // Fallback for when Redis is unavailable

  constructor() {
    // Use official Upstash SDK - now working perfectly!
    this.redis = new Redis({
      url: 'https://supreme-dingo-48051.upstash.io',
      token: 'AbuzAAIjcDEyOGY3MzgyYzVjYTU0N2FhYmY3ZDQ5NTczZTg5MDg4OXAxMA',
    });
  }

  // Send context pulse to other brain regions
  async broadcastContextPulse(context: NeuralContext) {
    // Check if Neural Highway is globally disabled
    const masterEnabled = typeof window !== 'undefined' ? 
      (window as any).neuralHighwayEnabled !== false : 
      true;
    
    // Check agent-specific configuration
    const agentConfig = typeof window !== 'undefined' ? 
      (window as any).neuralHighwayAgentConfig || [] : 
      [];
    
    const agentSettings = agentConfig.find((a: any) => a.id === context.agentId);
    const agentEnabled = agentSettings ? agentSettings.enabled && agentSettings.broadcastEnabled : true;
    
    if (!masterEnabled || !agentEnabled) {
      console.log(`🧠 Neural Highway DISABLED (master: ${masterEnabled}, agent: ${agentEnabled}) - using local memory: ${context.agentId} -> ${context.contextType}`);
      // Force use of local memory when disabled
      const key = `session:${context.sessionId}:context`;
      if (!this.localMemory.has(key)) {
        this.localMemory.set(key, []);
      }
      const contexts = this.localMemory.get(key)!;
      contexts.unshift(context);
      if (contexts.length > 100) contexts.pop();
      return;
    }

    try {
      // Store in persistent memory for context retrieval using LPUSH
      const memoryKey = `session:${context.sessionId}:context`;
      await this.redis.lpush(memoryKey, JSON.stringify(context));
      
      // Keep only last 100 context items to prevent memory bloat using LTRIM
      await this.redis.ltrim(memoryKey, 0, 99);
      
      console.log(`🧠 Neural pulse sent: ${context.agentId} -> ${context.contextType}`);
    } catch (error) {
      console.error('Failed to broadcast neural pulse:', error);
      // Fallback to local memory
      const key = `session:${context.sessionId}:context`;
      if (!this.localMemory.has(key)) {
        this.localMemory.set(key, []);
      }
      const contexts = this.localMemory.get(key)!;
      contexts.unshift(context);
      if (contexts.length > 100) contexts.pop();
    }
  }

  // Retrieve recent context for an agent
  async getSessionContext(sessionId: string, limit: number = 50, requestingAgentId?: string): Promise<NeuralContext[]> {
    // Check if Neural Highway is globally disabled
    const masterEnabled = typeof window !== 'undefined' ? 
      (window as any).neuralHighwayEnabled !== false : 
      true;
    
    // Get agent-specific context limit
    const agentConfig = typeof window !== 'undefined' ? 
      (window as any).neuralHighwayAgentConfig || [] : 
      [];
    
    const agentSettings = agentConfig.find((a: any) => a.id === requestingAgentId);
    const contextLimit = agentSettings ? agentSettings.contextLimit : limit;
    const finalLimit = Math.min(limit, contextLimit);
    
    if (!masterEnabled) {
      console.log(`🧠 Neural Highway DISABLED - retrieving from local memory (limit: ${finalLimit})`);
      // Use local memory when disabled
      const key = `session:${sessionId}:context`;
      return this.localMemory.get(key)?.slice(0, finalLimit) || [];
    }

    try {
      const memoryKey = `session:${sessionId}:context`;
      const contextData = await this.redis.lrange(memoryKey, 0, finalLimit - 1);
      
      if (!contextData || !Array.isArray(contextData)) {
        return [];
      }
      
      // Handle both string and already-parsed object data from Redis
      return contextData.map(data => {
        if (typeof data === 'string') {
          return JSON.parse(data);
        }
        return data; // Already parsed by Redis SDK
      });
    } catch (error) {
      console.error('Failed to retrieve session context:', error);
      // Fallback to local memory
      const key = `session:${sessionId}:context`;
      return this.localMemory.get(key)?.slice(0, finalLimit) || [];
    }
  }

  // Store agent state snapshot
  async updateAgentState(sessionId: string, agentId: string, snapshot: AgentContextSnapshot) {
    // Check if Neural Highway is disabled
    const isEnabled = typeof window !== 'undefined' ? 
      (window as any).neuralHighwayEnabled !== false : 
      true;
    
    if (!isEnabled) {
      console.log(`🔄 Neural Highway DISABLED - skipping agent state update: ${agentId}`);
      return;
    }

    try {
      const stateKey = `session:${sessionId}:agent:${agentId}:state`;
      
      // Set the entire snapshot as a JSON string
      await this.redis.set(stateKey, JSON.stringify(snapshot));
      
      // Set TTL to expire after 24 hours of inactivity
      await this.redis.expire(stateKey, 86400);
      
      console.log(`🔄 Agent state updated: ${agentId}`);
    } catch (error) {
      console.error('Failed to update agent state:', error);
    }
  }

  // Get agent state snapshot
  async getAgentState(sessionId: string, agentId: string): Promise<AgentContextSnapshot | null> {
    try {
      const stateKey = `session:${sessionId}:agent:${agentId}:state`;
      const stateJson = await this.redis.get(stateKey);
      
      if (!stateJson) {
        return null;
      }
      
      return JSON.parse(stateJson as string);
    } catch (error) {
      console.error('Failed to get agent state:', error);
      return null;
    }
  }

  // Consolidate session memory for long-term storage
  async consolidateMemory(sessionId: string): Promise<void> {
    try {
      const recentContext = await this.getSessionContext(sessionId, 100);
      
      if (recentContext.length === 0) return;
      
      // Extract key insights and relationships
      const consolidatedMemory = {
        sessionSummary: this.extractKeyInsights(recentContext),
        agentInteractions: this.mapAgentRelationships(recentContext),
        persistentState: this.extractPersistentData(recentContext),
        timestamp: Date.now()
      };
      
      const memoryKey = `long-term-memory:${sessionId}`;
      await this.redis.hset(memoryKey, consolidatedMemory);
      
      console.log(`🧠 Memory consolidated for session: ${sessionId}`);
    } catch (error) {
      console.error('Failed to consolidate memory:', error);
    }
  }

  // Clean up old sessions
  async cleanupOldSessions(daysOld: number = 7): Promise<void> {
    try {
      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
      const keys = await this.redis.keys('session:*');
      
      for (const key of keys) {
        // Check last activity timestamp
        const lastActivity = await this.redis.hget(key, 'lastActivity');
        if (lastActivity && parseInt(lastActivity as string) < cutoffTime) {
          await this.redis.del(key);
        }
      }
      
      console.log(`🧹 Cleaned up sessions older than ${daysOld} days`);
    } catch (error) {
      console.error('Failed to cleanup old sessions:', error);
    }
  }

  private extractKeyInsights(context: NeuralContext[]): string {
    // Simple extraction for now - could be enhanced with AI summarization
    const conversationItems = context.filter(c => c.contextType === 'conversation');
    const taskItems = context.filter(c => c.contextType === 'task');
    
    return `Conversations: ${conversationItems.length}, Tasks: ${taskItems.length}`;
  }

  private mapAgentRelationships(context: NeuralContext[]): Record<string, number> {
    const relationships: Record<string, number> = {};
    
    context.forEach(c => {
      relationships[c.agentId] = (relationships[c.agentId] || 0) + 1;
    });
    
    return relationships;
  }

  private extractPersistentData(context: NeuralContext[]): any {
    // Extract data that should persist across sessions
    return context
      .filter(c => c.priority === 'memory')
      .map(c => c.payload);
  }
}

// Singleton instance
export const neuralHighway = new NeuralHighway();

// Helper function to generate session ID
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to create neural context
export function createNeuralContext(
  agentId: string,
  contextType: string,
  payload: any,
  sessionId: string,
  priority: 'urgent' | 'background' | 'memory' = 'background'
): NeuralContext {
  return {
    agentId,
    contextType,
    payload,
    timestamp: Date.now(),
    sessionId,
    priority
  };
}