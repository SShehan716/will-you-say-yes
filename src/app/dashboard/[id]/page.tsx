"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { HeartLoader } from "@/components/HeartLoader";
import { Navbar } from "@/components/Navbar";
import { RequireAuth } from "@/components/RequireAuth";
import { ShareBox } from "@/components/ShareBox";
import { getProposal, listResponses } from "@/lib/proposals";
import type { Proposal, ProposalResponse } from "@/lib/types";

function Responses() {
  const { id } = useParams<{ id: string }>();
  const created = useSearchParams().get("created") === "1";
  const { user } = useAuth();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [responses, setResponses] = useState<ProposalResponse[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    getProposal(id)
      .then(async (p) => {
        if (!p || p.ownerId !== user.uid) throw new Error("not found");
        setProposal(p);
        setResponses(await listResponses(id));
      })
      .catch(() => setError("We couldn't find that question."));
  }, [id, user]);

  if (error) {
    return (
      <div className="panel mx-auto mt-10 max-w-md text-center">
        <p className="text-5xl">💔</p>
        <p className="mt-3 font-bold">{error}</p>
        <Link href="/dashboard" className="btn-primary mt-6">Back to my questions</Link>
      </div>
    );
  }
  if (!proposal || !responses) return <HeartLoader />;

  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
      <Link href="/dashboard" className="text-sm font-bold text-rose-500 hover:underline">← My questions</Link>

      <section className={`panel mt-4 ${created ? "ring-4 ring-rose-200" : ""}`}>
        {created && <p className="mb-1 font-script text-3xl text-rose-500">It&apos;s ready! 🎉</p>}
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">{proposal.questions[0]?.prompt}</h1>
        <p className="mt-1 text-ink-soft">
          Send this link to <span className="font-bold">{proposal.recipientName}</span>. They don&apos;t need an account.
        </p>
        <div className="mt-5">
          <ShareBox id={proposal.id} recipientName={proposal.recipientName} />
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-ink">Answers</h2>
          <button
            type="button"
            className="text-sm font-bold text-rose-500 hover:underline"
            onClick={() => {
              setResponses(null);
              listResponses(id).then(setResponses).catch(() => setError("Couldn't refresh answers."));
            }}
          >
            ↻ Refresh
          </button>
        </div>

        {responses.length === 0 ? (
          <div className="panel mt-4 text-center">
            <p className="animate-heartbeat text-5xl" aria-hidden>⏳</p>
            <p className="mt-3 font-bold">No answer yet</p>
            <p className="text-sm text-ink-soft">Fingers crossed — though with that “No” button, you&apos;re in good shape.</p>
          </div>
        ) : (
          <ul className="mt-4 space-y-4">
            {responses.map((r) => (
              <li key={r.id} className="panel">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-script text-2xl text-rose-500">{proposal.recipientName} said yes! 💖</p>
                  <p className="text-xs font-semibold text-ink-soft">
                    {r.createdAt?.toDate().toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <dl className="mt-3 space-y-2">
                  {r.answers.map((a) => (
                    <div key={a.questionId} className="rounded-2xl bg-rose-50/70 px-4 py-3">
                      <dt className="text-xs font-semibold text-ink-soft">{a.prompt}</dt>
                      <dd className="font-bold whitespace-pre-wrap text-ink">{a.value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-sm text-ink-soft">
                  {r.noAttempts === 0
                    ? "Didn't even try to press “No”. 🥰"
                    : `Tried to press “No” ${r.noAttempts} time${r.noAttempts > 1 ? "s" : ""}. 😏`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default function ResponsesPage() {
  return (
    <>
      <Navbar />
      <RequireAuth>
        <Suspense fallback={<HeartLoader />}>
          <Responses />
        </Suspense>
      </RequireAuth>
    </>
  );
}
