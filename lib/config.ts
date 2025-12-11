/**
 * Configuration for the RAG application
 */

export const config = {
  // Pinecone Settings
  pinecone: {
    indexName: process.env.PINECONE_INDEX_NAME || "rag-index",
    cloud: process.env.PINECONE_CLOUD || "aws",
    region: process.env.PINECONE_REGION || "us-east-1",
    dimension: 768, // BAAI/llm-embedder dimension
  },

  // Model Settings
  anthropic: {
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250514",
    maxTokens: 4096,
  },

  // Embedding Settings
  embedding: {
    model: "Xenova/all-MiniLM-L6-v2", // Lightweight model for Vercel
    dimension: 384,
  },

  // Retrieval Settings
  retrieval: {
    topK: 10,
    minScore: 0.5,
  },

  // Document Processing
  chunking: {
    chunkSize: 1000,
    chunkOverlap: 200,
  },

  // Hybrid Search
  hybridSearch: {
    enabled: process.env.USE_HYBRID_SEARCH !== "false",
    bm25Weight: parseFloat(process.env.BM25_WEIGHT || "0.3"),
    vectorWeight: parseFloat(process.env.VECTOR_WEIGHT || "0.7"),
  },
};

export type Config = typeof config;
