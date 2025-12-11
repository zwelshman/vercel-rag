import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { searchDocuments, SearchResult } from "@/lib/vectorstore";
import { config } from "@/lib/config";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

/**
 * Build context from search results
 */
function buildContext(sources: SearchResult[]): string {
  if (sources.length === 0) {
    return "No relevant documents found in the knowledge base.";
  }

  return sources
    .map((source, i) => {
      const sourcePath = source.metadata.source || "Unknown";
      return `[Source ${i + 1}: ${sourcePath}]\n${source.content}`;
    })
    .join("\n\n---\n\n");
}

/**
 * System prompt for the RAG assistant
 */
const SYSTEM_PROMPT = `You are a helpful AI assistant with access to a knowledge base of code repositories and documentation. Your role is to:

1. Answer questions based on the provided context from the knowledge base
2. Be accurate and cite specific sources when available
3. If the context doesn't contain relevant information, say so clearly
4. Format code snippets properly using markdown
5. Be concise but thorough in your explanations

When answering:
- Reference specific files or functions when mentioning code
- Explain concepts clearly for developers
- If you're uncertain, indicate the level of confidence
- Don't make up information not present in the context`;

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, history = [] } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Search for relevant documents
    let sources: SearchResult[] = [];
    try {
      sources = await searchDocuments(message, config.retrieval.topK);
    } catch (error) {
      console.error("Search error:", error);
      // Continue without sources if search fails
    }

    // Build context from sources
    const context = buildContext(sources);

    // Build conversation history for Claude
    const messages: { role: "user" | "assistant"; content: string }[] = [];

    // Add history
    for (const msg of history.slice(-10)) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Add current message with context
    const userMessageWithContext = `Context from knowledge base:
${context}

---

User question: ${message}

Please answer based on the context provided above. If the context doesn't contain relevant information to answer the question, let the user know.`;

    messages.push({
      role: "user",
      content: userMessageWithContext,
    });

    // Call Claude
    const response = await anthropic.messages.create({
      model: config.anthropic.model,
      max_tokens: config.anthropic.maxTokens,
      system: SYSTEM_PROMPT,
      messages,
    });

    // Extract text response
    const textContent = response.content.find((block) => block.type === "text");
    const answer = textContent?.type === "text" ? textContent.text : "I couldn't generate a response.";

    return NextResponse.json({
      answer,
      sources: sources.map((s) => ({
        content: s.content,
        metadata: s.metadata,
        score: s.score,
      })),
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
