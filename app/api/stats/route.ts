import { NextResponse } from "next/server";
import { getIndexStats, isIndexReady } from "@/lib/vectorstore";

export async function GET() {
  try {
    const ready = await isIndexReady();

    if (!ready) {
      return NextResponse.json({
        ready: false,
        message: "Index not found or not ready",
      });
    }

    const stats = await getIndexStats();

    return NextResponse.json({
      ready: true,
      ...stats,
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      { error: "Failed to get index stats" },
      { status: 500 }
    );
  }
}
