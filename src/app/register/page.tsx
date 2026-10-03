"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthShell, GoogleIcon, safeNext } from "@/components/AuthShell";
import { authErrorMessage, useAuth } from "@/components/AuthProvider";
import { LIMITS } from "@/lib/limits";
import type { Gender } from "@/lib/types";

const GENDERS: { id: Gender; label: string; emoji: string }[] = [
  { id: "boy", label: "Boy", emoji: "🙋‍♂️" },
  { id: "girl", label: "Girl", emoji: "🙋‍♀️" },
  { id: "other", label: "Rather not say", emoji: "💫" },
];

function RegisterForm() {
  const { user, register, loginWithGoogle } = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState<Gender>("boy");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user && !busy) router.replace(next);
  }, [user, busy, next, router]);

  const run = async (fn: () => Promise<void>) => {
    setError("");
    setBusy(true);
    try {
      await fn();
      router.replace(next);
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Join Say Yes 💘" subtitle="Create questions your person can't say no to.">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void run(() => register({ name: name.trim(), email, password, gender }));
        }}
      >
        <div>
          <label className="label" htmlFor="name">Your name</label>
          <input id="name" required maxLength={LIMITS.name} autoComplete="given-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <fieldset>
          <legend className="label">I am a…</legend>
          <div className="grid grid-cols-3 gap-2">
            {GENDERS.map((g) => (
              <label
                key={g.id}
                className={`cursor-pointer rounded-2xl border-2 px-2 py-3 text-center text-sm font-bold transition ${
                  gender === g.id ? "border-rose-400 bg-rose-50 text-rose-600" : "border-rose-100 bg-white text-ink-soft hover:border-rose-200"
                }`}
              >
                <input type="radio" name="gender" value={g.id} checked={gender === g.id} onChange={() => setGender(g.id)} className="sr-only" />
                <span className="block text-2xl" aria-hidden>{g.emoji}</span>
                {g.label}
              </label>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-ink-soft">Used to word templates, e.g. “Will you be my girlfriend?”</p>
        </fieldset>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" required minLength={6} autoComplete="new-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? "Creating your account…" : "Create account"}
        </button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs font-bold text-rose-300">
        <span className="h-px flex-1 bg-rose-100" /> OR <span className="h-px flex-1 bg-rose-100" />
      </div>
      <button type="button" className="btn-secondary w-full" disabled={busy} onClick={() => void run(loginWithGoogle)}>
        <GoogleIcon /> Sign up with Google
      </button>
      <p className="mt-6 text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-bold text-rose-600 hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
