'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Brain, Activity, Database, Network, Settings, Trash2, BarChart3 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

interface AgentConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  contextLimit: number;
  broadcastEnabled: boolean;
  recentActivity: number;
}

interface RedisStats {
  operations: number;
  memoryUsage: string;
  activeConnections: number;
  lastOperation: string;
}

export default function NeuralHighwayPage() {
  const [masterEnabled, setMasterEnabled] = useState<boolean>(true);
  const [agents, setAgents] = useState<AgentConfig[]>([
    {
      id: 'sylvia',
      name: 'Sylvia (Main Chat)',
      description: 'Primary chat interface agent',
      enabled: true,
      contextLimit: 100,
      broadcastEnabled: true,
      recentActivity: 24
    },
    {
      id: 'auxiliary',
      name: 'Auxiliary Agent',
      description: 'Secondary helper agent',
      enabled: true,
      contextLimit: 50,
      broadcastEnabled: true,
      recentActivity: 12
    },
    {
      id: 'vision',
      name: 'Vision Analysis',
      description: 'Image and visual analysis agent',
      enabled: true,
      contextLimit: 75,
      broadcastEnabled: true,
      recentActivity: 8
    }
  ]);

  const [redisStats, setRedisStats] = useState<RedisStats>({
    operations: 0,
    memoryUsage: '0 MB',
    activeConnections: 1,
    lastOperation: 'Never'
  });

  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');

  // Load settings from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMaster = localStorage.getItem('neuralHighway.masterEnabled');
      if (savedMaster) {
        setMasterEnabled(savedMaster === 'true');
      }

      const savedAgents = localStorage.getItem('neuralHighway.agents');
      if (savedAgents) {
        setAgents(JSON.parse(savedAgents));
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('neuralHighway.masterEnabled', masterEnabled.toString());
      localStorage.setItem('neuralHighway.agents', JSON.stringify(agents));
      
      // Set global flags for the neural highway system
      (window as any).neuralHighwayEnabled = masterEnabled;
      (window as any).neuralHighwayAgentConfig = agents;
    }
  }, [masterEnabled, agents]);

  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      const response = await fetch('/api/neural-highway/test');
      const data = await response.json();
      
      if (data.status === 'healthy') {
        setConnectionStatus('connected');
        setRedisStats(prev => ({
          ...prev,
          operations: prev.operations + 1,
          lastOperation: new Date().toLocaleTimeString()
        }));
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      setConnectionStatus('error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const updateAgentConfig = (agentId: string, field: keyof AgentConfig, value: any) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId ? { ...agent, [field]: value } : agent
    ));
  };

  const resetToDefaults = () => {
    setMasterEnabled(true);
    setAgents([
      {
        id: 'sylvia',
        name: 'Sylvia (Main Chat)',
        description: 'Primary chat interface agent',
        enabled: true,
        contextLimit: 100,
        broadcastEnabled: true,
        recentActivity: 24
      },
      {
        id: 'auxiliary',
        name: 'Auxiliary Agent',
        description: 'Secondary helper agent',
        enabled: true,
        contextLimit: 50,
        broadcastEnabled: true,
        recentActivity: 12
      },
      {
        id: 'vision',
        name: 'Vision Analysis',
        description: 'Image and visual analysis agent',
        enabled: true,
        contextLimit: 75,
        broadcastEnabled: true,
        recentActivity: 8
      }
    ]);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="w-8 h-8 text-blue-500" />
            Neural Highway Control Center
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage REDIS connections, agent context sharing, and cross-module communication
          </p>
        </div>
        <Link href="/">
          <Button variant="outline">← Back to Chat</Button>
        </Link>
      </div>

      {/* Master Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Master Controls
          </CardTitle>
          <CardDescription>
            Global settings for the Neural Highway system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Neural Highway System</h3>
              <p className="text-sm text-muted-foreground">
                Master switch for all REDIS operations
              </p>
            </div>
            <Switch
              checked={masterEnabled}
              onCheckedChange={setMasterEnabled}
            />
          </div>

          <Separator />

          <div className="flex gap-4">
            <Button 
              onClick={testConnection} 
              disabled={isTestingConnection}
              className="flex-1"
            >
              <Database className="w-4 h-4 mr-2" />
              {isTestingConnection ? 'Testing...' : 'Test REDIS Connection'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={resetToDefaults}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>

          {connectionStatus !== 'unknown' && (
            <div className="p-3 rounded-lg bg-muted">
              <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
                {connectionStatus === 'connected' ? 'Connected' : 'Connection Failed'}
              </Badge>
              <p className="text-sm mt-1">
                {connectionStatus === 'connected' 
                  ? 'REDIS connection is healthy and operational' 
                  : 'Unable to connect to REDIS. Check your credentials and network.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* REDIS Stats */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            REDIS Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{redisStats.operations}</div>
              <div className="text-sm text-muted-foreground">Operations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{redisStats.memoryUsage}</div>
              <div className="text-sm text-muted-foreground">Memory Usage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{redisStats.activeConnections}</div>
              <div className="text-sm text-muted-foreground">Connections</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium">{redisStats.lastOperation}</div>
              <div className="text-sm text-muted-foreground">Last Operation</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            Agent Configuration
          </CardTitle>
          <CardDescription>
            Individual controls for each AI agent in the neural network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {agents.map((agent) => (
              <div key={agent.id} className="p-4 border rounded-lg bg-muted/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium">{agent.name}</h3>
                    <p className="text-sm text-muted-foreground">{agent.description}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">
                      <Activity className="w-3 h-3 mr-1" />
                      {agent.recentActivity} msgs
                    </Badge>
                    <Switch
                      checked={agent.enabled && masterEnabled}
                      disabled={!masterEnabled}
                      onCheckedChange={(checked) => updateAgentConfig(agent.id, 'enabled', checked)}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Context Limit: {agent.contextLimit} items
                    </label>
                    <Slider
                      value={[agent.contextLimit]}
                      onValueChange={(value) => updateAgentConfig(agent.id, 'contextLimit', value[0])}
                      max={200}
                      step={5}
                      className="w-full"
                      disabled={!agent.enabled || !masterEnabled}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0</span>
                      <span>200</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Broadcast to Other Agents</label>
                      <p className="text-xs text-muted-foreground">
                        Share context with other neural network nodes
                      </p>
                    </div>
                    <Switch
                      checked={agent.broadcastEnabled && agent.enabled && masterEnabled}
                      disabled={!agent.enabled || !masterEnabled}
                      onCheckedChange={(checked) => updateAgentConfig(agent.id, 'broadcastEnabled', checked)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}