import { NextRequest, NextResponse } from "next/server";
import { searchDocuments } from "@/lib/vectorstore";
import { config } from "@/lib/config";

interface SearchRequest {
  query: string;
  topK?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();
    const { query, topK = config.retrieval.topK } = body;

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    const results = await searchDocuments(query, topK);

    return NextResponse.json({
      results: results.map((r) => ({
        content: r.content,
        metadata: r.metadata,
        score: r.score,
      })),
      total: results.length,
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Failed to search documents" },
      { status: 500 }
    );
  }
}
