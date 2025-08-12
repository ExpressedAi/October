type AgentConfig = {
  mainPrompt: string;
  commands: Command[];
  cartridges: Cartridge[];
  updatedAt: number;
};

type ExtensionSettings = {
  firecrawl?: {
    enabled: boolean;
    timeout: number[];
    onlyMainContent: boolean;
    proxy: string;
    formats: {
      markdown: boolean;
      html: boolean;
      rawHtml: boolean;
      screenshot: boolean;
      links: boolean;
    };
    includeTags: string;
  };
  // Future extensions can be added here
  tavily?: any;
};

type Command = {
  id: string;
  slash: string;
  label: string;
  description?: string;
  action: "insert_text" | "load_cartridge";
  payload?: string;
  cartridgeSlug?: string;
};

type Cartridge = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  tags?: string[];
  content: string;
};

class SylviaDB {
  private db: IDBDatabase | null = null;
  private dbName = 'sylvia-agent-storage';
  private version = 2;
  private agentStoreName = 'agent-configs';
  private extensionStoreName = 'extension-settings';

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create agent configs store
        if (!db.objectStoreNames.contains(this.agentStoreName)) {
          const agentStore = db.createObjectStore(this.agentStoreName, { keyPath: 'name' });
          agentStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
        
        // Create extension settings store
        if (!db.objectStoreNames.contains(this.extensionStoreName)) {
          const extensionStore = db.createObjectStore(this.extensionStoreName, { keyPath: 'id' });
          extensionStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };
    });
  }

  async get(name: string): Promise<AgentConfig | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.agentStoreName], 'readonly');
      const store = transaction.objectStore(this.agentStoreName);
      const request = store.get(name);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.config : null);
      };
    });
  }

  async set(name: string, config: AgentConfig): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.agentStoreName], 'readwrite');
      const store = transaction.objectStore(this.agentStoreName);
      const request = store.put({
        name,
        config,
        updatedAt: Date.now()
      });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(name: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.agentStoreName], 'readwrite');
      const store = transaction.objectStore(this.agentStoreName);
      const request = store.delete(name);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getAllNames(): Promise<string[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.agentStoreName], 'readonly');
      const store = transaction.objectStore(this.agentStoreName);
      const request = store.getAllKeys();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string[]);
    });
  }

  // Extension settings methods
  async getExtensionSettings(): Promise<ExtensionSettings> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.extensionStoreName], 'readonly');
      const store = transaction.objectStore(this.extensionStoreName);
      const request = store.get('extensions');
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.settings : {});
      };
    });
  }

  async setExtensionSettings(settings: ExtensionSettings): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.extensionStoreName], 'readwrite');
      const store = transaction.objectStore(this.extensionStoreName);
      const request = store.put({
        id: 'extensions',
        settings,
        updatedAt: Date.now()
      });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

export const sylviaDB = new SylviaDB();
export type { AgentConfig, Command, Cartridge, ExtensionSettings };