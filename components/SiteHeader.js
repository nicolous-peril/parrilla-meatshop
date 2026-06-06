"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { count } = useCart();
  const [term, setTerm] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tabletSearchOpen, setTabletSearchOpen] = useState(false);
  const shopIsActive = ["/retail", "/wholesale", "/reseller", "/product", "/search"].some((path) =>
    pathname === path || pathname.startsWith(`${path}/`)
  );

  function navClass(href) {
    return pathname === href ? "active" : undefined;
  }

  function submitSearch(event) {
    event.preventDefault();
    const query = term.trim();
    if (query) router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  const searchForm = (className) => (
    <form className={className} onSubmit={submitSearch}>
      <input
        type="search"
        placeholder="Search products"
        aria-label="Search products"
        required
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        style={{ "--search-chars": Math.max(6, term.length) }}
      />
      <button className="nav-search-submit" type="submit" aria-label="Search">
        <svg
          className="search-icon"
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
      </button>
    </form>
  );

  return (
    <header className="site-header">
      <div className="nav-wrap">
        <Link className="brand" href="/">
          <img className="brand-mark" src="/images/parrilla logo.png" alt="" />
          <img
            className="brand-wordmark"
            src="/images/parrilla-text-lockup-v2.svg"
            alt="Parrilla Meat Shop"
          />
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link className={navClass("/")} href="/" onClick={closeMobileMenu}>
            Home
          </Link>
          <Link className={navClass("/about")} href="/about" onClick={closeMobileMenu}>
            About
          </Link>
          <div className="shop-menu">
            <button className={shopIsActive ? "shop-menu-button active" : "shop-menu-button"} type="button">
              Shop
            </button>
            <div className="shop-dropdown">
              <Link className={navClass("/retail")} href="/retail" onClick={closeMobileMenu}>
                Retail
              </Link>
              <Link className={navClass("/wholesale")} href="/wholesale" onClick={closeMobileMenu}>
                Wholesale
              </Link>
              <Link className={navClass("/reseller")} href="/reseller" onClick={closeMobileMenu}>
                Reseller
              </Link>
            </div>
          </div>
          <Link className={navClass("/contact")} href="/contact" onClick={closeMobileMenu}>
            Contact
          </Link>
          {searchForm("nav-search desktop-search")}
          <button
            className="header-icon-button tablet-search-toggle"
            type="button"
            aria-label="Open product search"
            aria-expanded={tabletSearchOpen}
            onClick={() => setTabletSearchOpen((open) => !open)}
          >
            <svg className="search-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
          </button>
          <Link className="cart-link" href="/cart" aria-label="Cart">
            <svg
              className="cart-icon"
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h8.84a2 2 0 0 0 2-1.58l1.65-7.43H5.12" />
            </svg>
            <span className="cart-count">{count}</span>
          </Link>
        </nav>
        <div className="mobile-header-actions">
          <Link className="cart-link" href="/cart" aria-label="Cart">
            <svg
              className="cart-icon"
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h8.84a2 2 0 0 0 2-1.58l1.65-7.43H5.12" />
            </svg>
            <span className="cart-count">{count}</span>
          </Link>
          <button
            className="header-icon-button mobile-menu-toggle"
            type="button"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <svg
              className="menu-icon"
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              {mobileMenuOpen ? (
                <>
                  <path d="M6 6l12 12" />
                  <path d="M18 6 6 18" />
                </>
              ) : (
                <>
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>
      <div className="mobile-search-row">
        {searchForm("nav-search mobile-search")}
      </div>
      <div className={tabletSearchOpen ? "tablet-search-panel open" : "tablet-search-panel"}>
        {searchForm("nav-search tablet-search")}
      </div>
      <nav
        className={mobileMenuOpen ? "mobile-nav-panel open" : "mobile-nav-panel"}
        aria-label="Mobile navigation"
      >
        <Link className={navClass("/")} href="/" onClick={closeMobileMenu}>Home</Link>
        <Link className={navClass("/about")} href="/about" onClick={closeMobileMenu}>About</Link>
        <Link className={navClass("/retail")} href="/retail" onClick={closeMobileMenu}>Retail</Link>
        <Link className={navClass("/wholesale")} href="/wholesale" onClick={closeMobileMenu}>Wholesale</Link>
        <Link className={navClass("/reseller")} href="/reseller" onClick={closeMobileMenu}>Reseller</Link>
        <Link className={navClass("/contact")} href="/contact" onClick={closeMobileMenu}>Contact</Link>
      </nav>
    </header>
  );
}
