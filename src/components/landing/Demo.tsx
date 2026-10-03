"use client";

import { useCallback, useRef, useState } from "react";
import { celebrate } from "@/lib/confetti";
import { NO_ESCALATION, REACTION_EMOJI } from "@/lib/templates";
import { RunawayButton } from "../RunawayButton";

export function Demo() {
  const [attempts, setAttempts] = useState(0);
  const [saidYes, setSaidYes] = useState(false);
  const yesRef = useRef<HTMLButtonElement>(null);
  const onAttempt = useCallback(() => setAttempts((a) => a + 1), []);

  if (saidYes) {
    return (
      <div className="card theme-rose animate-pop-in text-center">
        <div className="animate-heartbeat text-7xl" aria-hidden>
          🥳
        </div>
        <p className="mt-3 font-script text-4xl text-rose-600">See? Works every time.</p>
        <p className="mt-2 text-ink-soft">
          {attempts > 0 ? `You tried “No” ${attempts} times. Your partner will too.` : "Straight to yes — love that."}
        </p>
        <button
          type="button"
          className="btn-secondary mt-6"
          onClick={() => {
            setSaidYes(false);
            setAttempts(0);
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="card theme-rose text-center">
      <div key={attempts} className="animate-pop-in text-7xl" aria-hidden>
        {REACTION_EMOJI[Math.min(attempts, REACTION_EMOJI.length - 1)]}
      </div>
      <p className="question-title mt-3">Will you go on a date with me?</p>
      <p className="mt-2 text-sm font-semibold text-ink-soft">Go on — try pressing “No”.</p>
      <div className="mt-8 flex min-h-20 flex-wrap items-center justify-center gap-5">
        <button
          ref={yesRef}
          type="button"
          className="btn-theme"
          style={{ transform: `scale(${1 + Math.min(attempts, 8) * 0.08})`, transition: "transform .25s" }}
          onClick={() => {
            setSaidYes(true);
            void celebrate();
          }}
        >
          Yes! 💖
        </button>
        <RunawayButton
          label={attempts === 0 ? "No" : NO_ESCALATION[(attempts - 1) % NO_ESCALATION.length]}
          onAttempt={onAttempt}
          avoidRef={yesRef}
          className="btn-no"
        />
      </div>
    </div>
  );
}
