import { useState, useEffect, useCallback } from 'react';
import { sylviaDB, type AgentConfig } from '@/lib/indexeddb';

const defaultConfig: AgentConfig = {
  mainPrompt: '',
  commands: [],
  cartridges: [],
  updatedAt: 0
};

export function useAgentConfig(name = 'sylvia') {
  const [config, setConfig] = useState<AgentConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    
    const loadConfig = async () => {
      try {
        setLoading(true);
        const saved = await sylviaDB.get(name);
        if (!cancelled) {
          if (saved) {
            setConfig(saved);
          } else {
            // Set initial timestamp only on client side
            const initialConfig = { ...defaultConfig, updatedAt: Date.now() };
            setConfig(initialConfig);
          }
        }
      } catch (error) {
        console.error('Failed to load config:', error);
        if (!cancelled) {
          const fallbackConfig = { ...defaultConfig, updatedAt: Date.now() };
          setConfig(fallbackConfig);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadConfig();
    
    return () => {
      cancelled = true;
    };
  }, [name]);

  const save = useCallback(
    async (next: Partial<AgentConfig> | ((prev: AgentConfig) => AgentConfig)) => {
      setConfig((prev) => {
        const resolved =
          typeof next === 'function' ? next(prev) : { ...prev, ...next };
        const withTime = { ...resolved, updatedAt: Date.now() };
        
        // Fire and forget - save to IndexedDB
        sylviaDB.set(name, withTime).catch(error => 
          console.error('Failed to save config:', error)
        );
        
        return withTime;
      });
    },
    [name]
  );

  const replaceAll = useCallback(
    async (full: AgentConfig) => {
      const withTime = { ...full, updatedAt: Date.now() };
      setConfig(withTime);
      
      try {
        await sylviaDB.set(name, withTime);
      } catch (error) {
        console.error('Failed to save config:', error);
      }
    },
    [name]
  );

  return { config, save, replaceAll, loading };
}