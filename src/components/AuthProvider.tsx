"use client";

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import type { Gender, UserProfile } from "@/lib/types";

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  register: (input: { name: string; email: string; password: string; gender: Gender }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/** Returns the stored profile, or null when no users/{uid} doc exists yet. */
async function loadProfile(user: User): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db(), "users", user.uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

const fallbackProfile = (user: User): UserProfile => ({
  displayName: user.displayName ?? "",
  email: user.email ?? "",
  gender: "other",
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return onAuthStateChanged(auth(), async (u) => {
      setUser(u);
      if (u) {
        const stored = await loadProfile(u).catch(() => null);
        // During registration this listener can race register()'s setDoc; never
        // replace the profile register() already set with a fallback.
        setProfile((prev) => stored ?? (prev?.email === u.email ? prev : fallbackProfile(u)));
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const register = useCallback<AuthState["register"]>(async ({ name, email, password, gender }) => {
    const cred = await createUserWithEmailAndPassword(auth(), email, password);
    await updateProfile(cred.user, { displayName: name });
    const p: UserProfile = { displayName: name, email, gender };
    await setDoc(doc(db(), "users", cred.user.uid), { ...p, createdAt: serverTimestamp() });
    // onAuthStateChanged may have fired before the doc existed; set it explicitly.
    setProfile(p);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth(), email, password);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    await signInWithPopup(auth(), new GoogleAuthProvider());
  }, []);

  const signOut = useCallback(async () => {
    await fbSignOut(auth());
  }, []);

  const value = useMemo(
    () => ({ user, profile, loading, register, login, loginWithGoogle, signOut }),
    [user, profile, loading, register, login, loginWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  const map: Record<string, string> = {
    "auth/email-already-in-use": "That email already has an account. Try logging in.",
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/invalid-credential": "Wrong email or password.",
    "auth/wrong-password": "Wrong email or password.",
    "auth/user-not-found": "Wrong email or password.",
    "auth/too-many-requests": "Too many attempts. Take a breath and try again in a minute.",
    "auth/popup-closed-by-user": "The Google window was closed before finishing.",
    "auth/unauthorized-domain":
      "This domain isn't authorised in Firebase Auth. Add it under Authentication → Settings → Authorized domains.",
  };
  return map[code] ?? (err instanceof Error ? err.message : "Something went wrong.");
}
