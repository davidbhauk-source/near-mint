'use client'
import { useState, useMemo } from "react";
import Link from "next/link";

const DECADES = ["1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"];
const LENGTHS = [
  { label: "Short (1–20)", key: "short", min: 1, max: 20 },
  { label: "Medium (21–50)", key: "medium", min: 21, max: 50 },
  { label: "Long (51–100)", key: "long", min: 51, max: 100 },
  { label: "Epic (100+)", key: "epic", min: 101, max: Infinity },
];
const PUBLISHERS = ["All", "Marvel", "DC", "Image", "Indie"];

export default function SearchClient({ runs, topRated }) {
  const [query, setQuery] = useState("");
  const [publisher, setPublisher] = useState("All");

  const results = useMemo(() => {
    if (query.trim().length === 0) return [];
    const q = query.toLowerCase();

    return runs
      .filter((run) => {
        const titleMatch = run.title?.toLowerCase().includes(q);
        const publisherMatch = run.publisher?.toLowerCase().includes(q);
        const writerMatch = run.creative_team?.writers?.some((w) =>
          w.toLowerCase().includes(q)
        );
        const artistMatch = run.creative_team?.artists?.some((a) =>
          a.toLowerCase().includes(q)
        );
        return titleMatch || publisherMatch || writerMatch || artistMatch;
      })
      .map((run) => {
        const q2 = query.toLowerCase();
        let matchType = "Title";
        if (run.creative_team?.writers?.some((w) => w.toLowerCase().includes(q2)))
          matchType = "Writer";
        else if (run.creative_team?.artists?.some((a) => a.toLowerCase().includes(q2)))
          matchType = "Artist";
        else if (run.publisher?.toLowerCase().includes(q2))
          matchType = "Publisher";
        return { ...run, matchType };
      });
  }, [query, runs]);

  const filteredRuns = useMemo(() => {
    if (publisher === "All") return runs;
    if (publisher === "Indie") {
      return runs.filter(
        (r) => !["Marvel", "DC", "Image"].includes(r.publisher)
      );
    }
    return runs.filter((r) => r.publisher === publisher);
  }, [runs, publisher]);

  const isSearching = query.trim().length > 0;

  return (
    <div className="nm-page-body">

      {/* Search bar */}
      <div className="search-bar-wrap">
        <input
          className="search-input"
          placeholder="Search runs, writers, artists, publishers…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {query && (
          <button className="search-clear" onClick={() => setQuery("")}>✕</button>
        )}
      </div>

      {isSearching ? (
        /* Results state */
        <div>
          <p className="search-results-count">
            {results.length} {results.length === 1 ? "result" : "results"} for "{query}"
          </p>

          {results.length === 0 ? (
            <p className="search-empty">No runs found — try a different search.</p>
          ) : (
            <ul className="search-results-list">
              {results.map((run) => (
                <li key={run.id}>
                  <Link href={`/runs/${run.id}`} className="search-result-row">
                    {run.cover_url ? (
                      <img src={run.cover_url} alt={run.title} className="search-result-thumb" />
                    ) : (
                      <div className="search-result-thumb search-result-thumb-ph" />
                    )}
                    <div className="search-result-info">
                      <div className="search-result-title">{run.title}</div>
                      <div className="search-result-meta">
                        {[
                          run.publisher,
                          run.creative_team?.writers?.join(", "),
                          run.start_year && run.end_year
                            ? `${run.start_year}–${run.end_year}`
                            : run.start_year,
                          run.issue_count ? `${run.issue_count} issues` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </div>
                    <span className="search-result-match">{run.matchType} match</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        /* Browse state */
        <div>
          {/* Publisher tabs */}
          <div className="search-tabs">
            {PUBLISHERS.map((p) => (
              <button
                key={p}
                className={`search-tab ${publisher === p ? "on" : ""}`}
                onClick={() => setPublisher(p)}
                type="button"
              >
                {p}
              </button>
            ))}
          </div>

          <div className="search-browse-grid">
            <div>
              {/* Browse by decade */}
              <div className="search-browse-section">
                <div className="search-browse-label">Browse by decade</div>
                <div className="search-pills">
                  {DECADES.map((d) => {
                    const decade = parseInt(d);
                    const count = filteredRuns.filter(
                      (r) => r.start_year >= decade && r.start_year < decade + 10
                    ).length;
                    if (count === 0) return null;
                    return (
                      <Link
                        key={d}
                        href={`/browse/decade?decade=${decade}`}
                        className="search-pill"
                      >
                        {d}
                        <span className="search-pill-count">{count}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Browse by length */}
              <div className="search-browse-section">
                <div className="search-browse-label">Browse by length</div>
                <div className="search-pills">
                  {LENGTHS.map((l) => {
          const count = filteredRuns.filter(
           (r) => r.issue_count !== null && r.issue_count >= l.min && r.issue_count <= l.max
          ).length;
           if (count === 0) return null;
         return (
         <Link
          key={l.label}
          href={`/browse/length?len=${l.key}`}
          className="search-pill"
          >
          {l.label}
          <span className="search-pill-count">{count}</span>
         </Link>
         );
         })}
                </div>
              </div>
            </div>

            {/* Top rated sidebar */}
            <div>
              <div className="search-browse-section">
                <div className="search-browse-label">Highly rated</div>
                <div className="search-top-grid">
                  {topRated.map((run) => (
                    <Link key={run.id} href={`/runs/${run.id}`} className="nm-run-card">
                      {run.cover_url ? (
                        <img src={run.cover_url} alt={run.title} className="nm-run-cover" />
                      ) : (
                        <div className="nm-run-cover nm-run-cover-placeholder">{run.title}</div>
                      )}
                      <div className="nm-run-meta">
                        <div className="nm-run-title">{run.title}</div>
                        <div className="nm-run-writer">
                          {run.avg_rating ? `★ ${run.avg_rating}` : ""}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}