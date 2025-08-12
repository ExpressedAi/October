import { NextRequest, NextResponse } from "next/server";
import { sylviaDB } from "@/lib/indexeddb";

interface CrawlRequest {
  url: string;
  limit?: number;
  formats?: string[];
  proxy?: string;
  apiKey?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { url, limit, formats, proxy, apiKey } = (await req.json()) as CrawlRequest;

    // Get settings from IndexedDB
    const extensionSettings = await sylviaDB.getExtensionSettings();
    const firecrawlSettings = extensionSettings.firecrawl;

    // Use provided parameters or fall back to settings or defaults
    const finalLimit = limit ?? 10;
    const finalFormats = formats || (firecrawlSettings ? 
      Object.entries(firecrawlSettings.formats)
        .filter(([_, enabled]) => enabled)
        .map(([format, _]) => format) 
      : ["markdown"]);
    const finalProxy = proxy || (firecrawlSettings?.proxy ?? "basic");

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Use provided API key or hardcoded fallback
    const firecrawlKey = apiKey || 'fc-b61ab628e25f4270ad0bcdd2c55700c2';

    if (!firecrawlKey || firecrawlKey === 'fc-YOUR_API_KEY_HERE') {
      return NextResponse.json(
        { error: "Firecrawl API key not configured. Please add your API key in Extensions settings." },
        { status: 400 }
      );
    }

    // Make request to Firecrawl API
    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/crawl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firecrawlKey}`
      },
      body: JSON.stringify({
        url: url,
        limit: Math.min(finalLimit, 100), // Cap at 100 pages
        proxy: finalProxy,
        scrapeOptions: {
          formats: finalFormats
        }
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

    // If this is an async crawl (returns ID), we need to poll for results
    if (result.id) {
      // For now, return the job ID - in a real implementation you'd poll for completion
      return NextResponse.json({
        success: true,
        jobId: result.id,
        status: "processing",
        message: "Crawl started. This is a background job that may take several minutes to complete."
      });
    }

    // Synchronous response with data
    return NextResponse.json({
      success: true,
      data: result.data,
      creditsUsed: result.creditsUsed,
      total: result.total,
      completed: result.completed
    });

  } catch (error) {
    console.error("Error in Firecrawl crawl API route:", error);
    return NextResponse.json(
      { error: "An error occurred while crawling the URL." },
      { status: 500 }
    );
  }
}