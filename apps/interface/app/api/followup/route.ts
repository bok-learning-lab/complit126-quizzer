import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { rubric } from "@content/exam/questions";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-sonnet-4-6";

// Stage 1: generate 5 candidate follow-up questions.
const GENERATOR_SYSTEM = `You are an oral-exam coach for a Comparative Literature course (CL 126x / Hum 5).

A student has just spoken an answer to a drawn exam question. You receive an automatic transcript (which may contain disfluencies, mishearings, or filler). The student is in the middle of a timed 15-minute practice session and only has time for ONE follow-up question.

Your job here is to brainstorm 5 candidate follow-up questions. Each candidate should:
- Be a single, focused question (one or two sentences max).
- Be specific to what the student actually said — not generic.
- Push their thinking deeper rather than ask for restatement.
- Be answerable aloud in roughly 60–90 seconds.
- Be warm and curious in tone, like a teacher in office hours.

Do NOT score. Do NOT summarize what the student said. Do NOT flatter them. Do NOT explain why you picked each question.

Return exactly 5 candidates, one per line, prefixed with "— " (em-dash + space). No headings, no numbering, no extra prose.

For your private context only (do not quote it back), here is the rubric the human examiners will use:

${rubric}`;

// Stage 2: judge picks the single best candidate.
const JUDGE_SYSTEM = `You are choosing the single most useful follow-up question for a student rehearsing an oral exam. They will only see ONE question. Choose well.

You will be given the original drawn question, the student's spoken answer (transcribed), and 5 candidate follow-up questions.

Pick the candidate that:
1. Pushes the student's thinking the deepest given what they actually said (not generic).
2. Most clearly closes a gap in their answer — something asserted but unsupported, a tension they didn't notice, a connection to a course text or method that's hovering just out of reach.
3. Is answerable aloud in 60–90 seconds.
4. Is not redundant with anything they already covered well.

Return ONLY the text of the chosen question. No dashes, no numbering, no quotation marks, no preamble, no explanation. Just the question itself, exactly as you'd want the student to read it.`;

type Body = {
  questionType: "specific" | "big";
  question: string;
  addendum?: string;
  transcript: string;
};

function parseCandidates(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^[—–-]\s*/, "").trim())
    .filter((l) => l.length > 0);
}

function extractText(msg: Anthropic.Message): string {
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

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

  const userBlock = [
    `Question type: ${body.questionType === "big" ? "Big Question" : "Specific Question"}`,
    "",
    "Question drawn:",
    body.question,
    body.addendum ? `\nAddendum: ${body.addendum}` : "",
    "",
    "Student's spoken answer (auto-transcribed):",
    `"""`,
    body.transcript.trim(),
    `"""`,
  ].join("\n");

  try {
    const generated = await client.messages.create({
      model: MODEL,
      max_tokens: 800,
      system: [
        { type: "text", text: GENERATOR_SYSTEM, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: userBlock }],
    });
    const candidates = parseCandidates(extractText(generated));

    if (candidates.length === 0) {
      return NextResponse.json(
        { error: "no candidate follow-ups generated" },
        { status: 502 },
      );
    }
    if (candidates.length === 1) {
      return NextResponse.json({ question: candidates[0], candidates });
    }

    const judgeUser = [
      userBlock,
      "",
      "Candidate follow-up questions:",
      ...candidates.map((c, i) => `${i + 1}. ${c}`),
    ].join("\n");

    const judged = await client.messages.create({
      model: MODEL,
      max_tokens: 200,
      system: [
        { type: "text", text: JUDGE_SYSTEM, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: judgeUser }],
    });
    const winnerText = extractText(judged).replace(/^["“”]|["“”]$/g, "").trim();

    // Defensive: if the judge returned something off, fall back to first candidate.
    const winner = winnerText.length > 5 ? winnerText : candidates[0];

    return NextResponse.json({ question: winner, candidates });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "follow-up generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
