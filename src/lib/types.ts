import type { Timestamp } from "firebase/firestore";

export type Gender = "boy" | "girl" | "other";

export interface UserProfile {
  displayName: string;
  email: string;
  gender: Gender;
}

export type QuestionType = "yesno" | "choice" | "date" | "text";

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  /** yesno only */
  yesLabel?: string;
  /** yesno only – the first label; it escalates every time they try to press it */
  noLabel?: string;
  /** choice only */
  options?: string[];
}

export type ThemeId = "rose" | "lavender" | "sunset" | "midnight";

export type TemplateId =
  | "marry"
  | "dayout"
  | "valentine"
  | "dinner"
  | "partner"
  | "sorry"
  | "custom";

/** Everything the creator edits in the builder. */
export interface ProposalDraft {
  template: TemplateId;
  recipientName: string;
  ownerName: string;
  intro: string;
  questions: Question[];
  finalMessage: string;
  theme: ThemeId;
}

export interface Proposal extends ProposalDraft {
  id: string;
  ownerId: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface Answer {
  questionId: string;
  prompt: string;
  value: string;
}

export interface ProposalResponse {
  id: string;
  answers: Answer[];
  noAttempts: number;
  createdAt: Timestamp | null;
}
