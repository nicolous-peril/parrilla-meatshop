"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("parrillameatshop@gmail.com");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("Checking staff session...");
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session || null);
      setMessage(data.session ? "" : "Sign in with your staff account.");
      setIsLoading(false);
    }

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setMessage(nextSession ? "" : "Sign in with your staff account.");
      setIsLoading(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function signIn(event) {
    event.preventDefault();
    setIsSigningIn(true);
    setMessage("Signing in...");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
    } else {
      setPassword("");
      setMessage("");
    }

    setIsSigningIn(false);
  }

  async function signOut() {
    setMessage("Signing out...");
    await supabase.auth.signOut();
    setSession(null);
  }

  if (isLoading) {
    return (
      <main className="admin-auth-screen">
        <div className="empty-state">Checking staff session...</div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="admin-auth-screen">
        <form className="panel form-grid admin-login" onSubmit={signIn}>
          <p className="eyebrow">Parrilla admin</p>
          <h1>Staff login</h1>
          <p className="muted">
            Your login lasts for this browser session and ends when the browser is closed.
          </p>
          <label className="field-label">
            <span>Email</span>
            <input
              className="field"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className="field-label">
            <span>Password</span>
            <input
              className="field"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={isSigningIn}>
            {isSigningIn ? "Signing in..." : "Sign in"}
          </button>
          {message ? <p className="form-message">{message}</p> : null}
        </form>
      </main>
    );
  }

  return (
    <AdminAuthContext.Provider value={{ supabase, session, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used inside AdminAuthProvider.");
  return context;
}
