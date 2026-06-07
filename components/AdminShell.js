"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdminAuth } from "@/components/AdminAuthProvider";

function OrdersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="4" width="14" height="16" rx="2" />
      <path d="M9 4V2M15 4V2M8 9h8M8 13h8M8 17h5" />
    </svg>
  );
}

function ProductsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="m4.5 7.7 7.5 4.2 7.5-4.2M12 12v9" />
    </svg>
  );
}

export function AdminShell({ children }) {
  const pathname = usePathname();
  const { supabase, session, signOut } = useAdminAuth();
  const [profile, setProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const { data } = await supabase
        .from("admin_profiles")
        .select("full_name, role")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (active) setProfile(data || null);
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, [session.user.id, supabase]);

  const displayName = profile?.full_name || session.user.email?.split("@")[0] || "Staff";
  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="admin-dashboard-shell">
      <button
        className="admin-mobile-menu"
        type="button"
        aria-label="Open admin navigation"
        aria-expanded={sidebarOpen}
        onClick={() => setSidebarOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>

      {sidebarOpen ? (
        <button
          className="admin-sidebar-scrim"
          type="button"
          aria-label="Close admin navigation"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside className={sidebarOpen ? "admin-sidebar is-open" : "admin-sidebar"}>
        <Link className="admin-brand" href="/admin" onClick={() => setSidebarOpen(false)}>
          <img src="/images/parrilla logo.png" alt="" />
          <img src="/images/parrilla-text-lockup-v2.svg" alt="Parrilla Meat Shop" />
        </Link>

        <nav className="admin-sidebar-nav" aria-label="Admin navigation">
          <Link
            className={pathname === "/admin" ? "active" : ""}
            href="/admin"
            onClick={() => setSidebarOpen(false)}
          >
            <OrdersIcon />
            <span>Orders</span>
          </Link>
          <Link
            className={pathname.startsWith("/admin/products") ? "active" : ""}
            href="/admin/products"
            onClick={() => setSidebarOpen(false)}
          >
            <ProductsIcon />
            <span>Products</span>
          </Link>
        </nav>

        <div className="admin-staff-card">
          <div className="admin-staff-profile">
            <span className="admin-avatar">{initials}</span>
            <span>
              <strong>{displayName}</strong>
              <small>{profile?.role === "owner" ? "Admin Owner" : "Admin Staff"}</small>
            </span>
          </div>
          <button type="button" onClick={signOut}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9" />
            </svg>
            Log out
          </button>
          <p>Session ends when you close the browser</p>
        </div>
      </aside>

      <div className="admin-main">{children}</div>
    </div>
  );
}
