"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

const PREP_SECONDS = 15 * 60;

export function PrepTimer({ onDone }: { onDone: () => void }) {
  const [secondsLeft, setSecondsLeft] = React.useState(PREP_SECONDS);

  React.useEffect(() => {
    const id = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  React.useEffect(() => {
    if (secondsLeft <= 0) onDone();
  }, [secondsLeft, onDone]);

  const mm = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const ss = (secondsLeft % 60).toString().padStart(2, "0");

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Prep timer
          </p>
          <p className="font-mono text-3xl tabular-nums">
            {mm}:{ss}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Closed-book on the day. For practice, do whatever helps.
          </p>
        </div>
        <Button onClick={onDone}>I&apos;m ready &rarr;</Button>
      </div>
    </div>
  );
}
