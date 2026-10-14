"use client";

import { useEffect, useState } from "react";

const QUESTIONS = [
  "Compare ball python 24-B's growth to other 2024 ball pythons",
  "Why might my female boa be refusing food?",
  "What will a Pastel Clown x het Clown pairing produce?",
  "Is 31°C a good incubation temperature for crested gecko eggs?",
];

const TYPE_MS = 45;
const DELETE_MS = 20;
const HOLD_MS = 1600;
const PAUSE_MS = 1800;

export function MontyDemo() {
  const [text, setText] = useState("");

  useEffect(() => {
    // Respect users who prefer no motion: show one question, no animation.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setText(QUESTIONS[0]);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const wait = (ms: number) => new Promise<void>((resolve) => (timer = setTimeout(resolve, ms)));

    (async () => {
      await wait(PAUSE_MS);
      for (let i = 0; !cancelled; i = (i + 1) % QUESTIONS.length) {
        const question = QUESTIONS[i];
        for (let n = 1; n <= question.length && !cancelled; n++) {
          setText(question.slice(0, n));
          await wait(TYPE_MS);
        }
        await wait(HOLD_MS);
        for (let n = question.length - 1; n >= 0 && !cancelled; n--) {
          setText(question.slice(0, n));
          await wait(DELETE_MS);
        }
        await wait(PAUSE_MS);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div
      aria-label="Example questions you could ask Monty"
      className="mx-auto mt-6 flex max-w-xl items-center gap-2 rounded-xl border border-border bg-background p-2 text-left shadow-sm"
    >
      <p className="min-h-6 flex-1 truncate px-2 text-sm sm:text-base" aria-live="off">
        {text ? text : <span className="text-muted">Ask Monty anything…</span>}
        <span className="monty-caret ml-0.5 inline-block h-5 w-0.5 translate-y-1 bg-brand" aria-hidden="true" />
      </p>
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-white"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
}
