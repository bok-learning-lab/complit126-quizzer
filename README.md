# CL 126x / Hum 5 — Oral Exam Quizzer

A small webapp that lets students rehearse the final oral exam: it draws two
specific questions and one big question, runs a 15-minute prep timer, records
the student's spoken answer, transcribes it with Whisper, and asks Claude to
return reflective questions (no grades, no rubric scores) to help the student
go deeper.

## Where the questions live

All exam content is hardcoded in [`_content/exam/questions.ts`](./_content/exam/questions.ts).
Edit that file to change questions, units, the rubric, or the list of works —
the app imports it directly via the `@content/*` path alias.

## Getting Started

```bash
# 1. Install
pnpm install

# 2. Configure API keys (server-side only)
cp apps/interface/.env.local.example apps/interface/.env.local
# then edit apps/interface/.env.local and fill in:
#   ANTHROPIC_API_KEY  – for reflective feedback (claude-sonnet-4-6)
#   OPENAI_API_KEY     – for Whisper transcription (whisper-1)

# 3. Run
pnpm dev
```

Open <http://localhost:3000>. Grant microphone permission when prompted.

## Flow

1. **Draw** — two specific questions from different units (so they don't cover
   the same texts) plus one big question.
2. **Prep** — optional 15-minute countdown.
3. **Record** — for each question: record audio in-browser, send to
   `/api/transcribe` (Whisper), see the transcript, then click "Get reflective
   feedback" to send the transcript to `/api/feedback` (Claude).

Claude's system prompt explicitly forbids scoring — it returns 3–5 leading
questions designed to help the student strengthen their own answer.

## Tech Stack

- pnpm workspaces, Next.js 15, React 19
- Tailwind CSS v4 + shadcn/ui
- `@anthropic-ai/sdk` for Claude, `openai` for Whisper
- Browser `MediaRecorder` for audio capture

## Structure

- `_content/exam/questions.ts` — hardcoded questions, works, rubric
- `_content/docs/` — markdown docs (rendered at `/docs`)
- `apps/interface/app/page.tsx` — quizzer UI
- `apps/interface/app/api/transcribe/route.ts` — Whisper proxy
- `apps/interface/app/api/feedback/route.ts` — Claude proxy
- `apps/interface/components/quizzer/` — recorder, question card, prep timer
