import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  rubric,
  works,
  specificQuestions,
  bigQuestions,
  bigAddendum,
} from "@content/exam/questions";

export const runtime = "nodejs";
export const maxDuration = 90;

const MODEL = "claude-sonnet-4-6";

// Build a grouped view of the prep packet so Claude can reference sister
// questions in the same unit when nudging students toward specific texts.
function packetReference(): string {
  const byUnit = new Map<string, string[]>();
  for (const q of specificQuestions) {
    if (!byUnit.has(q.unit)) byUnit.set(q.unit, []);
    byUnit.get(q.unit)!.push(q.question);
  }
  const unitBlocks = Array.from(byUnit.entries()).map(([unit, qs]) => {
    return [`Unit — ${unit}`, ...qs.map((q) => `  · ${q}`)].join("\n");
  });
  return [
    "Works covered in the course (you may name any of these and tell the student to revisit it):",
    ...works.map((w) => `  · ${w}`),
    "",
    "Specific questions in the prep packet, grouped by unit (you may quote or point to a sister question in the same unit when it would help the student approach the texts from another angle):",
    "",
    unitBlocks.join("\n\n"),
    "",
    "The five \"big questions\" that motivate each unit (these are the broad framings the course is built around — quoting one when relevant can help orient the student):",
    ...bigQuestions.map((q) => `  · ${q}`),
    "",
    `Big-question addendum (always appended on the day): "${bigAddendum}"`,
  ].join("\n");
}

const SYSTEM = `You are an experienced oral-exam coach for a Comparative Literature course (CL 126x / Hum 5).

A student just finished a timed practice session. They drew two specific questions (from different units) and one big question, recorded spoken answers, and (sometimes) recorded a response to a single Claude-generated follow-up. You receive auto-transcripts of each turn — disfluencies and mishearings are expected.

YOUR JOB IS NOT TO GRADE. Your job is to give them feedback they can act on before the real exam. Students are sensitive about being assessed by an AI, and a number coming back from a model can feel weighty in ways that aren't useful here. So:

- DO NOT produce numerical scores, marks, point totals, percentages, letter grades, fractions, ranges, or any "X out of Y" estimates.
- DO NOT compare their performance to a passing threshold or imply where they would "land."
- DO NOT add up or invent point weights. The student should not be able to reverse-engineer a grade from your reply.

You MAY (and should, where it helps) quote or pose back the rubric questions the human examiners will actually ask themselves — they're written in question form on purpose. Things like: "Did you state your claims in a clear and compelling fashion?" or "Did your evidence support your claims?" or "Did you connect your observations to contemporary AI fluently?" Use these as nudges, not verdicts.

Tone:
- Warm, direct, like a tutor in office hours.
- Address the student as "you."
- Cite specific things they actually said. Don't summarize the whole transcript back.
- No flattery, no hedging, no filler. Honest about what's still thin — framed as room to grow, not a verdict.
- Use qualitative descriptors when you need to convey strength: "really clicking", "solid footing", "still finding its shape", "the muscle isn't built yet", "the shape is right but the evidence is thin", etc. Never numbers.

Use the prep packet (below) actively. Where it helps:
- Name a specific work from the packet they should revisit ("go back to the Hesiod excerpt, especially the Pandora passage", "the Bacon essay 'Of Studies' is the cleanest analogue here").
- Quote or point to a sister question in the same unit when their answer would benefit from approaching the texts from another angle.
- When the big question's connection-to-AI move is thin, quote the addendum ("the addendum asks you to cite at least two writers or thinkers we engaged with in class — name them by name").
- Invoke a unit's broader motivating question to reframe what they were really being asked.
- Pose back specific rubric questions when they pinpoint what was missing ("the examiner will be asking themselves whether your evidence supported your claim — say more about why the Pandora passage is the one to cite").

You may name and quote anything from the packet below — including the rubric questions. What you MAY NOT do is reproduce, infer, or hint at the original numeric weights of the rubric (the prose version below has the weights stripped on purpose).

Format: plain text only. No markdown asterisks. No hash headings. Use these literal section headings on their own lines, with a blank line between sections.

Structure:

Overall

Two or three sentences. Where their thinking is sharpest, where it's still finding its shape. This is a coach's read, not a grade.

Question one — Specific

Restate the question in one short line, then 2–4 sentences. Touch naturally on what they recalled, the analytic move they made (or didn't), and how they presented the claim — without using rubric labels and without scoring.

Question two — Specific

Same shape as the first.

Question three — Big

Same shape, with one sentence specifically on whether their AI connection was substantive and whether they actually drew on writers or thinkers from class.

What to focus on

Two or three concrete moves, each starting with "— " (em dash + space). The highest-leverage shifts that would most change how their answers land. Specific and actionable.

If they didn't reach a question, skip its section entirely. Do not penalize them for it; just write about what they did do.

────────────────────────────────────────────────────────────
THE PREP PACKET (you may quote, name, and point to anything in this section)
────────────────────────────────────────────────────────────

${packetReference()}

────────────────────────────────────────────────────────────
THE RUBRIC, IN PROSE FORM (numeric weights removed — quote freely)
────────────────────────────────────────────────────────────

These are the questions the human examiners will ask themselves while listening. Quoting or paraphrasing them back to the student is one of the most useful things you can do — it tells them where to focus. Just do not invent or hint at point weights.

${rubric}`;

type AnswerLog = {
  key: string;
  question: string;
  unit?: string;
  questionType: "specific" | "big";
  addendum?: string;
  mainTranscript: string;
  followupQuestion?: string;
  followupTranscript?: string;
};

type Body = { answers: AnswerLog[] };

function formatAnswers(answers: AnswerLog[]): string {
  if (answers.length === 0) return "(The student did not record any answers in this session.)";
  return answers
    .map((a, i) => {
      const lines: string[] = [];
      lines.push(`### ${i + 1}. ${a.questionType === "big" ? "Big Question" : "Specific Question"}${a.unit ? ` · ${a.unit}` : ""}`);
      lines.push(`Question: ${a.question}`);
      if (a.addendum) lines.push(`Addendum: ${a.addendum}`);
      lines.push("");
      lines.push("Student's spoken answer (auto-transcribed):");
      lines.push(`"""\n${a.mainTranscript.trim()}\n"""`);
      if (a.followupQuestion) {
        lines.push("");
        lines.push(`Follow-up that was put to them: ${a.followupQuestion}`);
        if (a.followupTranscript) {
          lines.push("Student's response to the follow-up:");
          lines.push(`"""\n${a.followupTranscript.trim()}\n"""`);
        } else {
          lines.push("(They chose to skip the follow-up.)");
        }
      }
      return lines.join("\n");
    })
    .join("\n\n---\n\n");
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
  if (!Array.isArray(body.answers)) {
    return NextResponse.json({ error: "answers must be an array" }, { status: 400 });
  }
  const filtered = body.answers.filter((a) => a.mainTranscript?.trim());
  if (filtered.length === 0) {
    return NextResponse.json(
      { error: "no transcripts to summarize" },
      { status: 400 },
    );
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userMessage = [
    `The student attempted ${filtered.length} of 3 questions in this session.`,
    "",
    "Here is the full transcript record:",
    "",
    formatAnswers(filtered),
  ].join("\n");

  try {
    const result = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: [
        { type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } },
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
    const message = err instanceof Error ? err.message : "summary failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
