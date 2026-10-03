import type { Metadata } from "next";

// Deliberately vague so the link preview doesn't spoil the question.
export const metadata: Metadata = {
  title: "Someone has a question for you 💌",
  description: "Open it… you know you want to.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Someone has a question for you 💌",
    description: "Open it… you know you want to.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
