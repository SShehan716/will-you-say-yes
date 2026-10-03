"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { HeartLoader } from "./HeartLoader";

/** Signed-in users with a verified email only; everyone else is sent to log in or verify. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading, emailVerified } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    const next = encodeURIComponent(pathname + window.location.search);
    if (!user) router.replace(`/login?next=${next}`);
    else if (!emailVerified) router.replace(`/verify-email?next=${next}`);
  }, [loading, user, emailVerified, router, pathname]);

  if (loading || !user || !emailVerified) return <HeartLoader />;
  return <>{children}</>;
}
