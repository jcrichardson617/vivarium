"use client";

import { useEffect, useState } from "react";

const QUESTIONS = [
  "Compare ball python 24-B's growth to other 2024 ball pythons",
  "Why might my female boa be refusing food?",
  "What will a Pastel Clown x het Clown pairing produce?",
  "Is 31°C a good incubation temperature for crested gecko eggs?",
  "How often should I feed a yearling Argentine tegu?",
  "When is my next shed due for Monty?",
  "Which of my animals haven't eaten in over two weeks?",
  "What humidity do White's tree frogs need?",
  "Is my blue tongue skink a healthy weight for her age?",
  "What does the research say about UVB for ball pythons?",
  "Which enclosure has the most temperature swings this month?",
  "How long until my crested gecko eggs hatch?",
  "Are retained eye caps a sign of low humidity?",
  "What's the average clutch size for corn snakes?",
];

// Fisher-Yates shuffle so each visit starts with a different question.
function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const TYPE_MS = 45;
const DELETE_MS = 20;
const HOLD_MS = 1600;
const PAUSE_MS = 1800;

export function MontyDemo() {
  const [text, setText] = useState("");

  useEffect(() => {
    // Respect users who prefer no motion: show one question, no animation.
    // Shuffle on the client only, so server and browser render the same first frame.
    const questions = shuffled(QUESTIONS);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setText(questions[0]);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const wait = (ms: number) => new Promise<void>((resolve) => (timer = setTimeout(resolve, ms)));

    (async () => {
      await wait(PAUSE_MS);
      for (let i = 0; !cancelled; i = (i + 1) % questions.length) {
        const question = questions[i];
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
