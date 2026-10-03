import type { Metadata, Viewport } from "next";
import { Dancing_Script, Nunito, Playfair_Display } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], weight: ["600", "700", "800"] });
const dancing = Dancing_Script({ variable: "--font-dancing", subsets: ["latin"], weight: ["600", "700"] });

export const metadata: Metadata = {
  title: {
    default: "Say Yes 💘 — ask the question they can't say no to",
    template: "%s · Say Yes 💘",
  },
  description:
    "Create a romantic question — will you marry me, be my Valentine, go on a date — and share the link. The “No” button runs away.",
};

export const viewport: Viewport = {
  themeColor: "#ff4d6d",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      {/* Browser extensions (Grammarly, ColorZilla, …) inject attributes on <body> before hydration. */}
      <body
        className={`${nunito.variable} ${playfair.variable} ${dancing.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
