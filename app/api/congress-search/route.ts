import { NextResponse } from "next/server";

// Congress.gov API base URL
const CONGRESS_API_BASE = "https://api.congress.gov/v3";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  // Return error if no query provided
  if (!query || !query.trim()) {
    return NextResponse.json(
      { success: false, error: "Missing search query" },
      { status: 400 }
    );
  }

  const apiKey = process.env.CONGRESS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "Congress API key not configured" },
      { status: 500 }
    );
  }

  try {
    // Search legislation on Congress.gov
    // Docs: https://api.congress.gov/#/legislation/bill_list_all
    const url = new URL(`${CONGRESS_API_BASE}/bill`);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("query", query.trim());
    url.searchParams.set("limit", "20");
    url.searchParams.set("format", "json");

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      // Cache for 60 seconds to avoid hammering the API
      next: { revalidate: 60 },
    } as RequestInit);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Congress API error:", response.status, errorText);
      return NextResponse.json(
        {
          success: false,
          error: `Congress API returned ${response.status}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Normalize results into simplified shape
    const results = (data.bills || []).map((bill: {
      title?: string;
      number?: string | number;
      congress?: string | number;
      latestAction?: { actionDate?: string; text?: string };
      url?: string;
    }) => ({
      title: bill.title || "Untitled",
      number: bill.number ?? null,
      congress: bill.congress ?? null,
      latestAction: bill.latestAction
        ? {
            date: bill.latestAction.actionDate || null,
            text: bill.latestAction.text || null,
          }
        : null,
      url: bill.url || null,
    }));

console.log(
  "Congress Search Query:",
  query
);

console.log(
  "Results:",
  JSON.stringify(results.slice(0, 3), null, 2)
);

    return NextResponse.json({
      success: true,
      query: query.trim(),
      total: results.length,
      results,
    });
  } catch (err) {
    console.error("Congress search error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch from Congress.gov",
      },
      { status: 500 }
    );
  }
}