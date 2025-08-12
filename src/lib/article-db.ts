import type { Article } from './article-types';

const DB_NAME = 'SylviaArticleDB';
const DB_VERSION = 1;
const STORE_NAME = 'articles';

let db: IDBDatabase | null = null;

export const initArticleDB = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve();
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open database'));
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        
        store.createIndex('title', 'title', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
};

export const addArticle = (articleData: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const now = new Date().toISOString();
    const article: Omit<Article, 'id'> = {
      ...articleData,
      createdAt: now,
      updatedAt: now
    };

    const request = store.add(article);

    request.onsuccess = () => {
      resolve(request.result as number);
    };

    request.onerror = () => {
      reject(new Error('Failed to add article'));
    };
  });
};

export const getAllArticles = (): Promise<Article[]> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const articles = request.result as Article[];
      // Sort by creation date, newest first
      articles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      resolve(articles);
    };

    request.onerror = () => {
      reject(new Error('Failed to get articles'));
    };
  });
};

export const getArticleById = (id: number): Promise<Article | null> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(new Error('Failed to get article'));
    };
  });
};

export const updateArticle = (id: number, updates: Partial<Omit<Article, 'id' | 'createdAt'>>): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // First get the existing article
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const existingArticle = getRequest.result as Article;
      if (!existingArticle) {
        reject(new Error('Article not found'));
        return;
      }

      const updatedArticle: Article = {
        ...existingArticle,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      const updateRequest = store.put(updatedArticle);
      
      updateRequest.onsuccess = () => {
        resolve();
      };

      updateRequest.onerror = () => {
        reject(new Error('Failed to update article'));
      };
    };

    getRequest.onerror = () => {
      reject(new Error('Failed to get article for update'));
    };
  });
};

export const deleteArticle = (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to delete article'));
    };
  });
};