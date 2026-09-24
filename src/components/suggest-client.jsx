'use client'
import { useState } from "react";

export default function SuggestClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [suggesting, setSuggesting] = useState(null);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [yearFilter, setYearFilter] = useState("");

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    setOffset(0);
    setError(null);
    setSuccess(null);
  
    const params = new URLSearchParams({ q: query, offset: "0" });
    if (yearFilter.trim()) params.append("year", yearFilter.trim());

    const res = await fetch(`/api/comicvine/search?${params}`);
    const data = await res.json();

    if (!res.ok) {
      setError("Search failed. Try again.");
    } else {
      setResults(data.results ?? []);
      setTotal(data.total ?? 0);
   }
    setSearching(false);
  }

  async function handleLoadMore() {
    setLoadingMore(true);
    const newOffset = offset + 25;
    const params = new URLSearchParams({ q: query, offset: String(newOffset) });
    if (yearFilter.trim()) params.append("year", yearFilter.trim());
  
    const res = await fetch(`/api/comicvine/search?${params}`);
    const data = await res.json();

    if (!res.ok) {
      setError("Failed to load more.");
    } else {
      setResults((prev) => [...prev, ...(data.results ?? [])]);
      setOffset(newOffset);
    }
    setLoadingMore(false);
  }

  async function handleSuggest(volume) {
    setSuggesting(volume.id);
    setError(null);
    setSuccess(null);

    const res = await fetch("/api/comicvine/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ volume }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to suggest run.");
    } else {
      setSuccess(`"${volume.name}" has been suggested and is pending review.`);
    }
    setSuggesting(null);
  }

  const hasMore = results.length < total;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input
          className="auth-input"
          placeholder="Search for a comic series…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          style={{ flex: 1 }}
        />
        <input
          className="auth-input"
          placeholder="Year"
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          style={{ width: 80 }}
          type="number"
          min="1930"
          max="2030"
        />
        <button
          className="log-btn-save"
          onClick={handleSearch}
          disabled={searching}
          type="button"
        >
          {searching ? "Searching…" : "Search"}
        </button>
      </div>

      {error && <p className="log-error">{error}</p>}
      {success && <p className="auth-success" style={{ marginBottom: 16 }}>{success}</p>}

      {results.length > 0 && (
        <p style={{ fontSize: 12, color: "rgba(245,242,235,0.35)", marginBottom: 16 }}>
          Showing {results.length} of {total} results
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {results.map((volume) => (
          <div key={volume.id} className="suggest-result">
            {volume.image?.small_url ? (
              <img src={volume.image.small_url} alt={volume.name} className="suggest-thumb" />
            ) : (
              <div className="suggest-thumb suggest-thumb-ph" />
            )}
            <div className="suggest-info">
              <div className="suggest-title">{volume.name}</div>
              <div className="suggest-meta">
                {[
                  volume.publisher?.name,
                  volume.start_year,
                  volume.count_of_issues ? `${volume.count_of_issues} issues` : null,
                ].filter(Boolean).join(" · ")}
              </div>
              {volume.description && (
                <div className="suggest-desc"
                  dangerouslySetInnerHTML={{
                    __html: volume.description.replace(/<[^>]*>/g, "").slice(0, 120) + "…"
                  }}
                />
              )}
            </div>
            <button
              className="log-btn-save"
              onClick={() => handleSuggest(volume)}
              disabled={suggesting === volume.id}
              type="button"
              style={{ flexShrink: 0, fontSize: 12, padding: "6px 14px" }}
            >
              {suggesting === volume.id ? "Suggesting…" : "Suggest"}
            </button>
          </div>
        ))}
      </div>

      {hasMore && (
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button
            className="rd-btn-secondary"
            onClick={handleLoadMore}
            disabled={loadingMore}
            type="button"
          >
            {loadingMore ? "Loading…" : `Load more (${total - results.length} remaining)`}
          </button>
        </div>
      )}
    </div>
  );
}