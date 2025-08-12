import { NextRequest, NextResponse } from "next/server";

interface MapRequest {
  url: string;
  search?: string;
  apiKey?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { url, search, apiKey } = (await req.json()) as MapRequest;

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

    // Build request body
    const requestBody: any = { url };
    if (search) {
      requestBody.search = search;
    }

    // Make request to Firecrawl API
    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firecrawlKey}`
      },
      body: JSON.stringify(requestBody)
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
      status: result.status,
      links: result.links,
      totalLinks: result.links?.length || 0
    });

  } catch (error) {
    console.error("Error in Firecrawl map API route:", error);
    return NextResponse.json(
      { error: "An error occurred while mapping the URL." },
      { status: 500 }
    );
  }
}