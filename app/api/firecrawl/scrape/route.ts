import { NextRequest, NextResponse } from "next/server";
import { sylviaDB } from "@/lib/indexeddb";

interface ScrapeRequest {
  url: string;
  formats?: string[];
  onlyMainContent?: boolean;
  proxy?: string;
  apiKey?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { url, formats, onlyMainContent, proxy, apiKey } = (await req.json()) as ScrapeRequest;

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Get settings from IndexedDB
    const extensionSettings = await sylviaDB.getExtensionSettings();
    const firecrawlSettings = extensionSettings.firecrawl;

    // Use provided parameters or fall back to settings or defaults
    const finalFormats = formats || (firecrawlSettings ? 
      Object.entries(firecrawlSettings.formats)
        .filter(([_, enabled]) => enabled)
        .map(([format, _]) => format) 
      : ["markdown"]);
    
    const finalOnlyMainContent = onlyMainContent ?? (firecrawlSettings?.onlyMainContent ?? true);
    const finalProxy = proxy || (firecrawlSettings?.proxy ?? "basic");

    // Use provided API key or hardcoded fallback
    const firecrawlKey = apiKey || 'fc-b61ab628e25f4270ad0bcdd2c55700c2';

    if (!firecrawlKey || firecrawlKey === 'fc-YOUR_API_KEY_HERE') {
      return NextResponse.json(
        { error: "Firecrawl API key not configured. Please add your API key in Extensions settings." },
        { status: 400 }
      );
    }

    // Make request to Firecrawl API
    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firecrawlKey}`
      },
      body: JSON.stringify({
        url: url,
        formats: finalFormats,
        onlyMainContent: finalOnlyMainContent,
        proxy: finalProxy
      })
    });

    if (!firecrawlResponse.ok) {
      const errorText = await firecrawlResponse.text();
      console.error('Firecrawl API error:', errorText);
      return NextResponse.json(
        { error: `Firecrawl API error: ${errorText}` },
        { status: firecrawlResponse.status }
      );
    }

    const result = await firecrawlResponse.json();

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: result.metadata
    });

  } catch (error) {
    console.error("Error in Firecrawl scrape API route:", error);
    return NextResponse.json(
      { error: "An error occurred while scraping the URL." },
      { status: 500 }
    );
  }
}