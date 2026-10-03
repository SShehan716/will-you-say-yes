"use client";

import { LIMITS } from "@/lib/limits";
import type { Question, QuestionType } from "@/lib/types";

export const TYPE_META: Record<QuestionType, { label: string; emoji: string; hint: string }> = {
  yesno: { label: "Yes / No", emoji: "💘", hint: "The “No” button runs away." },
  choice: { label: "Pick one", emoji: "🎯", hint: "They choose from your options." },
  date: { label: "Date & time", emoji: "📅", hint: "They pick when they're free." },
  text: { label: "Free text", emoji: "💭", hint: "They write you a message." },
};

interface Props {
  index: number;
  total: number;
  question: Question;
  onChange: (q: Question) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}

export function QuestionEditor({ index, total, question: q, onChange, onMove, onRemove }: Props) {
  const set = (patch: Partial<Question>) => onChange({ ...q, ...patch });
  const options = q.options ?? [];

  return (
    <div className="panel !p-4 sm:!p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-extrabold text-rose-500">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-rose-100">{index + 1}</span>
          {TYPE_META[q.type].emoji} {TYPE_META[q.type].label}
        </span>
        <div className="flex items-center gap-1">
          <IconBtn label="Move up" disabled={index === 0} onClick={() => onMove(-1)}>↑</IconBtn>
          <IconBtn label="Move down" disabled={index === total - 1} onClick={() => onMove(1)}>↓</IconBtn>
          <IconBtn label="Delete question" disabled={total === 1} onClick={onRemove}>✕</IconBtn>
        </div>
      </div>

      <input
        className="input mt-3 font-semibold"
        placeholder={q.type === "yesno" ? "e.g. Will you be my Valentine? 💘" : "Your question"}
        maxLength={LIMITS.prompt}
        value={q.prompt}
        onChange={(e) => set({ prompt: e.target.value })}
        aria-label={`Question ${index + 1}`}
      />

      {q.type === "yesno" && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="label !text-xs">Yes button</label>
            <input className="input" maxLength={LIMITS.label} value={q.yesLabel ?? ""} placeholder="Yes! 💖" onChange={(e) => set({ yesLabel: e.target.value })} />
          </div>
          <div>
            <label className="label !text-xs">No button (it runs away 🏃)</label>
            <input className="input" maxLength={LIMITS.label} value={q.noLabel ?? ""} placeholder="No" onChange={(e) => set({ noLabel: e.target.value })} />
          </div>
        </div>
      )}

      {q.type === "choice" && (
        <div className="mt-3 space-y-2">
          {options.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="input"
                maxLength={LIMITS.option}
                value={opt}
                placeholder={`Option ${i + 1}`}
                onChange={(e) => set({ options: options.map((o, j) => (j === i ? e.target.value : o)) })}
                aria-label={`Option ${i + 1}`}
              />
              <IconBtn label="Remove option" disabled={options.length <= 2} onClick={() => set({ options: options.filter((_, j) => j !== i) })}>
                ✕
              </IconBtn>
            </div>
          ))}
          {options.length < LIMITS.maxOptions && (
            <button type="button" className="text-sm font-bold text-rose-500 hover:underline" onClick={() => set({ options: [...options, ""] })}>
              + Add option
            </button>
          )}
        </div>
      )}

      <p className="mt-2 text-xs text-ink-soft">{TYPE_META[q.type].hint}</p>
    </div>
  );
}

function IconBtn({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-rose-100 hover:text-rose-600 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
