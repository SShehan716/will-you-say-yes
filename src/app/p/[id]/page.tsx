"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { HeartLoader } from "@/components/HeartLoader";
import { ProposalPlayer } from "@/components/ProposalPlayer";
import { getProposal } from "@/lib/proposals";
import type { Proposal } from "@/lib/types";

export default function PublicProposalPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [proposal, setProposal] = useState<Proposal | null | undefined>(undefined);

  useEffect(() => {
    getProposal(id)
      .then(setProposal)
      .catch(() => setProposal(null));
  }, [id]);

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
