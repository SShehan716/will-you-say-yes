import {
  addDoc,
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { LIMITS } from "./limits";
import type { Answer, Proposal, ProposalDraft, ProposalResponse, Question } from "./types";

/** Firestore rejects `undefined`, so emit only the fields each question type uses. */
function cleanQuestion(q: Question): Question {
  const base = { id: q.id, type: q.type, prompt: q.prompt.trim().slice(0, LIMITS.prompt) };
  if (q.type === "yesno") {
    return {
      ...base,
      yesLabel: (q.yesLabel ?? "").trim().slice(0, LIMITS.label) || "Yes! 💖",
      noLabel: (q.noLabel ?? "").trim().slice(0, LIMITS.label) || "No",
    };
  }
  if (q.type === "choice") {
    return {
      ...base,
      options: (q.options ?? [])
        .map((o) => o.trim().slice(0, LIMITS.option))
        .filter(Boolean)
        .slice(0, LIMITS.maxOptions),
    };
  }
  return base;
}

function cleanDraft(d: ProposalDraft): ProposalDraft {
  return {
    template: d.template,
    recipientName: d.recipientName.trim().slice(0, LIMITS.name),
    ownerName: d.ownerName.trim().slice(0, LIMITS.name),
    intro: d.intro.trim().slice(0, LIMITS.intro),
    questions: d.questions.slice(0, LIMITS.maxQuestions).map(cleanQuestion),
    finalMessage: d.finalMessage.trim().slice(0, LIMITS.finalMessage),
    theme: d.theme,
  };
}

/** Returns a list of human-readable problems; empty when the draft can be saved. */
export function validateDraft(d: ProposalDraft): string[] {
  const errors: string[] = [];
  if (!d.recipientName.trim()) errors.push("Who is this for? Add their name.");
  if (!d.ownerName.trim()) errors.push("Add your name so they know who's asking.");
  if (d.questions.length === 0) errors.push("Add at least one question.");
  d.questions.forEach((q, i) => {
    if (!q.prompt.trim()) errors.push(`Question ${i + 1} is empty.`);
    if (q.type === "choice" && (q.options ?? []).filter((o) => o.trim()).length < 2) {
      errors.push(`Question ${i + 1} needs at least two options.`);
    }
  });
  return errors;
}

export async function createProposal(ownerId: string, draft: ProposalDraft): Promise<string> {
  const ref = await addDoc(collection(db(), "proposals"), {
    ...cleanDraft(draft),
    ownerId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProposal(id: string, draft: ProposalDraft): Promise<void> {
  await updateDoc(doc(db(), "proposals", id), {
    ...cleanDraft(draft),
    updatedAt: serverTimestamp(),
  });
}

export async function getProposal(id: string): Promise<Proposal | null> {
  const snap = await getDoc(doc(db(), "proposals", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Proposal) : null;
}

export async function listMyProposals(uid: string): Promise<Proposal[]> {
  // Sorted client-side so no composite index is needed.
  const snap = await getDocs(query(collection(db(), "proposals"), where("ownerId", "==", uid)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Proposal)
    .sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
}

export async function deleteProposal(id: string): Promise<void> {
  const responses = await getDocs(collection(db(), "proposals", id, "responses"));
  // A batch holds at most 500 writes; chunk so big proposals still delete cleanly.
  const refs = [...responses.docs.map((d) => d.ref), doc(db(), "proposals", id)];
  for (let i = 0; i < refs.length; i += 450) {
    const batch = writeBatch(db());
    refs.slice(i, i + 450).forEach((r) => batch.delete(r));
    await batch.commit();
  }
}

export async function submitResponse(
  proposalId: string,
  answers: Answer[],
  noAttempts: number,
): Promise<void> {
  await addDoc(collection(db(), "proposals", proposalId, "responses"), {
    answers: answers.map((a) => ({
      questionId: a.questionId,
      prompt: a.prompt.slice(0, LIMITS.prompt),
      value: a.value.slice(0, LIMITS.answer),
    })),
    noAttempts: Math.min(Math.max(0, Math.floor(noAttempts)), 10000),
    createdAt: serverTimestamp(),
  });
}

export async function listResponses(proposalId: string): Promise<ProposalResponse[]> {
  const snap = await getDocs(
    query(collection(db(), "proposals", proposalId, "responses"), orderBy("createdAt", "desc")),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ProposalResponse);
}

export async function countResponses(proposalId: string): Promise<number> {
  const snap = await getCountFromServer(collection(db(), "proposals", proposalId, "responses"));
  return snap.data().count;
}

export function shareUrl(id: string): string {
  return `${window.location.origin}/p/${id}`;
}
