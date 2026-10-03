"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-rose-600">
      <span className="animate-heartbeat text-2xl" aria-hidden>
        💘
      </span>
      <span className="font-display text-2xl font-bold tracking-tight">Say Yes</span>
    </Link>
  );
}

export function Navbar() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  return (
    <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
      <Logo />
      <nav className="flex items-center gap-2 text-sm font-bold sm:gap-3">
        {loading ? null : user ? (
          <>
            <Link href="/dashboard" className="btn-ghost">
              My questions
            </Link>
            <button
              type="button"
              className="btn-ghost hidden sm:inline-flex"
              onClick={async () => {
                await signOut();
                router.push("/");
              }}
            >
              Log out
            </button>
            <Link href="/create" className="btn-primary !px-4 !py-2">
              + New
            </Link>
          </>
        ) : (
          <>
            <Link href="/login" className="btn-ghost">
              Log in
            </Link>
            <Link href="/register" className="btn-primary !px-4 !py-2">
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
