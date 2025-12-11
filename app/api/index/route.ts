import { NextRequest, NextResponse } from "next/server";
import { upsertDocuments, ensureIndexExists, Document } from "@/lib/vectorstore";
import { config } from "@/lib/config";

interface IndexRequest {
  documents: {
    content: string;
    metadata?: Record<string, unknown>;
  }[];
  namespace?: string;
}

/**
 * Split text into chunks with overlap
 */
function splitIntoChunks(
  text: string,
  chunkSize: number = config.chunking.chunkSize,
  overlap: number = config.chunking.chunkOverlap
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);

    // Try to break at sentence boundary if possible
    if (end < text.length) {
      const lastSentenceEnd = Math.max(
        chunk.lastIndexOf(". "),
        chunk.lastIndexOf(".\n"),
        chunk.lastIndexOf("! "),
        chunk.lastIndexOf("? ")
      );

      if (lastSentenceEnd > chunkSize * 0.5) {
        chunks.push(chunk.slice(0, lastSentenceEnd + 1).trim());
        start = start + lastSentenceEnd + 1 - overlap;
        continue;
      }
    }

    chunks.push(chunk.trim());
    start = end - overlap;

    if (start >= text.length - overlap) break;
  }

  return chunks.filter((chunk) => chunk.length > 50);
}

export async function POST(request: NextRequest) {
  try {
    // Check for API key (basic auth)
    const authHeader = request.headers.get("authorization");
    const apiKey = process.env.INDEX_API_KEY;

    if (apiKey && (!authHeader || !authHeader.includes(apiKey))) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: IndexRequest = await request.json();
    const { documents, namespace } = body;

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json(
        { error: "Documents array is required" },
        { status: 400 }
      );
    }

    // Ensure index exists
    await ensureIndexExists();

    // Process documents into chunks
    const processedDocs: Document[] = [];

    for (const doc of documents) {
      const chunks = splitIntoChunks(doc.content);

      for (let i = 0; i < chunks.length; i++) {
        processedDocs.push({
          content: chunks[i],
          metadata: {
            ...doc.metadata,
            chunk_index: i,
            total_chunks: chunks.length,
          },
        });
      }
    }

    // Upsert to vector store
    const count = await upsertDocuments(processedDocs, namespace);

    return NextResponse.json({
      success: true,
      indexed: count,
      originalDocuments: documents.length,
      chunks: processedDocs.length,
    });
  } catch (error) {
    console.error("Index API error:", error);
    return NextResponse.json(
      { error: "Failed to index documents" },
      { status: 500 }
    );
  }
}
