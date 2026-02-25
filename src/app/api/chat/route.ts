import { NextRequest, NextResponse } from "next/server";
import { routeRequest } from "@/lib/ai-router";
import { checkUsageLimit } from "@/lib/usage";

export async function POST(req: NextRequest) {
  try {
    const { characterId, taskId, message, userId } = await req.json();

    if (!characterId || !taskId || !message || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const usage = await checkUsageLimit(userId);
    if (!usage.allowed) {
      return NextResponse.json(
        {
          error: "Daily request limit reached",
          used: usage.used,
          limit: usage.limit,
        },
        { status: 429 }
      );
    }

    const result = await routeRequest(characterId, taskId, message, userId);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
