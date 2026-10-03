"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ErrorState } from "@/components/ErrorState";
import { HeartLoader } from "@/components/HeartLoader";
import { Navbar } from "@/components/Navbar";
import { RequireAuth } from "@/components/RequireAuth";
import { ShareBox } from "@/components/ShareBox";
import { reportError } from "@/lib/errors";
import { getProposal, listResponses } from "@/lib/proposals";
import type { Proposal, ProposalResponse } from "@/lib/types";

function Responses() {
  const { id } = useParams<{ id: string }>();
  const created = useSearchParams().get("created") === "1";
  const { user } = useAuth();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [responses, setResponses] = useState<ProposalResponse[] | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "not-found" | "failed">("loading");
  const [refreshError, setRefreshError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!user) return;
    setStatus("loading");
    getProposal(id)
      .then(async (p) => {
        if (!p || p.ownerId !== user.uid) return setStatus("not-found");
        setProposal(p);
        setResponses(await listResponses(id));
        setStatus("ready");
      })
      .catch((err) => {
        reportError("load proposal", err);
        setStatus("failed");
      });
  }, [id, user, attempt]);

  if (status === "not-found") {
    return (
      <ErrorState
        title="Question not found"
        message="It may have been deleted, or the link is incorrect."
        action={<Link href="/dashboard" className="btn-primary">Back to my questions</Link>}
      />
    );
  }
  if (status === "failed") {
    return <ErrorState title="We couldn't load this question" onRetry={() => setAttempt((a) => a + 1)} action={<Link href="/dashboard" className="btn-secondary">Back to my questions</Link>} />;
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
              setRefreshError("");
              listResponses(id)
                .then(setResponses)
                .catch((err) => {
                  reportError("refresh responses", err);
                  setRefreshError("We couldn't refresh the answers. Please try again.");
                });
            }}
          >
            ↻ Refresh
          </button>
        </div>

        {refreshError && (
          <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600" role="alert">
            {refreshError}
          </p>
        )}

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
