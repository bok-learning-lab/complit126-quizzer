"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AudioRecorder } from "./audio-recorder";

type Phase =
  | "ready"
  | "main-transcribing"
  | "followup-loading"
  | "followup-ready"
  | "followup-answering"
  | "followup-transcribing"
  | "followup-done"
  | "error";

export type PauseReason = "playback" | "thinking" | null;

export type AnswerProgress = {
  mainTranscript: string;
  followupQuestion?: string;
  followupTranscript?: string;
};

export function QuestionCard({
  index,
  total,
  label,
  unit,
  question,
  addendum,
  questionType,
  onPauseChange,
  onAnswerChange,
  onComplete,
  isLast,
}: {
  index: number;
  total: number;
  label: string;
  unit?: string;
  question: string;
  addendum?: string;
  questionType: "specific" | "big";
  onPauseChange?: (reason: PauseReason) => void;
  onAnswerChange?: (progress: AnswerProgress) => void;
  onComplete: () => void;
  isLast?: boolean;
}) {
  const [phase, setPhase] = React.useState<Phase>("ready");
  const [transcript, setTranscript] = React.useState<string>("");
  const [followup, setFollowup] = React.useState<string>("");
  const [followupTranscript, setFollowupTranscript] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);
  const [audioPlaying, setAudioPlaying] = React.useState(false);

  // Combine audio playback with thinking-state into a single pause signal for the
  // parent's countdown clock. Replay and follow-up generation both pause it.
  React.useEffect(() => {
    let reason: PauseReason = null;
    if (audioPlaying) reason = "playback";
    else if (phase === "followup-loading") reason = "thinking";
    onPauseChange?.(reason);
  }, [audioPlaying, phase, onPauseChange]);

  // Make sure we don't leave the timer paused when this card unmounts.
  React.useEffect(() => {
    return () => onPauseChange?.(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lift transcripts up so the page can build a session-wide cache for the
  // end-of-session rubric summary, even if the student runs out of time mid-card.
  React.useEffect(() => {
    if (!transcript) return;
    onAnswerChange?.({
      mainTranscript: transcript,
      followupQuestion: followup || undefined,
      followupTranscript: followupTranscript || undefined,
    });
  }, [transcript, followup, followupTranscript, onAnswerChange]);

  async function transcribe(blob: Blob): Promise<string> {
    const fd = new FormData();
    fd.append("audio", blob, "answer.webm");
    const res = await fetch("/api/transcribe", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "transcription failed");
    return data.text || "";
  }

  async function fetchFollowup(transcriptText: string): Promise<string> {
    const res = await fetch("/api/followup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionType, question, addendum, transcript: transcriptText }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "follow-up failed");
    return data.question || "";
  }

  async function handleMainAudio(blob: Blob) {
    setError(null);
    setPhase("main-transcribing");
    try {
      const t = await transcribe(blob);
      setTranscript(t);
      setPhase("followup-loading");
      const f = await fetchFollowup(t);
      setFollowup(f);
      setPhase("followup-ready");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "something went wrong");
      setPhase("error");
    }
  }

  async function handleFollowupAudio(blob: Blob) {
    setError(null);
    setPhase("followup-transcribing");
    try {
      const t = await transcribe(blob);
      setFollowupTranscript(t);
      setPhase("followup-done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "something went wrong");
      setPhase("error");
    }
  }

  const showFollowupSection = [
    "followup-ready",
    "followup-answering",
    "followup-transcribing",
    "followup-done",
  ].includes(phase);

  // Bottom Next button is only useful as the natural exit at the end (or to bail
  // out on error). The followup-ready stage has its own dedicated either/or.
  const showBottomNext = phase === "followup-done" || phase === "error";

  const nextLabel = isLast ? "Finish" : "Next question →";

  return (
    <Card>
      <CardHeader>
        <CardDescription className="uppercase tracking-wide text-xs">
          {label} {index} of {total}
          {unit ? ` · ${unit}` : ""}
        </CardDescription>
        <CardTitle className="text-2xl leading-snug font-normal">
          {question}
        </CardTitle>
        {addendum && (
          <p className="mt-2 text-sm italic text-muted-foreground">
            {addendum}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <AudioRecorder
          onAudioReady={handleMainAudio}
          onPlayingChange={setAudioPlaying}
          disabled={phase === "main-transcribing" || phase === "followup-loading"}
        />

        {phase === "main-transcribing" && (
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

        {phase === "followup-loading" && (
          <p className="text-sm text-muted-foreground">
            Claude is generating five candidate follow-ups, then a second call
            picks the best one. The clock is paused while this runs.
          </p>
        )}

        {showFollowupSection && (
          <div className="rounded-lg border bg-muted/40 p-5">
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
              Follow-up question
            </p>
            <p className="mb-4 text-base leading-snug">{followup}</p>

            {phase === "followup-ready" && (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  You can record a quick response (60–90 seconds) to push your
                  thinking, or skip ahead and save the time for the next
                  question.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    onClick={() => setPhase("followup-answering")}
                    size="lg"
                    className="h-auto whitespace-normal py-3 text-left"
                  >
                    Answer this follow-up
                  </Button>
                  <Button
                    onClick={onComplete}
                    variant="outline"
                    size="lg"
                    className="h-auto whitespace-normal py-3 text-left"
                  >
                    {isLast ? "Finish without answering" : "Skip — next question →"}
                  </Button>
                </div>
              </div>
            )}

            {phase === "followup-answering" && (
              <AudioRecorder
                onAudioReady={handleFollowupAudio}
                onPlayingChange={setAudioPlaying}
              />
            )}

            {phase === "followup-transcribing" && (
              <p className="text-sm text-muted-foreground">
                Transcribing your follow-up answer…
              </p>
            )}

            {followupTranscript && (
              <details className="mt-3 rounded-md border bg-background p-3 text-sm" open>
                <summary className="cursor-pointer select-none font-medium">
                  Follow-up transcript
                </summary>
                <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                  {followupTranscript}
                </p>
              </details>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">Error: {error}</p>
        )}

        {showBottomNext && (
          <div className="flex justify-end">
            <Button onClick={onComplete} size="lg">
              {nextLabel}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
