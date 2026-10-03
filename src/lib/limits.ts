// Mirrored in firestore.rules – keep both in sync.
export const LIMITS = {
  name: 60,
  intro: 400,
  finalMessage: 400,
  prompt: 200,
  label: 40,
  option: 60,
  maxOptions: 8,
  maxQuestions: 15,
  answer: 500,
} as const;
