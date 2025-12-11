# RAG Assistant - Vercel AI App

A modern RAG (Retrieval-Augmented Generation) system built with Next.js, Pinecone, and Claude. Deployed on Vercel.

![RAG Assistant](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![Pinecone](https://img.shields.io/badge/Pinecone-Vector%20DB-purple?style=flat-square)
![Claude](https://img.shields.io/badge/Claude-AI-orange?style=flat-square)

## Features

- **Semantic Search**: Vector similarity search powered by Pinecone
- **AI-Powered Responses**: Claude generates contextual answers
- **Modern UI**: Sleek chat interface with Tailwind CSS
- **Source Citations**: View the documents used to generate answers
- **Document Indexing**: API endpoint for adding documents to the knowledge base

## Getting Started

### Prerequisites

- Node.js 18+
- Pinecone account ([sign up free](https://app.pinecone.io/))
- Anthropic API key ([get one here](https://console.anthropic.com/))

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/vercel-rag.git
   cd vercel-rag
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment file and add your keys:
   ```bash
   cp .env.example .env.local
   ```

4. Configure your `.env.local`:
   ```env
   ANTHROPIC_API_KEY=sk-ant-api03-xxx
   PINECONE_API_KEY=xxx
   PINECONE_INDEX_NAME=rag-index
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## API Endpoints

### POST /api/chat
Send a message and get an AI-powered response with sources.

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the standard pipeline?"}'
```

### POST /api/search
Search the vector database directly.

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "phenotype definitions", "topK": 5}'
```

### POST /api/index
Add documents to the knowledge base.

```bash
curl -X POST http://localhost:3000/api/index \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "documents": [
      {"content": "Document text here...", "metadata": {"source": "docs/example.md"}}
    ]
  }'
```

### GET /api/stats
Get vector database statistics.

```bash
curl http://localhost:3000/api/stats
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub

2. Import the project in [Vercel](https://vercel.com/new)

3. Add environment variables in Vercel dashboard:
   - `ANTHROPIC_API_KEY`
   - `PINECONE_API_KEY`
   - `PINECONE_INDEX_NAME`

4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/vercel-rag)

## Architecture

```
vercel-rag/
├── app/
│   ├── api/
│   │   ├── chat/route.ts      # Chat endpoint with RAG
│   │   ├── search/route.ts    # Direct vector search
│   │   ├── index/route.ts     # Document indexing
│   │   └── stats/route.ts     # Database stats
│   ├── globals.css            # Tailwind styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Chat UI
├── lib/
│   ├── config.ts              # App configuration
│   ├── embeddings.ts          # Embedding generation
│   └── vectorstore.ts         # Pinecone wrapper
├── vercel.json                # Vercel config
└── package.json
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Vector DB**: Pinecone
- **AI**: Anthropic Claude
- **Embeddings**: Transformers.js (all-MiniLM-L6-v2)
- **Deployment**: Vercel

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key |
| `PINECONE_API_KEY` | Yes | Your Pinecone API key |
| `PINECONE_INDEX_NAME` | No | Index name (default: rag-index) |
| `ANTHROPIC_MODEL` | No | Claude model (default: claude-sonnet-4-5-20250514) |
| `INDEX_API_KEY` | No | Secret key for indexing endpoint |

## License

MIT
