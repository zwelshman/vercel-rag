"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  Database,
  MessageSquare,
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Source {
  content: string;
  metadata: {
    source?: string;
    chunk_index?: number;
  };
  score: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const exampleQuestions = [
    "What is the standard pipeline project?",
    "How do I define phenotypes for cardiovascular conditions?",
    "What projects investigate diabetes and COVID-19?",
    "Show me examples of MI phenotype definitions",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, history: messages }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error processing your request. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">RAG Assistant</h1>
              <p className="text-xs text-gray-500">Powered by Pinecone + Claude</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Database className="w-4 h-4" />
            <span>Vector Search Active</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-5xl mx-auto flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-600/20 flex items-center justify-center mb-6 border border-purple-500/20">
                  <MessageSquare className="w-10 h-10 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Ask me anything about your codebase
                </h2>
                <p className="text-gray-400 max-w-md mb-8">
                  I use hybrid search (BM25 + vector embeddings) to find the most relevant
                  information from your indexed repositories.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
                  {exampleQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleExampleClick(question)}
                      className="p-4 text-left rounded-xl bg-gray-800/50 border border-gray-700/50 hover:border-purple-500/50 hover:bg-gray-800 transition-all group"
                    >
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                        {question}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`message-fade-in flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] ${
                        message.role === "user"
                          ? "bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl rounded-tr-sm px-4 py-3"
                          : "bg-gray-800/70 rounded-2xl rounded-tl-sm px-4 py-3 border border-gray-700/50"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <div className="prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-white">{message.content}</p>
                      )}

                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-700/50">
                          <button
                            onClick={() =>
                              setExpandedSources(
                                expandedSources === index ? null : index
                              )
                            }
                            className="flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            <FileText className="w-3 h-3" />
                            <span>{message.sources.length} sources</span>
                            {expandedSources === index ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>

                          {expandedSources === index && (
                            <div className="mt-2 space-y-2">
                              {message.sources.map((source, sourceIndex) => (
                                <div
                                  key={sourceIndex}
                                  className="p-2 rounded-lg bg-gray-900/50 border border-gray-700/30 text-xs"
                                >
                                  <div className="flex items-center gap-2 text-purple-400 mb-1">
                                    <ExternalLink className="w-3 h-3" />
                                    <span className="font-mono truncate">
                                      {source.metadata.source || "Unknown source"}
                                    </span>
                                    <span className="text-gray-500 ml-auto">
                                      {(source.score * 100).toFixed(0)}% match
                                    </span>
                                  </div>
                                  <p className="text-gray-400 line-clamp-2">
                                    {source.content.substring(0, 200)}...
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-800/70 rounded-2xl rounded-tl-sm px-4 py-3 border border-gray-700/50">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-purple-400 pulse-dot" />
                          <span className="w-2 h-2 rounded-full bg-purple-400 pulse-dot" />
                          <span className="w-2 h-2 rounded-full bg-purple-400 pulse-dot" />
                        </div>
                        <span className="text-sm text-gray-400">Searching knowledge base...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-800 bg-gray-950/80 backdrop-blur-sm p-4">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="Ask a question about your codebase..."
                  rows={1}
                  className="w-full px-4 py-3 pr-12 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 resize-none transition-all"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/20 transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Press Enter to send, Shift+Enter for new line
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
