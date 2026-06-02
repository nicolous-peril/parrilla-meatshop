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
        placeholder={compact ? "Search" : "Search meats, cuts, brands"}
        aria-label="Search"
        required
        value={term}
        onChange={(event) => setTerm(event.target.value)}
      />
      <button className={compact ? "" : "btn btn-dark"} type="submit">
        Search
      </button>
    </form>
  );
}
