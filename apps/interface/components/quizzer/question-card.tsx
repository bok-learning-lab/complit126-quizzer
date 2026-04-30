"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AudioRecorder } from "./audio-recorder";

type Status = "idle" | "transcribing" | "transcribed" | "feedback-loading" | "done" | "error";

export function QuestionCard({
  index,
  total,
  label,
  unit,
  question,
  addendum,
  questionType,
}: {
  index: number;
  total: number;
  label: string;
  unit?: string;
  question: string;
  addendum?: string;
  questionType: "specific" | "big";
}) {
  const [status, setStatus] = React.useState<Status>("idle");
  const [transcript, setTranscript] = React.useState<string>("");
  const [feedback, setFeedback] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);

  async function handleAudio(blob: Blob) {
    setError(null);
    setStatus("transcribing");
    try {
      const fd = new FormData();
      fd.append("audio", blob, "answer.webm");
      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "transcription failed");
      setTranscript(data.text || "");
      setStatus("transcribed");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "transcription failed");
      setStatus("error");
    }
  }

  async function getFeedback() {
    setError(null);
    setStatus("feedback-loading");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionType,
          question,
          addendum,
          transcript,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "feedback failed");
      setFeedback(data.feedback || "");
      setStatus("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "feedback failed");
      setStatus("error");
    }
  }

  const lockRecorder =
    status === "transcribing" || status === "feedback-loading";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardDescription className="uppercase tracking-wide text-xs">
            {label} {index} of {total}
            {unit ? ` · ${unit}` : ""}
            {questionType === "big" ? " · 4 min" : " · 2–3 min"}
          </CardDescription>
        </div>
        <CardTitle className="text-xl leading-snug font-normal">
          {question}
        </CardTitle>
        {addendum && (
          <p className="mt-2 text-sm italic text-muted-foreground">
            {addendum}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <AudioRecorder onAudioReady={handleAudio} disabled={lockRecorder} />

        {status === "transcribing" && (
          <p className="text-sm text-muted-foreground">Transcribing your answer…</p>
        )}

        {transcript && (
          <details className="rounded-md border p-3 text-sm" open>
            <summary className="cursor-pointer select-none font-medium">
              Transcript
            </summary>
            <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
              {transcript}
            </p>
          </details>
        )}

        {status === "transcribed" && (
          <Button onClick={getFeedback} className="self-start">
            Get reflective feedback
          </Button>
        )}

        {status === "feedback-loading" && (
          <p className="text-sm text-muted-foreground">
            Asking Claude for some questions to think about…
          </p>
        )}

        {feedback && (
          <div className="rounded-md border bg-muted/40 p-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
              Reflective feedback
            </p>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {feedback}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={getFeedback}
              disabled={lockRecorder}
            >
              Ask again
            </Button>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">Error: {error}</p>
        )}
      </CardContent>
    </Card>
  );
}
