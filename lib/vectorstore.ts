/**
 * Pinecone Vector Store wrapper
 */

import { Pinecone, Index, RecordMetadata } from "@pinecone-database/pinecone";
import { generateEmbedding, generateEmbeddings } from "./embeddings";
import { config } from "./config";

export interface Document {
  content: string;
  metadata: {
    source?: string;
    chunk_index?: number;
    [key: string]: unknown;
  };
}

export interface SearchResult {
  content: string;
  metadata: Record<string, unknown>;
  score: number;
}

// Singleton Pinecone client
let pineconeClient: Pinecone | null = null;
let pineconeIndex: Index | null = null;

/**
 * Get or create Pinecone client
 */
function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error("PINECONE_API_KEY is required");
    }
    pineconeClient = new Pinecone({ apiKey });
  }
  return pineconeClient;
}

/**
 * Get or create Pinecone index
 */
async function getPineconeIndex(): Promise<Index> {
  if (!pineconeIndex) {
    const pc = getPineconeClient();
    pineconeIndex = pc.index(config.pinecone.indexName);
  }
  return pineconeIndex;
}

/**
 * Search for similar documents
 */
export async function searchDocuments(
  query: string,
  topK: number = config.retrieval.topK
): Promise<SearchResult[]> {
  const index = await getPineconeIndex();
  const queryEmbedding = await generateEmbedding(query);

  const results = await index.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
  });

  return (results.matches || [])
    .filter((match) => match.score && match.score >= config.retrieval.minScore)
    .map((match) => ({
      content: (match.metadata?.text as string) || "",
      metadata: match.metadata || {},
      score: match.score || 0,
    }));
}

/**
 * Upsert documents to vector store
 */
export async function upsertDocuments(
  documents: Document[],
  namespace?: string
): Promise<number> {
  const index = await getPineconeIndex();

  // Generate embeddings for all documents
  const texts = documents.map((doc) => doc.content);
  const embeddings = await generateEmbeddings(texts);

  // Prepare vectors for upsert
  const vectors = documents.map((doc, i) => ({
    id: `doc_${Date.now()}_${i}`,
    values: embeddings[i],
    metadata: {
      text: doc.content,
      ...doc.metadata,
    } as RecordMetadata,
  }));

  // Upsert in batches of 100
  const batchSize = 100;
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    if (namespace) {
      await index.namespace(namespace).upsert(batch);
    } else {
      await index.upsert(batch);
    }
  }

  return vectors.length;
}

/**
 * Delete all vectors in a namespace
 */
export async function deleteNamespace(namespace: string): Promise<void> {
  const index = await getPineconeIndex();
  await index.namespace(namespace).deleteAll();
}

/**
 * Get index statistics
 */
export async function getIndexStats(): Promise<{
  totalVectors: number;
  dimension: number;
}> {
  const index = await getPineconeIndex();
  const stats = await index.describeIndexStats();

  return {
    totalVectors: stats.totalRecordCount || 0,
    dimension: stats.dimension || config.pinecone.dimension,
  };
}

/**
 * Check if index exists and is ready
 */
export async function isIndexReady(): Promise<boolean> {
  try {
    const pc = getPineconeClient();
    const indexes = await pc.listIndexes();
    return indexes.indexes?.some((idx) => idx.name === config.pinecone.indexName) || false;
  } catch {
    return false;
  }
}

/**
 * Create index if it doesn't exist
 */
export async function ensureIndexExists(): Promise<void> {
  const pc = getPineconeClient();
  const exists = await isIndexReady();

  if (!exists) {
    await pc.createIndex({
      name: config.pinecone.indexName,
      dimension: 384, // all-MiniLM-L6-v2 dimension
      metric: "cosine",
      spec: {
        serverless: {
          cloud: "aws",
          region: "us-east-1",
        },
      },
    });

    // Wait for index to be ready
    await new Promise((resolve) => setTimeout(resolve, 60000));
  }
}
