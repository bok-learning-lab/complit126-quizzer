import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not set in apps/interface/.env.local" },
      { status: 500 },
    );
  }

  const form = await req.formData();
  const file = form.get("audio");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "missing audio file" }, { status: 400 });
  }

  const ext =
    (file.type.includes("webm") && "webm") ||
    (file.type.includes("ogg") && "ogg") ||
    (file.type.includes("mp4") && "m4a") ||
    (file.type.includes("wav") && "wav") ||
    "webm";
  const named = new File([file], `recording.${ext}`, { type: file.type || "audio/webm" });

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const result = await client.audio.transcriptions.create({
      file: named,
      model: "whisper-1",
    });
    return NextResponse.json({ text: result.text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "transcription failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
