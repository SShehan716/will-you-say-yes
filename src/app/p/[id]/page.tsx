"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { HeartLoader } from "@/components/HeartLoader";
import { ProposalPlayer } from "@/components/ProposalPlayer";
import { reportError } from "@/lib/errors";
import { getProposal } from "@/lib/proposals";
import type { Proposal } from "@/lib/types";

export default function PublicProposalPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [proposal, setProposal] = useState<Proposal | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setFailed(false);
    getProposal(id)
      .then(setProposal)
      .catch((err) => {
        reportError("open shared proposal", err);
        setFailed(true);
      });
  }, [id, attempt]);

  if (failed) {
    return (
      <div className="grid min-h-dvh place-items-center px-4">
        <div className="panel max-w-md text-center" role="alert">
          <p className="text-6xl" aria-hidden>💌</p>
          <h1 className="mt-3 font-display text-2xl font-bold">We couldn&apos;t open your letter</h1>
          <p className="mt-1 text-ink-soft">Please check your internet connection and try again.</p>
          <button type="button" className="btn-primary mt-6" onClick={() => setAttempt((a) => a + 1)}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (proposal === undefined) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <HeartLoader label="Opening your letter…" />
      </div>
    );
  }

  if (proposal === null) {
    return (
      <div className="grid min-h-dvh place-items-center px-4">
        <div className="panel max-w-md text-center">
          <p className="text-6xl" aria-hidden>💔</p>
          <h1 className="mt-3 font-display text-2xl font-bold">This letter can&apos;t be found</h1>
          <p className="mt-1 text-ink-soft">The link may be wrong, or it was deleted.</p>
          <Link href="/" className="btn-primary mt-6">Make your own 💘</Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.uid === proposal.ownerId;

  return (
    <>
      {isOwner && (
        <div className="fixed inset-x-0 top-0 z-[55] bg-ink px-4 py-2 text-center text-sm font-semibold text-white">
          This is your own link — your answers here won&apos;t be saved.{" "}
          <Link href={`/dashboard/${proposal.id}`} className="underline">Back to dashboard</Link>
        </div>
      )}
      <ProposalPlayer proposal={proposal} proposalId={proposal.id} preview={isOwner} />
    </>
  );
}
