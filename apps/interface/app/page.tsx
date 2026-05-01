"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { drawQuestions, type DrawnSet } from "@/lib/quizzer/draw";
import {
  QuestionCard,
  type PauseReason,
  type AnswerProgress,
} from "@/components/quizzer/question-card";
import { PrepTimer } from "@/components/quizzer/prep-timer";

type Stage = "intro" | "drawn" | "prep" | "exam" | "timeup" | "done";

const EXAM_SECONDS = 15 * 60;

type ActiveQ = {
  key: string;
  label: string;
  unit?: string;
  question: string;
  addendum?: string;
  questionType: "specific" | "big";
};

type AnswerLog = ActiveQ & AnswerProgress;

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
  const [answers, setAnswers] = React.useState<Record<string, AnswerLog>>({});

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

  function draw() {
    const set = drawQuestions();
    setDrawn(set);
    setQuestions(flatten(set));
    setCurrentIdx(0);
    setSecondsLeft(EXAM_SECONDS);
    setPauseReason(null);
    setAnswers({});
    setStage("drawn");
  }

  function reset() {
    setDrawn(null);
    setQuestions([]);
    setCurrentIdx(0);
    setSecondsLeft(EXAM_SECONDS);
    setPauseReason(null);
    setAnswers({});
    setStage("intro");
  }

  function nextQuestion() {
    if (currentIdx + 1 >= questions.length) {
      setStage("done");
      return;
    }
    setCurrentIdx((i) => i + 1);
  }

  const currentQ = questions[currentIdx];
  const recordAnswer = React.useCallback(
    (progress: AnswerProgress) => {
      if (!currentQ) return;
      setAnswers((prev) => ({
        ...prev,
        [currentQ.key]: { ...currentQ, ...progress },
      }));
    },
    [currentQ],
  );

  const orderedAnswers = React.useMemo<AnswerLog[]>(
    () => questions.map((q) => answers[q.key]).filter(Boolean) as AnswerLog[],
    [questions, answers],
  );

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

        {stage === "intro" && <Intro onDraw={draw} />}

        {stage === "drawn" && drawn && (
          <Drawn
            drawn={drawn}
            onPrep={() => setStage("prep")}
            onSkipPrep={() => setStage("exam")}
            onRedraw={draw}
          />
        )}

        {stage === "prep" && drawn && (
          <Prep drawn={drawn} onDone={() => setStage("exam")} />
        )}

        {stage === "exam" && drawn && currentQ && (
          <QuestionCard
            key={currentQ.key}
            index={currentIdx + 1}
            total={questions.length}
            label={currentQ.label}
            unit={currentQ.unit}
            question={currentQ.question}
            addendum={currentQ.addendum}
            questionType={currentQ.questionType}
            onPauseChange={setPauseReason}
            onAnswerChange={recordAnswer}
            onComplete={nextQuestion}
            isLast={currentIdx + 1 === questions.length}
          />
        )}

        {stage === "done" && (
          <Wrap title="That's a session" onAgain={draw} onHome={reset}>
            <p>
              You worked through all three questions inside the fifteen
              minutes. Below is a coach&apos;s note from Claude — what came
              through, what&apos;s worth pushing on next.
            </p>
            <Summary answers={orderedAnswers} />
          </Wrap>
        )}

        {stage === "timeup" && (
          <TimeUpOverlay
            answers={orderedAnswers}
            onAgain={draw}
            onHome={reset}
          />
        )}

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

function Intro({ onDraw }: { onDraw: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rehearse the oral exam</CardTitle>
        <CardDescription className="space-y-3 pt-2 text-sm leading-relaxed">
          <span className="block">
            On the day, you arrive fifteen minutes early, draw three slips, and
            have fifteen minutes of closed-book prep. Then you spend two to
            three minutes on each specific question and four minutes on the
            big question, with notes in front of you.
          </span>
          <span className="block">
            This rehearsal mirrors that. You&apos;ll draw two specific
            questions (from different units, so they don&apos;t cover the same
            texts) plus one big question with its AI addendum. Take a
            fifteen-minute prep window if you want it, or skip straight into
            the questions. Then a fifteen-minute Q&amp;A timer starts.
          </span>
          <span className="block">
            For each question, record your spoken answer. Claude generates five
            candidate follow-ups and a second judge call picks the best one —
            you&apos;ll only see one. You can record a response to it or skip
            ahead. The clock pauses while Claude is thinking and while
            you&apos;re replaying your own audio.
          </span>
          <span className="block">
            At the end (or when the timer runs out), Claude reads back through
            your answers and sends you a coach&apos;s note — what was sharp,
            what&apos;s still finding its shape, and a few concrete things to
            work on. No grades, no numbers.
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={onDraw} size="lg">
          Draw your questions
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          Microphone permission required.
        </p>
      </CardContent>
    </Card>
  );
}

function Drawn({
  drawn,
  onPrep,
  onSkipPrep,
  onRedraw,
}: {
  drawn: DrawnSet;
  onPrep: () => void;
  onSkipPrep: () => void;
  onRedraw: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>You drew</CardTitle>
        <CardDescription>
          Two specific questions and one big question. Take a fifteen-minute
          prep window or skip straight into the recording phase.
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
        <div className="grid gap-3 sm:grid-cols-2">
          <Button onClick={onPrep} size="lg">
            Start 15-min prep
          </Button>
          <Button onClick={onSkipPrep} variant="outline" size="lg">
            Skip prep — start exam
          </Button>
        </div>
        <Button variant="ghost" onClick={onRedraw} className="self-start">
          Redraw
        </Button>
      </CardContent>
    </Card>
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
            Closed-book on the day. For practice, do whatever helps.
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
            <p className="mt-1 italic text-muted-foreground">
              {drawn.big.addendum}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Wrap({
  title,
  children,
  onAgain,
  onHome,
}: {
  title: string;
  children: React.ReactNode;
  onAgain: () => void;
  onHome: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="pt-2 text-sm leading-relaxed">
          {children}
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
  answers,
  onAgain,
  onHome,
}: {
  answers: AnswerLog[];
  onAgain: () => void;
  onHome: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background/95 p-6 backdrop-blur-sm">
      <div className="mx-auto max-w-3xl">
        <Card className="w-full">
          <CardHeader>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              00:00
            </p>
            <CardTitle className="text-3xl">Time&apos;s up.</CardTitle>
            <CardDescription className="pt-2 text-sm leading-relaxed">
              The fifteen minutes are gone. Below is a coach&apos;s note on
              what you got down — useful even from a partial run.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <Summary answers={answers} />
            <div className="flex gap-3">
              <Button onClick={onAgain} size="lg">
                Draw again
              </Button>
              <Button variant="outline" onClick={onHome} size="lg">
                Back to start
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Summary({ answers }: { answers: AnswerLog[] }) {
  const [feedback, setFeedback] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    if (answers.length === 0) {
      setLoading(false);
      setError("You didn't record any answers — nothing to summarize yet.");
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || "summary failed");
        setFeedback(data.feedback || "");
      } catch (e: unknown) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "summary failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  // run once on mount with the snapshot of answers
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-lg border bg-muted/40 p-5">
      <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">
        Coach&apos;s note · feedback, not a grade
      </p>
      {loading && (
        <p className="text-sm text-muted-foreground">
          Reading back through your answers and lining them up against the
          rubric…
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {feedback && (
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {feedback}
        </div>
      )}
    </div>
  );
}
