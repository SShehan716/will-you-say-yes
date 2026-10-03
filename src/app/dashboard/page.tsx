"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ErrorState } from "@/components/ErrorState";
import { HeartLoader } from "@/components/HeartLoader";
import { Navbar } from "@/components/Navbar";
import { RequireAuth } from "@/components/RequireAuth";
import { reportError } from "@/lib/errors";
import { countResponses, deleteProposal, listMyProposals } from "@/lib/proposals";
import { getTemplate } from "@/lib/templates";
import type { Proposal } from "@/lib/types";

type Row = Proposal & { responses: number };

function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [actionError, setActionError] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!user) return;
    setLoadFailed(false);
    listMyProposals(user.uid)
      .then((ps) => Promise.all(ps.map(async (p) => ({ ...p, responses: await countResponses(p.id).catch(() => 0) }))))
      .then(setRows)
      .catch((err) => {
        reportError("load proposals", err);
        setLoadFailed(true);
      });
  }, [user, attempt]);

  const remove = async (id: string) => {
    setConfirmId(null);
    setActionError("");
    try {
      await deleteProposal(id);
      setRows((r) => r?.filter((p) => p.id !== id) ?? null);
    } catch (err) {
      reportError("delete proposal", err);
      setActionError("We couldn't delete this question. Please try again.");
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 pb-20 sm:px-6">
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-script text-2xl text-rose-500">Hi {profile?.displayName || "lovebird"},</p>
          <h1 className="font-display text-4xl font-bold text-ink">Your questions</h1>
        </div>
        <Link href="/create" className="btn-primary">+ New question</Link>
      </div>

      {actionError && (
        <p className="mt-6 rounded-2xl bg-red-50 p-4 font-semibold text-red-600" role="alert">
          {actionError}
        </p>
      )}

      {loadFailed && (
        <ErrorState
          title="We couldn't load your questions"
          onRetry={() => {
            setRows(null);
            setAttempt((a) => a + 1);
          }}
        />
      )}

      {!rows && !loadFailed && <HeartLoader />}

      {rows?.length === 0 && (
        <div className="panel mt-10 text-center">
          <p className="text-6xl" aria-hidden>💌</p>
          <h2 className="mt-3 font-display text-2xl font-bold">No questions yet</h2>
          <p className="mt-1 text-ink-soft">Create your first one — it takes about a minute.</p>
          <Link href="/create" className="btn-primary mt-6">Create a question</Link>
        </div>
      )}

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {rows?.map((p) => (
          <li key={p.id} className="panel flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <span className="text-4xl" aria-hidden>{getTemplate(p.template).emoji}</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                  p.responses ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-500"
                }`}
              >
                {p.responses ? `💖 ${p.responses} answer${p.responses > 1 ? "s" : ""}` : "Waiting…"}
              </span>
            </div>
            <h2 className="mt-3 line-clamp-2 font-display text-xl font-bold text-ink">{p.questions[0]?.prompt}</h2>
            <p className="mt-1 text-sm text-ink-soft">
              For <span className="font-bold">{p.recipientName}</span>
              {p.createdAt && ` · ${p.createdAt.toDate().toLocaleDateString()}`}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 pt-1 text-sm">
              <Link href={`/dashboard/${p.id}`} className="btn-primary !px-4 !py-2">Answers & link</Link>
              <Link href={`/create?edit=${p.id}`} className="btn-secondary !px-4 !py-2">Edit</Link>
              {confirmId === p.id ? (
                <span className="flex items-center gap-2">
                  <button type="button" className="font-bold text-red-600 hover:underline" onClick={() => void remove(p.id)}>Delete for good</button>
                  <button type="button" className="text-ink-soft hover:underline" onClick={() => setConfirmId(null)}>Cancel</button>
                </span>
              ) : (
                <button type="button" className="btn-ghost text-ink-soft" onClick={() => setConfirmId(p.id)}>Delete</button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="mt-12 text-sm font-semibold text-ink-soft hover:underline sm:hidden"
        onClick={async () => {
          await signOut();
          router.push("/");
        }}
      >
        Log out
      </button>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <>
      <Navbar />
      <RequireAuth>
        <Dashboard />
      </RequireAuth>
    </>
  );
}
