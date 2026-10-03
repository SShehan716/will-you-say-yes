"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { HeartLoader } from "@/components/HeartLoader";
import { Navbar } from "@/components/Navbar";
import { ProposalPlayer } from "@/components/ProposalPlayer";
import { QuestionEditor, TYPE_META } from "@/components/QuestionEditor";
import { RequireAuth } from "@/components/RequireAuth";
import { LIMITS } from "@/lib/limits";
import { createProposal, getProposal, updateProposal, validateDraft } from "@/lib/proposals";
import { blankQuestion, getTemplate, TEMPLATES, THEMES } from "@/lib/templates";
import type { Gender, ProposalDraft, QuestionType } from "@/lib/types";

function draftFromTemplate(id: string | null, gender: Gender | undefined, base?: Partial<ProposalDraft>): ProposalDraft {
  const tpl = getTemplate(id);
  return {
    template: tpl.id,
    recipientName: base?.recipientName ?? "",
    ownerName: base?.ownerName ?? "",
    ...tpl.build({ gender }),
  };
}

function Builder() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("edit");

  const [draft, setDraft] = useState<ProposalDraft | null>(null);
  const [loadError, setLoadError] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  // Initialise once: from the doc being edited, or from the chosen template.
  useEffect(() => {
    if (draft || !user) return;
    if (editId) {
      getProposal(editId)
        .then((p) => {
          if (!p || p.ownerId !== user.uid) return setLoadError("We couldn't find that question.");
          const { template, recipientName, ownerName, intro, questions, finalMessage, theme } = p;
          setDraft({ template, recipientName, ownerName, intro, questions, finalMessage, theme });
        })
        .catch(() => setLoadError("We couldn't load that question."));
    } else if (profile) {
      setDraft(
        draftFromTemplate(params.get("template"), profile.gender, {
          ownerName: profile.displayName || user.displayName || "",
        }),
      );
    }
  }, [draft, user, profile, editId, params]);

  if (loadError) {
    return (
      <div className="panel mx-auto mt-10 max-w-md text-center">
        <p className="text-5xl">💔</p>
        <p className="mt-3 font-bold">{loadError}</p>
        <Link href="/dashboard" className="btn-primary mt-6">Back to my questions</Link>
      </div>
    );
  }
  if (!draft) return <HeartLoader />;

  const update = (patch: Partial<ProposalDraft>) => setDraft({ ...draft, ...patch });
  const questions = draft.questions;

  const save = async () => {
    const problems = validateDraft(draft);
    setErrors(problems);
    if (problems.length || !user) return;
    setSaving(true);
    try {
      if (editId) {
        await updateProposal(editId, draft);
        router.push(`/dashboard/${editId}`);
      } else {
        const id = await createProposal(user.uid, draft);
        router.push(`/dashboard/${id}?created=1`);
      }
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "Couldn't save. Please try again."]);
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 pb-32 sm:px-6">
      <h1 className="mt-4 font-display text-4xl font-bold text-ink">{editId ? "Edit your question" : "Create your question"}</h1>
      <p className="mt-1 text-ink-soft">Make it personal. Every word is yours to change.</p>

      {!editId && (
        <section className="mt-8">
          <h2 className="label">1. Pick a template</h2>
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setDraft(draftFromTemplate(t.id, profile?.gender, draft))}
                className={`min-w-36 snap-start rounded-2xl border-2 p-3 text-left transition ${
                  draft.template === t.id ? "border-rose-400 bg-rose-50" : "border-rose-100 bg-white hover:border-rose-200"
                }`}
              >
                <span className="text-2xl" aria-hidden>{t.emoji}</span>
                <span className="mt-1 block text-sm leading-tight font-bold text-ink">{t.name}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-soft">Switching template replaces the questions below.</p>
        </section>
      )}

      <section className="panel mt-8 grid gap-4 sm:grid-cols-2">
        <h2 className="label sm:col-span-2">{editId ? "Who's it for?" : "2. Who's it for?"}</h2>
        <div>
          <label className="label !text-xs" htmlFor="recipient">Their name</label>
          <input id="recipient" className="input" maxLength={LIMITS.name} placeholder="e.g. Amaya" value={draft.recipientName} onChange={(e) => update({ recipientName: e.target.value })} />
        </div>
        <div>
          <label className="label !text-xs" htmlFor="owner">From (your name)</label>
          <input id="owner" className="input" maxLength={LIMITS.name} value={draft.ownerName} onChange={(e) => update({ ownerName: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="label !text-xs" htmlFor="intro">Opening line (shown on the envelope)</label>
          <textarea id="intro" rows={2} className="input resize-none" maxLength={LIMITS.intro} value={draft.intro} onChange={(e) => update({ intro: e.target.value })} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="label">{editId ? "Questions" : "3. Questions"}</h2>
        <div className="space-y-3">
          {questions.map((q, i) => (
            <QuestionEditor
              key={q.id}
              index={i}
              total={questions.length}
              question={q}
              onChange={(nq) => update({ questions: questions.map((x) => (x.id === q.id ? nq : x)) })}
              onRemove={() => update({ questions: questions.filter((x) => x.id !== q.id) })}
              onMove={(dir) => {
                const next = [...questions];
                [next[i], next[i + dir]] = [next[i + dir], next[i]];
                update({ questions: next });
              }}
            />
          ))}
        </div>
        {questions.length < LIMITS.maxQuestions && (
          <div className="mt-4 flex flex-wrap gap-2">
            {(Object.keys(TYPE_META) as QuestionType[]).map((type) => (
              <button
                key={type}
                type="button"
                className="rounded-full border-2 border-dashed border-rose-200 bg-white/70 px-4 py-2 text-sm font-bold text-rose-600 transition hover:border-rose-400"
                onClick={() => update({ questions: [...questions, blankQuestion(type)] })}
              >
                + {TYPE_META[type].emoji} {TYPE_META[type].label}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="panel mt-8 space-y-5">
        <div>
          <label className="label" htmlFor="final">{editId ? "" : "4. "}Message after they say yes</label>
          <textarea id="final" rows={3} className="input resize-none" maxLength={LIMITS.finalMessage} value={draft.finalMessage} onChange={(e) => update({ finalMessage: e.target.value })} />
        </div>
        <fieldset>
          <legend className="label">Theme</legend>
          <div className="flex flex-wrap gap-3">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => update({ theme: t.id })}
                className={`flex items-center gap-2 rounded-full border-2 py-1.5 pr-4 pl-1.5 text-sm font-bold transition ${
                  draft.theme === t.id ? "border-rose-400 bg-rose-50" : "border-rose-100 bg-white"
                }`}
                aria-pressed={draft.theme === t.id}
              >
                <span className="h-7 w-7 rounded-full" style={{ background: t.swatch }} />
                {t.name}
              </button>
            ))}
          </div>
        </fieldset>
      </section>

      {errors.length > 0 && (
        <ul className="mt-6 space-y-1 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600" role="alert">
          {errors.map((e) => (
            <li key={e}>• {e}</li>
          ))}
        </ul>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-rose-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-end gap-3 px-4 py-3 sm:px-6">
          <button type="button" className="btn-secondary" onClick={() => setPreviewing(true)}>
            👀 Preview
          </button>
          <button type="button" className="btn-primary" disabled={saving} onClick={() => void save()}>
            {saving ? "Saving…" : editId ? "Save changes" : "Create & get link 💌"}
          </button>
        </div>
      </div>

      {previewing && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <button
            type="button"
            onClick={() => setPreviewing(false)}
            className="fixed top-4 right-4 z-[70] rounded-full bg-white px-4 py-2 text-sm font-bold text-ink shadow-lg"
          >
            ✕ Close preview
          </button>
          <ProposalPlayer
            preview
            proposal={{
              ...draft,
              recipientName: draft.recipientName || "Your love",
              ownerName: draft.ownerName || "You",
              questions: draft.questions.map((q) => ({ ...q, prompt: q.prompt || "(empty question)" })),
            }}
          />
        </div>
      )}
    </main>
  );
}

export default function CreatePage() {
  return (
    <>
      <Navbar />
      <RequireAuth>
        <Suspense fallback={<HeartLoader />}>
          <Builder />
        </Suspense>
      </RequireAuth>
    </>
  );
}
