"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthShell, GoogleIcon, safeNext } from "@/components/AuthShell";
import { authErrorMessage, useAuth } from "@/components/AuthProvider";
import { LIMITS } from "@/lib/limits";
import type { Gender } from "@/lib/types";

const MIN_PASSWORD = 8;

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
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [gender, setGender] = useState<Gender>("boy");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user && !busy) router.replace(next);
  }, [user, busy, next, router]);

  const mismatch = confirm.length > 0 && confirm !== password;

  const run = async (fn: () => Promise<void>, after: string) => {
    setError("");
    setBusy(true);
    try {
      await fn();
      router.replace(after);
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
          if (password.length < MIN_PASSWORD) return setError(`Password must be at least ${MIN_PASSWORD} characters.`);
          if (password !== confirm) return setError("Passwords don't match.");
          void run(
            () => register({ name: name.trim(), email: email.trim(), password, gender }),
            `/verify-email?next=${encodeURIComponent(next)}`,
          );
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
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="password">Password</label>
            <button type="button" className="mb-1.5 text-xs font-bold text-rose-500 hover:underline" onClick={() => setShowPassword((s) => !s)}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={MIN_PASSWORD}
            autoComplete="new-password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby="password-hint"
          />
          <p id="password-hint" className="mt-1.5 text-xs text-ink-soft">At least {MIN_PASSWORD} characters.</p>
        </div>
        <div>
          <label className="label" htmlFor="confirm">Confirm password</label>
          <input
            id="confirm"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            className={`input ${mismatch ? "!border-red-300 focus:!ring-red-100" : ""}`}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={mismatch}
            aria-describedby="confirm-hint"
          />
          <p id="confirm-hint" className={`mt-1.5 text-xs font-semibold ${mismatch ? "text-red-600" : "text-emerald-600"}`} aria-live="polite">
            {mismatch ? "Passwords don't match." : confirm && confirm === password ? "Passwords match ✓" : "\u00a0"}
          </p>
        </div>
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={busy || mismatch}>
          {busy ? "Creating your account…" : "Create account"}
        </button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs font-bold text-rose-300">
        <span className="h-px flex-1 bg-rose-100" /> OR <span className="h-px flex-1 bg-rose-100" />
      </div>
      <button type="button" className="btn-secondary w-full" disabled={busy} onClick={() => void run(loginWithGoogle, next)}>
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
