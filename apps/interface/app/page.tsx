"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { drawQuestions, type DrawnSet } from "@/lib/quizzer/draw";
import { QuestionCard } from "@/components/quizzer/question-card";
import { PrepTimer } from "@/components/quizzer/prep-timer";

type Stage = "intro" | "drawn" | "prep" | "exam";

export default function Home() {
  const [stage, setStage] = React.useState<Stage>("intro");
  const [drawn, setDrawn] = React.useState<DrawnSet | null>(null);

  function draw() {
    setDrawn(drawQuestions());
    setStage("drawn");
  }

  function reset() {
    setDrawn(null);
    setStage("intro");
  }

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              CL 126x &middot; Hum 5
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
              Final Oral Exam — Practice
            </h1>
          </div>
          {stage !== "intro" && (
            <Button variant="ghost" onClick={reset} size="sm">
              Start over
            </Button>
          )}
        </header>

        {stage === "intro" && <Intro onBegin={draw} />}

        {stage === "drawn" && drawn && (
          <Drawn
            drawn={drawn}
            onRedraw={draw}
            onPrep={() => setStage("prep")}
            onSkip={() => setStage("exam")}
          />
        )}

        {stage === "prep" && drawn && (
          <Prep drawn={drawn} onDone={() => setStage("exam")} />
        )}

        {stage === "exam" && drawn && <Exam drawn={drawn} />}

        <footer className="mt-16 text-xs text-muted-foreground">
          Source of truth for questions:{" "}
          <code className="rounded bg-muted px-1.5 py-0.5">_content/exam/questions.ts</code>.{" "}
          <Link href="/docs" className="underline underline-offset-4">
            Project docs
          </Link>
        </footer>
      </div>
    </main>
  );
}

function Intro({ onBegin }: { onBegin: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Practice the oral exam</CardTitle>
        <CardDescription>
          Draw three slips: two specific questions (from different units, so they
          don&apos;t cover the same texts) and one big question. Take 15 minutes
          to prep, then record an answer for each. Whisper transcribes you, then
          Claude asks reflective questions to help you go deeper. No grades.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={onBegin} size="lg">
          Draw your questions
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          Microphone permission required for recording.
        </p>
      </CardContent>
    </Card>
  );
}

function Drawn({
  drawn,
  onRedraw,
  onPrep,
  onSkip,
}: {
  drawn: DrawnSet;
  onRedraw: () => void;
  onPrep: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>You drew</CardTitle>
          <CardDescription>
            Two specific questions and one big question. Read them, then start
            your 15-minute prep.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {drawn.specific.map((q, i) => (
            <div key={i} className="rounded-md border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Specific {i + 1} · {q.unit}
              </p>
              <p className="mt-1 leading-snug">{q.question}</p>
            </div>
          ))}
          <div className="rounded-md border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Big question
            </p>
            <p className="mt-1 leading-snug">{drawn.big.question}</p>
            <p className="mt-2 text-sm italic text-muted-foreground">
              {drawn.big.addendum}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onPrep}>Start 15-min prep</Button>
            <Button variant="outline" onClick={onSkip}>
              Skip prep, go to recording
            </Button>
            <Button variant="ghost" onClick={onRedraw}>
              Redraw
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Prep({ drawn, onDone }: { drawn: DrawnSet; onDone: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <PrepTimer onDone={onDone} />
      <Card>
        <CardHeader>
          <CardTitle>Your questions</CardTitle>
          <CardDescription>
            Closed book during the real exam — but for practice, do whatever
            helps.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          {drawn.specific.map((q, i) => (
            <div key={i}>
              <span className="font-medium">Specific {i + 1}:</span>{" "}
              <span className="text-muted-foreground">{q.unit}</span>
              <p className="mt-0.5">{q.question}</p>
            </div>
          ))}
          <div>
            <span className="font-medium">Big question:</span>
            <p className="mt-0.5">{drawn.big.question}</p>
            <p className="mt-1 italic text-muted-foreground">{drawn.big.addendum}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Exam({ drawn }: { drawn: DrawnSet }) {
  return (
    <div className="flex flex-col gap-6">
      {drawn.specific.map((q, i) => (
        <QuestionCard
          key={`s-${i}`}
          index={i + 1}
          total={2}
          label="Specific question"
          unit={q.unit}
          question={q.question}
          questionType="specific"
        />
      ))}
      <QuestionCard
        index={1}
        total={1}
        label="Big question"
        question={drawn.big.question}
        addendum={drawn.big.addendum}
        questionType="big"
      />
    </div>
  );
}
