"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchForm({ className = "toolbar", initialValue = "", compact = false }) {
  const router = useRouter();
  const [term, setTerm] = useState(initialValue);

  function submitSearch(event) {
    event.preventDefault();
    const query = term.trim();
    if (query) router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <form className={className} onSubmit={submitSearch}>
      <input
        className={compact ? "" : "field"}
        type="search"
        placeholder={compact ? "Search" : "Search meats and cuts"}
        aria-label="Search"
        required
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        style={compact ? { "--search-chars": Math.max(6, term.length) } : undefined}
      />
      <button className={compact ? "nav-search-submit" : "btn btn-dark"} type="submit" aria-label="Search">
        {compact ? (
          <svg className="search-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
        ) : (
          "Search"
        )}
      </button>
    </form>
  );
}
