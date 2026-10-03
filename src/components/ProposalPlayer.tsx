"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { celebrate } from "@/lib/confetti";
import { submitResponse } from "@/lib/proposals";
import { NO_ESCALATION, REACTION_EMOJI } from "@/lib/templates";
import type { Answer, ProposalDraft, Question } from "@/lib/types";
import { RunawayButton } from "./RunawayButton";

interface Props {
  proposal: ProposalDraft;
  /** When set, answers are saved to this proposal's responses. */
  proposalId?: string;
  /** Preview mode never writes to Firestore. */
  preview?: boolean;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function ProposalPlayer({ proposal, proposalId, preview = false }: Props) {
  const { questions } = proposal;
  // -1 = envelope intro, 0..n-1 = questions, n = finished
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [noAttempts, setNoAttempts] = useState(0);
  const [save, setSave] = useState<SaveState>("idle");
  const savedOnce = useRef(false);

  const done = step >= questions.length;

  const answer = (q: Question, value: string) => {
    setAnswers((prev) => [...prev, { questionId: q.id, prompt: q.prompt, value }]);
    setStep((s) => s + 1);
  };

  const persist = useCallback(
    async (finalAnswers: Answer[], attempts: number) => {
      if (preview || !proposalId) return;
      setSave("saving");
      try {
        await submitResponse(proposalId, finalAnswers, attempts);
        setSave("saved");
      } catch {
        setSave("error");
      }
    },
    [preview, proposalId],
  );

  useEffect(() => {
    if (!done || savedOnce.current) return;
    savedOnce.current = true; // guards StrictMode's double effect run
    void celebrate();
    void persist(answers, noAttempts);
  }, [done, answers, noAttempts, persist]);

  return (
    <div className={`theme-${proposal.theme} player-bg relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10`}>
      {step >= 0 && !done && questions.length > 1 && (
        <div className="absolute top-6 flex gap-2" aria-label={`Question ${step + 1} of ${questions.length}`}>
          {questions.map((q, i) => (
            <span
              key={q.id}
              className={`h-2 rounded-full transition-all ${i === step ? "w-8 bg-[var(--accent)]" : i < step ? "w-2 bg-[var(--accent)]" : "w-2 bg-white/60"}`}
            />
          ))}
        </div>
      )}

      <div key={step} className="animate-pop-in relative z-10 w-full max-w-lg">
        {step === -1 && (
          <Envelope
            recipientName={proposal.recipientName}
            ownerName={proposal.ownerName}
            intro={proposal.intro}
            onOpen={() => setStep(0)}
          />
        )}

        {step >= 0 && !done && (
          <QuestionStep
            question={questions[step]}
            onAnswer={(v) => answer(questions[step], v)}
            onNoAttempt={() => setNoAttempts((n) => n + 1)}
          />
        )}

        {done && (
          <Finale
            proposal={proposal}
            answers={answers}
            noAttempts={noAttempts}
            save={save}
            preview={preview}
            onRetry={() => void persist(answers, noAttempts)}
          />
        )}
      </div>
    </div>
  );
}

function Envelope({
  recipientName,
  ownerName,
  intro,
  onOpen,
}: {
  recipientName: string;
  ownerName: string;
  intro: string;
  onOpen: () => void;
}) {
  return (
    <div className="card text-center">
      <button
        type="button"
        onClick={onOpen}
        className="group mx-auto mb-6 block text-7xl transition-transform hover:scale-110 sm:text-8xl"
        aria-label="Open the letter"
      >
        <span className="inline-block animate-wiggle group-hover:animate-none">💌</span>
      </button>
      <p className="font-script text-3xl text-[var(--accent)] sm:text-4xl">Dear {recipientName || "you"},</p>
      {intro && <p className="mx-auto mt-4 max-w-sm text-lg leading-relaxed text-[var(--ink)]">{intro}</p>}
      <button type="button" onClick={onOpen} className="btn-theme mt-8">
        Open my letter ✨
      </button>
      <p className="mt-6 text-sm text-[var(--ink-soft)]">
        with love, <span className="font-bold">{ownerName}</span>
      </p>
    </div>
  );
}

function QuestionStep({
  question,
  onAnswer,
  onNoAttempt,
}: {
  question: Question;
  onAnswer: (value: string) => void;
  onNoAttempt: () => void;
}) {
  switch (question.type) {
    case "yesno":
      return <YesNoStep question={question} onAnswer={onAnswer} onNoAttempt={onNoAttempt} />;
    case "choice":
      return (
        <div className="card text-center">
          <h2 className="question-title">{question.prompt}</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {(question.options ?? []).map((opt) => (
              <button key={opt} type="button" className="choice-chip" onClick={() => onAnswer(opt)}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      );
    case "date":
      return <DateStep question={question} onAnswer={onAnswer} />;
    case "text":
      return <TextStep question={question} onAnswer={onAnswer} />;
  }
}

function YesNoStep({
  question,
  onAnswer,
  onNoAttempt,
}: {
  question: Question;
  onAnswer: (value: string) => void;
  onNoAttempt: () => void;
}) {
  const [attempts, setAttempts] = useState(0);
  const yesRef = useRef<HTMLButtonElement>(null);

  const handleAttempt = useCallback(() => {
    setAttempts((a) => a + 1);
    onNoAttempt();
  }, [onNoAttempt]);

  const noLabel = attempts === 0 ? question.noLabel || "No" : NO_ESCALATION[(attempts - 1) % NO_ESCALATION.length];
  const emoji = REACTION_EMOJI[Math.min(attempts, REACTION_EMOJI.length - 1)];
  const yesScale = 1 + Math.min(attempts, 10) * 0.09;

  return (
    <div className="card text-center">
      <div key={emoji} className="animate-pop-in mb-4 text-7xl sm:text-8xl" aria-hidden>
        {emoji}
      </div>
      <h2 className="question-title">{question.prompt}</h2>
      {attempts > 0 && (
        <p className="mt-3 text-sm font-semibold text-[var(--ink-soft)]" aria-live="polite">
          {attempts === 1 ? "Nice try 😏" : `You tried to say no ${attempts} times. It's not happening 😌`}
        </p>
      )}
      <div className="mt-10 flex min-h-24 flex-wrap items-center justify-center gap-6">
        <button
          ref={yesRef}
          type="button"
          className="btn-theme origin-center"
          style={{ transform: `scale(${yesScale})`, transition: "transform .25s cubic-bezier(.2,.9,.3,1.4)" }}
          onClick={() => onAnswer(question.yesLabel || "Yes")}
        >
          {question.yesLabel || "Yes! 💖"}
        </button>
        <RunawayButton label={noLabel} onAttempt={handleAttempt} avoidRef={yesRef} className="btn-no" />
      </div>
    </div>
  );
}

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function DateStep({ question, onAnswer }: { question: Question; onAnswer: (v: string) => void }) {
  const [value, setValue] = useState("");
  const [min] = useState(() => toLocalInputValue(new Date()));
  return (
    <form
      className="card text-center"
      onSubmit={(e) => {
        e.preventDefault();
        if (!value) return;
        onAnswer(new Date(value).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" }));
      }}
    >
      <div className="mb-4 text-6xl" aria-hidden>
        📅
      </div>
      <h2 className="question-title">{question.prompt}</h2>
      <input
        type="datetime-local"
        required
        min={min}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="input mt-8 text-center"
        aria-label={question.prompt}
      />
      <button type="submit" className="btn-theme mt-6" disabled={!value}>
        That works 💕
      </button>
    </form>
  );
}

function TextStep({ question, onAnswer }: { question: Question; onAnswer: (v: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <form
      className="card text-center"
      onSubmit={(e) => {
        e.preventDefault();
        onAnswer(value.trim() || "—");
      }}
    >
      <div className="mb-4 text-6xl" aria-hidden>
        💭
      </div>
      <h2 className="question-title">{question.prompt}</h2>
      <textarea
        rows={4}
        maxLength={500}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="input mt-8 resize-none"
        placeholder="Write anything…"
        aria-label={question.prompt}
      />
      <button type="submit" className="btn-theme mt-6">
        {value.trim() ? "Send 💌" : "Skip"}
      </button>
    </form>
  );
}

function Finale({
  proposal,
  answers,
  noAttempts,
  save,
  preview,
  onRetry,
}: {
  proposal: ProposalDraft;
  answers: Answer[];
  noAttempts: number;
  save: SaveState;
  preview: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="card text-center">
      <div className="animate-heartbeat mb-4 text-7xl sm:text-8xl" aria-hidden>
        🥳
      </div>
      <p className="font-script text-4xl text-[var(--accent)] sm:text-5xl">Yay!</p>
      <p className="mx-auto mt-4 max-w-sm text-lg leading-relaxed text-[var(--ink)]">{proposal.finalMessage}</p>

      {answers.length > 1 && (
        <ul className="mt-8 space-y-2 text-left">
          {answers.map((a) => (
            <li key={a.questionId} className="rounded-2xl bg-white/70 px-4 py-3">
              <p className="text-xs font-semibold text-[var(--ink-soft)]">{a.prompt}</p>
              <p className="font-bold text-[var(--ink)]">{a.value}</p>
            </li>
          ))}
        </ul>
      )}

      {noAttempts > 0 && (
        <p className="mt-6 text-sm text-[var(--ink-soft)]">
          (You tried to press “No” {noAttempts} {noAttempts === 1 ? "time" : "times"}. {proposal.ownerName} will know 😏)
        </p>
      )}

      <div className="mt-6 text-sm font-semibold" aria-live="polite">
        {preview && <span className="text-[var(--ink-soft)]">Preview mode — nothing was saved.</span>}
        {!preview && save === "saving" && <span className="text-[var(--ink-soft)]">Sending your answer…</span>}
        {!preview && save === "saved" && (
          <span className="text-emerald-600">
            Sent! {proposal.ownerName} can see your answer now 💌
          </span>
        )}
        {!preview && save === "error" && (
          <span className="text-red-600">
            Couldn&apos;t send your answer.{" "}
            <button type="button" className="underline" onClick={onRetry}>
              Try again
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
