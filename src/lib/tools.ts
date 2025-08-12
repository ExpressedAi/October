import { FunctionCall, SchemaType, FunctionDeclaration } from "@google/generative-ai";

// Define the types for our tool calls and results
export type ToolCall = FunctionCall;

export interface ToolResult {
  name: string;
  result: any;
  error?: string;
}

// 1. Declarations you expose to the model
// We explicitly type this array to guide the TypeScript compiler.
export const toolDeclarations: FunctionDeclaration[] = [
  {
    name: "firecrawl_scrape",
    description: "Scrape a single webpage and extract its content using Firecrawl. Returns markdown, HTML, or other specified formats.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        url: {
          type: SchemaType.STRING,
          description: "The URL to scrape (must be a valid HTTP/HTTPS URL)",
        },
        formats: {
          type: SchemaType.ARRAY,
          description: "Content formats to extract (markdown, html, links, screenshot)",
          items: {
            type: SchemaType.STRING
          }
        },
        onlyMainContent: {
          type: SchemaType.BOOLEAN,
          description: "Extract only main article content (default: true)",
        },
        proxy: {
          type: SchemaType.STRING,
          description: "Proxy type: 'basic' (fast, default), 'stealth' (anti-bot protection), or 'auto' (retry with stealth if basic fails)",
        }
      },
      required: ["url"],
    },
  },
  {
    name: "firecrawl_crawl",
    description: "Crawl a website recursively to extract content from multiple pages. Useful for comprehensive site analysis.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        url: {
          type: SchemaType.STRING,
          description: "The starting URL to crawl (must be a valid HTTP/HTTPS URL)",
        },
        limit: {
          type: SchemaType.NUMBER,
          description: "Maximum number of pages to crawl (default: 10, max: 100)",
        },
        formats: {
          type: SchemaType.ARRAY,
          description: "Content formats to extract (markdown, html, links)",
          items: {
            type: SchemaType.STRING
          }
        },
        proxy: {
          type: SchemaType.STRING,
          description: "Proxy type: 'basic' (fast, default), 'stealth' (anti-bot protection), or 'auto' (retry with stealth if basic fails)",
        }
      },
      required: ["url"],
    },
  },
  {
    name: "firecrawl_map",
    description: "Map a website to get all URLs extremely fast. Perfect for site discovery, link analysis, or choosing specific pages to scrape.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        url: {
          type: SchemaType.STRING,
          description: "The website URL to map (must be a valid HTTP/HTTPS URL)",
        },
        search: {
          type: SchemaType.STRING,
          description: "Optional: Search for specific URLs containing this term (e.g. 'docs', 'blog', 'api')",
        }
      },
      required: ["url"],
    },
  }
];

// 2. Your actual executable implementations
const impl = {
  async firecrawl_scrape({ url, formats = ["markdown"], onlyMainContent = true, proxy }: { 
    url: string; 
    formats?: string[]; 
    onlyMainContent?: boolean;
    proxy?: string;
  }) {
    console.log(`Tool Call: firecrawl_scrape(url=${url}, formats=${formats.join(',')}, onlyMainContent=${onlyMainContent}, proxy=${proxy || 'basic'})`);
    
    try {
      const response = await fetch('/api/firecrawl/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, formats, onlyMainContent, proxy })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Firecrawl scrape failed: ${error}`);
      }

      const result = await response.json();
      return {
        success: true,
        url: url,
        formats: formats,
        content: result.data,
        metadata: result.metadata
      };
    } catch (error) {
      console.error('Firecrawl scrape error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  async firecrawl_crawl({ url, limit = 10, formats = ["markdown"], proxy }: { 
    url: string; 
    limit?: number; 
    formats?: string[];
    proxy?: string;
  }) {
    console.log(`Tool Call: firecrawl_crawl(url=${url}, limit=${limit}, formats=${formats.join(',')}, proxy=${proxy || 'basic'})`);
    
    try {
      const response = await fetch('/api/firecrawl/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, limit: Math.min(limit, 100), formats, proxy })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Firecrawl crawl failed: ${error}`);
      }

      const result = await response.json();
      return {
        success: true,
        url: url,
        limit: limit,
        formats: formats,
        pages: result.data?.length || 0,
        content: result.data,
        creditsUsed: result.creditsUsed
      };
    } catch (error) {
      console.error('Firecrawl crawl error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  async firecrawl_map({ url, search }: { 
    url: string; 
    search?: string;
  }) {
    console.log(`Tool Call: firecrawl_map(url=${url}, search=${search || 'none'})`);
    
    try {
      const response = await fetch('/api/firecrawl/map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, search })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Firecrawl map failed: ${error}`);
      }

      const result = await response.json();
      return {
        success: true,
        url: url,
        search: search,
        totalLinks: result.links?.length || 0,
        links: result.links,
        status: result.status
      };
    } catch (error) {
      console.error('Firecrawl map error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
} as const;

// 3. Executor function that calls the correct implementation
export async function executeTool(call: ToolCall): Promise<ToolResult> {
  const toolName = call.name;
  if (!toolName) {
    return { name: "unknown", result: null, error: "Tool call is missing a name." };
  }

  try {
    const fn = (impl as any)[toolName];
    if (!fn) {
      return {
        name: toolName,
        result: null,
        error: `Unknown tool: ${toolName}`,
      };
    }
    const result = await fn(call.args || {});
    return { name: toolName, result };
  } catch (e: any) {
    return {
      name: toolName,
      result: null,
      error: String(e?.message || e),
    };
  }
}