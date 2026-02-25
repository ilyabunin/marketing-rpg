import { NextRequest, NextResponse } from "next/server";
import { sendWebhook } from "@/lib/webhooks";

export async function POST(req: NextRequest) {
  try {
    const { characterId, taskId, result, userId } = await req.json();

    if (!characterId || !taskId || !result) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const webhookResult = await sendWebhook(taskId, {
      character: characterId,
      task: taskId,
      user: userId || "anonymous",
      result,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(webhookResult);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
