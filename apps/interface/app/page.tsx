"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { drawQuestions, type DrawnSet } from "@/lib/quizzer/draw";
import { QuestionCard, type PauseReason } from "@/components/quizzer/question-card";

type Stage = "intro" | "exam" | "timeup" | "done";

const EXAM_SECONDS = 15 * 60;

type ActiveQ = {
  key: string;
  label: string;
  unit?: string;
  question: string;
  addendum?: string;
  questionType: "specific" | "big";
};

function flatten(drawn: DrawnSet): ActiveQ[] {
  return [
    ...drawn.specific.map((q, i) => ({
      key: `s-${i}`,
      label: "Specific question",
      unit: q.unit,
      question: q.question,
      questionType: "specific" as const,
    })),
    {
      key: "big",
      label: "Big question",
      question: drawn.big.question,
      addendum: drawn.big.addendum,
      questionType: "big" as const,
    },
  ];
}

export default function Home() {
  const [stage, setStage] = React.useState<Stage>("intro");
  const [drawn, setDrawn] = React.useState<DrawnSet | null>(null);
  const [questions, setQuestions] = React.useState<ActiveQ[]>([]);
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [secondsLeft, setSecondsLeft] = React.useState(EXAM_SECONDS);
  const [pauseReason, setPauseReason] = React.useState<PauseReason>(null);

  // Timer ticks once per second whenever the exam is live and nothing is
  // pausing it. Two things pause: replaying a recording, and Claude generating
  // a follow-up.
  React.useEffect(() => {
    if (stage !== "exam") return;
    if (pauseReason !== null) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [stage, pauseReason]);

  React.useEffect(() => {
    if (stage === "exam" && secondsLeft <= 0) {
      setStage("timeup");
    }
  }, [stage, secondsLeft]);

  function begin() {
    const set = drawQuestions();
    setDrawn(set);
    setQuestions(flatten(set));
    setCurrentIdx(0);
    setSecondsLeft(EXAM_SECONDS);
    setPauseReason(null);
    setStage("exam");
  }

  function reset() {
    setDrawn(null);
    setQuestions([]);
    setCurrentIdx(0);
    setSecondsLeft(EXAM_SECONDS);
    setPauseReason(null);
    setStage("intro");
  }

  function nextQuestion() {
    if (currentIdx + 1 >= questions.length) {
      setStage("done");
      return;
    }
    setCurrentIdx((i) => i + 1);
  }

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              CL 126x &middot; Hum 5
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
              Final Oral Exam — Practice
            </h1>
          </div>
          {stage === "exam" && (
            <ExamClock secondsLeft={secondsLeft} pauseReason={pauseReason} />
          )}
        </header>

        {stage === "intro" && <Intro onBegin={begin} />}

        {stage === "exam" && drawn && questions[currentIdx] && (
          <QuestionCard
            key={questions[currentIdx].key}
            index={currentIdx + 1}
            total={questions.length}
            label={questions[currentIdx].label}
            unit={questions[currentIdx].unit}
            question={questions[currentIdx].question}
            addendum={questions[currentIdx].addendum}
            questionType={questions[currentIdx].questionType}
            onPauseChange={setPauseReason}
            onComplete={nextQuestion}
            isLast={currentIdx + 1 === questions.length}
          />
        )}

        {stage === "done" && <Done onAgain={begin} onHome={reset} />}

        {stage === "timeup" && <TimeUpOverlay onAgain={begin} onHome={reset} />}

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

function ExamClock({
  secondsLeft,
  pauseReason,
}: {
  secondsLeft: number;
  pauseReason: PauseReason;
}) {
  const mm = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const ss = (secondsLeft % 60).toString().padStart(2, "0");
  const danger = secondsLeft <= 60;

  let label = "Time remaining";
  if (pauseReason === "playback") label = "Paused — replaying";
  else if (pauseReason === "thinking") label = "Paused — Claude is thinking";

  return (
    <div className="text-right">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={`font-mono text-3xl tabular-nums ${
          danger ? "text-destructive" : ""
        }`}
      >
        {mm}:{ss}
      </p>
    </div>
  );
}

function Intro({ onBegin }: { onBegin: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rehearse the oral exam</CardTitle>
        <CardDescription className="space-y-3 pt-2 text-sm leading-relaxed">
          <span className="block">
            On the day, you&apos;ll arrive fifteen minutes early, draw three
            slips, and have fifteen minutes of closed-book prep. Then you&apos;ll
            spend two to three minutes on each specific question and four
            minutes on the big question, with notes in front of you.
          </span>
          <span className="block">
            This rehearsal compresses the talking part. When you click Begin, a
            fifteen-minute timer starts and you&apos;ll see one question at a
            time: two specific questions (from different units, so they
            don&apos;t cover the same texts) and one big question with its AI
            addendum. Record your answer, then a Claude call generates five
            possible follow-ups and a second call picks the single best one.
            You can either record a response to that follow-up or skip ahead to
            the next question.
          </span>
          <span className="block">
            The clock pauses when Claude is generating a follow-up and when
            you&apos;re replaying your own recording. Otherwise it keeps
            running. If you reach zero before you&apos;ve worked through all
            three questions, the bell rings and you&apos;ll start over with a
            fresh draw — that&apos;s the practice.
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={onBegin} size="lg">
          Begin
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          Microphone permission required.
        </p>
      </CardContent>
    </Card>
  );
}

function Done({ onAgain, onHome }: { onAgain: () => void; onHome: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>That&apos;s a session</CardTitle>
        <CardDescription>
          You worked through all three questions inside the fifteen minutes.
          You can draw a fresh set and run it again, or come back to it later.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-3">
        <Button onClick={onAgain}>Draw again</Button>
        <Button variant="outline" onClick={onHome}>
          Back to start
        </Button>
      </CardContent>
    </Card>
  );
}

function TimeUpOverlay({
  onAgain,
  onHome,
}: {
  onAgain: () => void;
  onHome: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-6 backdrop-blur-sm">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            00:00
          </p>
          <CardTitle className="text-3xl">Time&apos;s up.</CardTitle>
          <CardDescription className="pt-2 text-sm leading-relaxed">
            The fifteen minutes are gone. On the day you&apos;d be wrapping up
            now; in here, you can draw a fresh set and try a different shape of
            answer. The questions you didn&apos;t reach are worth thinking
            about anyway.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button onClick={onAgain} size="lg">
            Draw again
          </Button>
          <Button variant="outline" onClick={onHome} size="lg">
            Back to start
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
