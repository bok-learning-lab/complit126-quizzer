"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Pause, RotateCcw } from "lucide-react";

type RecorderState = "idle" | "recording" | "stopped";

export function AudioRecorder({
  onAudioReady,
  disabled,
}: {
  onAudioReady: (blob: Blob, durationSec: number) => void;
  disabled?: boolean;
}) {
  const [state, setState] = React.useState<RecorderState>("idle");
  const [elapsed, setElapsed] = React.useState(0);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const startTimeRef = React.useRef<number>(0);
  const tickRef = React.useRef<number | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  React.useEffect(() => {
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Pick a mime type the browser supports. Whisper accepts webm/ogg/mp4/mp3/wav/m4a.
      const candidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ];
      const mimeType = candidates.find((m) => MediaRecorder.isTypeSupported(m));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        const duration = (Date.now() - startTimeRef.current) / 1000;
        onAudioReady(blob, duration);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      };

      recorder.start();
      startTimeRef.current = Date.now();
      setElapsed(0);
      setState("recording");
      tickRef.current = window.setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 250);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Could not access microphone";
      setError(message);
    }
  }

  function stop() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setState("stopped");
  }

  function reset() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setElapsed(0);
    setState("idle");
    setIsPlaying(false);
  }

  function togglePlay() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  }

  const mm = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const ss = (elapsed % 60).toString().padStart(2, "0");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {state === "idle" && (
          <Button onClick={start} disabled={disabled} size="lg">
            <Mic /> Start recording
          </Button>
        )}
        {state === "recording" && (
          <Button onClick={stop} variant="destructive" size="lg">
            <Square /> Stop
          </Button>
        )}
        {state === "stopped" && audioUrl && (
          <>
            <Button onClick={togglePlay} variant="outline" size="lg">
              {isPlaying ? <Pause /> : <Play />}
              {isPlaying ? "Pause" : "Play back"}
            </Button>
            <Button onClick={reset} variant="ghost" size="lg" disabled={disabled}>
              <RotateCcw /> Re-record
            </Button>
          </>
        )}
        <span className="font-mono text-sm tabular-nums text-muted-foreground">
          {state === "recording" && (
            <span className="inline-flex items-center gap-2">
              <span className="size-2 animate-pulse rounded-full bg-red-500" />
              {mm}:{ss}
            </span>
          )}
          {state === "stopped" && `${mm}:${ss}`}
        </span>
      </div>

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      {error && (
        <p className="text-sm text-destructive">
          {error} — check that your browser has microphone permission.
        </p>
      )}
    </div>
  );
}
