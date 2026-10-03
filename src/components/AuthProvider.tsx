"use client";

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { GENERIC_ERROR, reportError } from "@/lib/errors";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import type { Gender, UserProfile } from "@/lib/types";

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  /** Mirrors user.emailVerified; kept in state because reload() mutates the same User object. */
  emailVerified: boolean;
  register: (input: { name: string; email: string; password: string; gender: Gender }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resendVerification: () => Promise<void>;
  /** Re-fetches the user from Firebase; returns true once the email is verified. */
  checkVerification: () => Promise<boolean>;
}

const AuthContext = createContext<AuthState | null>(null);

async function sendVerificationEmail(user: User): Promise<void> {
  try {
    // Brings them back to the app after clicking the link.
    await sendEmailVerification(user, { url: `${window.location.origin}/dashboard` });
  } catch (err) {
    // Continue URL rejected (domain not in Firebase's authorized list) – send the plain email instead.
    if ((err as { code?: string })?.code === "auth/unauthorized-continue-uri") {
      await sendEmailVerification(user);
    } else {
      throw err;
    }
  }
}

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
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return onAuthStateChanged(auth(), async (u) => {
      setUser(u);
      setEmailVerified(u?.emailVerified ?? false);
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
    await sendVerificationEmail(cred.user);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth(), email, password);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      await signInWithPopup(auth(), provider);
    } catch (err) {
      // Popups are blocked in many in-app browsers (Instagram, Facebook…); fall back to a full redirect.
      if ((err as { code?: string })?.code === "auth/popup-blocked") {
        await signInWithRedirect(auth(), provider);
      } else {
        throw err;
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    await fbSignOut(auth());
  }, []);

  const resendVerification = useCallback(async () => {
    const u = auth().currentUser;
    if (u) await sendVerificationEmail(u);
  }, []);

  const checkVerification = useCallback(async () => {
    const u = auth().currentUser;
    if (!u) return false;
    await u.reload();
    if (u.emailVerified) {
      // Refresh the ID token so Firestore rules see email_verified = true.
      await u.getIdToken(true);
      setEmailVerified(true);
    }
    return u.emailVerified;
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      emailVerified,
      register,
      login,
      loginWithGoogle,
      signOut,
      resendVerification,
      checkVerification,
    }),
    [user, profile, loading, emailVerified, register, login, loginWithGoogle, signOut, resendVerification, checkVerification],
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
    "auth/weak-password": "Password must be at least 8 characters.",
    "auth/invalid-credential": "Wrong email or password.",
    "auth/wrong-password": "Wrong email or password.",
    "auth/user-not-found": "Wrong email or password.",
    "auth/too-many-requests": "Too many attempts. Take a breath and try again in a minute.",
    "auth/popup-closed-by-user": "The Google window was closed before finishing.",
    "auth/cancelled-popup-request": "The Google window was closed before finishing.",
    "auth/popup-blocked": "Your browser blocked the Google sign-in window. Allow pop-ups and try again.",
    // Misconfiguration on our side: keep the copy neutral, details go to the console.
    "auth/operation-not-allowed": "This sign-in option is temporarily unavailable. Please try another method.",
    "auth/unauthorized-domain": "Google sign-in is temporarily unavailable. Please use your email and password.",
    "auth/unauthorized-continue-uri": GENERIC_ERROR,
    "auth/network-request-failed": "Network error. Please check your connection and try again.",
    "auth/user-disabled": "This account has been disabled. Please contact support.",
    "auth/missing-password": "Please enter your password.",
  };
  const misconfigured = ["auth/operation-not-allowed", "auth/unauthorized-domain", "auth/unauthorized-continue-uri"];
  if (!map[code] || misconfigured.includes(code)) reportError(`auth error ${code || "(no code)"}`, err);
  return map[code] ?? GENERIC_ERROR;
}
