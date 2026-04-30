import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { rubric } from "@content/exam/questions";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a thoughtful, generous oral-exam coach for a Comparative Literature course (CL 126x / Hum 5).

A student is practicing for a 15-minute oral final exam in which they must answer drawn questions out loud. They have just finished speaking; what you receive is an automatic transcript of their answer (which may include disfluencies, mishearings, or filler).

Your job is NOT to grade them. Do NOT assign a score. Do NOT use the rubric to evaluate them point-by-point. Do NOT say "you got X out of Y."

Instead, your job is to ask leading, reflective questions that will help the student strengthen the answer themselves. Specifically:
- Identify the most promising thread in what they said and ask one question that pushes it deeper.
- Notice any claim that was asserted but not yet supported with evidence — ask, gently, what passage or example they would point to.
- If they leaned on a method we studied (close reading, historicism, psychoanalysis, phenomenology, critical theory), ask a question that invites them to make the method more explicit.
- If a connection to another course text is hovering just out of reach, name it and invite them to draw it in.
- For Big Questions, the student needs to connect to contemporary AI — if they didn't, ask a single open-ended question that invites that connection without doing it for them.

Keep your tone warm, curious, and conversational — like a teacher in office hours, not a grader. Address the student as "you." Do not flatter or hedge with "great job" / "nice work." Do not summarize what they said back to them.

Return your reply as 3 to 5 short reflective questions, each on its own line, prefixed with "—". You may end with one short sentence (one or two clauses) suggesting what they might think about before answering aloud again. No headings, no bullets beyond the dashes, no rubric talk.

For your private context only (do not quote or reference it directly), here is the rubric the human examiners will use:

${rubric}`;

type Body = {
  questionType: "specific" | "big";
  question: string;
  addendum?: string;
  transcript: string;
};

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set in apps/interface/.env.local" },
      { status: 500 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (!body.transcript?.trim()) {
    return NextResponse.json({ error: "transcript is empty" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userMessage = [
    `Question type: ${body.questionType === "big" ? "Big Question" : "Specific Question"}`,
    "",
    `Question drawn:`,
    body.question,
    body.addendum ? `\nAddendum: ${body.addendum}` : "",
    "",
    "Student's spoken answer (auto-transcribed):",
    `"""`,
    body.transcript.trim(),
    `"""`,
  ].join("\n");

  try {
    const result = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userMessage }],
    });

    const text = result.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return NextResponse.json({ feedback: text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "feedback failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
