"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";

export function SiteHeader() {
  const router = useRouter();
  const { count } = useCart();
  const [term, setTerm] = useState("");

  function submitSearch(event) {
    event.preventDefault();
    const query = term.trim();
    if (query) router.push(`/search?q=${encodeURIComponent(query)}`);
  }

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
          <Link href="/">Home</Link>
          <Link href="/about">About</Link>
          <div className="shop-menu">
            <button className="shop-menu-button" type="button">
              Shop
            </button>
            <div className="shop-dropdown">
              <Link href="/retail">Retail</Link>
              <Link href="/wholesale">Wholesale</Link>
              <Link href="/reseller">Reseller</Link>
            </div>
          </div>
          <Link href="/contact">Contact</Link>
          <form className="nav-search" onSubmit={submitSearch}>
            <input
              type="search"
              placeholder="Search"
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
      </div>
    </header>
  );
}
