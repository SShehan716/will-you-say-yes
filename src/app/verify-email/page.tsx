"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { authErrorMessage, useAuth } from "@/components/AuthProvider";
import { AuthShell, safeNext } from "@/components/AuthShell";
import { HeartLoader } from "@/components/HeartLoader";

const RESEND_COOLDOWN = 60;

function VerifyEmail() {
  const { user, loading, emailVerified, resendVerification, checkVerification, signOut } = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN); // an email was just sent on sign-up
  const [message, setMessage] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (emailVerified) router.replace(next);
  }, [loading, user, emailVerified, next, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Pick up a verification done in another tab or on another device.
  useEffect(() => {
    if (!user || emailVerified) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void checkVerification().catch(() => {});
    }, 5000);
    return () => clearInterval(id);
  }, [user, emailVerified, checkVerification]);

  if (loading || !user || emailVerified) return <HeartLoader />;

  return (
    <AuthShell title="Check your inbox 💌" subtitle="One quick step before you can create questions.">
      <p className="text-ink">
        We sent a verification link to <span className="font-bold break-all">{user.email}</span>. Click it, then come
        back here — this page continues automatically.
      </p>
      <p className="mt-2 text-sm text-ink-soft">Can&apos;t find it? Check your spam or promotions folder.</p>

      {message && (
        <p
          className={`mt-4 rounded-xl px-3 py-2 text-sm font-semibold ${
            message.tone === "error" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
          }`}
          role="status"
        >
          {message.text}
        </p>
      )}

      <button
        type="button"
        className="btn-primary mt-6 w-full"
        disabled={checking}
        onClick={async () => {
          setChecking(true);
          setMessage(null);
          try {
            if (!(await checkVerification())) {
              setMessage({ tone: "error", text: "Not verified yet. Click the link in the email first." });
            }
          } catch (err) {
            setMessage({ tone: "error", text: authErrorMessage(err) });
          }
          setChecking(false);
        }}
      >
        {checking ? "Checking…" : "I've verified my email"}
      </button>

      <button
        type="button"
        className="btn-secondary mt-3 w-full"
        disabled={cooldown > 0}
        onClick={async () => {
          setMessage(null);
          try {
            await resendVerification();
            setCooldown(RESEND_COOLDOWN);
            setMessage({ tone: "info", text: "Sent! Check your inbox." });
          } catch (err) {
            setMessage({ tone: "error", text: authErrorMessage(err) });
          }
        }}
      >
        {cooldown > 0 ? `Resend email in ${cooldown}s` : "Resend verification email"}
      </button>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Wrong email?{" "}
        <button
          type="button"
          className="font-bold text-rose-600 hover:underline"
          onClick={async () => {
            await signOut();
            router.replace("/register");
          }}
        >
          Sign up again
        </button>
      </p>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmail />
    </Suspense>
  );
}
