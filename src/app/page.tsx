import Link from "next/link";
import { FloatingHearts } from "@/components/FloatingHearts";
import { Demo } from "@/components/landing/Demo";
import { Navbar } from "@/components/Navbar";
import { TEMPLATES } from "@/lib/templates";

const STEPS = [
  { emoji: "📝", title: "Sign up & pick a question", body: "Marry me, a day out, Valentine, dinner — or write your own questionnaire." },
  { emoji: "🔗", title: "Send them the link", body: "WhatsApp, Instagram, text. No app or account needed on their side." },
  { emoji: "💌", title: "Watch the answer arrive", body: "See their picks, the date they chose — and how many times they tried “No”." },
];

export default function Home() {
  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <FloatingHearts />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <section className="grid items-center gap-12 pt-8 pb-20 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
          <div>
            <p className="font-script text-3xl text-rose-500">for the ones in love</p>
            <h1 className="mt-2 font-display text-5xl leading-[1.05] font-extrabold text-balance text-ink sm:text-6xl lg:text-7xl">
              Ask the question. <span className="text-rose-500">Make “No” impossible.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
              Build a little romantic questionnaire — a proposal, a date, a day out — and send it to your person. The
              “No” button runs away every time they reach for it, on desktop and on mobile.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/create" className="btn-primary text-lg">
                Create your question 💘
              </Link>
              <a href="#templates" className="btn-secondary text-lg">
                See templates
              </a>
            </div>
          </div>
          <Demo />
        </section>

        <section id="templates" className="scroll-mt-8 pb-20">
          <h2 className="text-center font-display text-4xl font-bold text-ink">Start from a template</h2>
          <p className="mt-2 text-center text-ink-soft">Every word is editable. Add as many questions as you like.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((t) => (
              <Link
                key={t.id}
                href={`/create?template=${t.id}`}
                className="panel group transition hover:-translate-y-1 hover:shadow-2xl"
              >
                <span className="inline-block text-4xl transition group-hover:scale-110" aria-hidden>
                  {t.emoji}
                </span>
                <h3 className="mt-3 font-display text-xl font-bold text-ink">{t.name}</h3>
                <p className="mt-1 text-sm text-ink-soft">{t.blurb}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="pb-24">
          <h2 className="text-center font-display text-4xl font-bold text-ink">How it works</h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="panel">
                <div className="flex items-center gap-3">
                  <span className="text-3xl" aria-hidden>
                    {s.emoji}
                  </span>
                  <span className="text-sm font-extrabold text-rose-400">STEP {i + 1}</span>
                </div>
                <h3 className="mt-3 text-lg font-extrabold text-ink">{s.title}</h3>
                <p className="mt-1 text-ink-soft">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="relative z-10 pb-10 text-center text-sm text-ink-soft">
        Made with <span className="text-rose-500">♥</span> for every “yes”.
      </footer>
    </div>
  );
}
