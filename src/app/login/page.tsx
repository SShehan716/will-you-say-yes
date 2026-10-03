"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthShell, GoogleIcon, safeNext } from "@/components/AuthShell";
import { authErrorMessage, useAuth } from "@/components/AuthProvider";

function LoginForm() {
  const { user, login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) router.replace(next);
  }, [user, next, router]);

  const run = async (fn: () => Promise<void>) => {
    setError("");
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Welcome back 💕" subtitle="Log in to see who said yes.">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void run(() => login(email, password));
        }}
      >
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" required autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? "Logging in…" : "Log in"}
        </button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs font-bold text-rose-300">
        <span className="h-px flex-1 bg-rose-100" /> OR <span className="h-px flex-1 bg-rose-100" />
      </div>
      <button type="button" className="btn-secondary w-full" disabled={busy} onClick={() => void run(loginWithGoogle)}>
        <GoogleIcon /> Continue with Google
      </button>
      <p className="mt-6 text-center text-sm text-ink-soft">
        New here?{" "}
        <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-bold text-rose-600 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
