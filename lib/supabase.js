import { createClient } from "@supabase/supabase-js";

export function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase browser environment variables.");
  }

  const sessionStorageAdapter = {
    getItem(key) {
      return typeof window === "undefined" ? null : window.sessionStorage.getItem(key);
    },
    setItem(key, value) {
      if (typeof window !== "undefined") window.sessionStorage.setItem(key, value);
    },
    removeItem(key) {
      if (typeof window !== "undefined") window.sessionStorage.removeItem(key);
    }
  };

  return createClient(url, key, {
    auth: {
      storage: sessionStorageAdapter,
      persistSession: true,
      autoRefreshToken: true
    }
  });
}
