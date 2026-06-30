'use client'
import { useState, useMemo } from "react";
import Link from "next/link";

const PAGE_SIZE = 48;

export default function BrowseCategoryClient({ runs }) {
  const [sort, setSort] = useState("popular");
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const copy = [...runs];
    switch (sort) {
      case "popular":
        return copy.sort((a, b)=>(b.log_count ?? 0) - (a.log_count ?? 0));
      case "year_asc":
        return copy.sort((a, b) => (a.start_year ?? 0) - (b.start_year ?? 0));
      case "year_desc":
        return copy.sort((a, b) => (b.start_year ?? 0) - (a.start_year ?? 0));
      case "issues_asc":
        return copy.sort((a, b) => (a.issue_count ?? 999) - (b.issue_count ?? 999));
      case "issues_desc":
        return copy.sort((a, b) => (b.issue_count ?? 0) - (a.issue_count ?? 0));
      default:
        return copy.sort((a, b) => a.title.localeCompare(b.title));
    }
  }, [runs, sort]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleSort(newSort) {
    setSort(newSort);
    setPage(0); // reset to first page on sort change
  }

  return (
    <div>
      {/* Sort controls */}
      <div className="cat-sort-row">
        <span className="cat-sort-label">Sort by</span>
       {[
       { value: "title", label: "Title" },
       { value: "popular", label: "Most logged" },  // ← add this
       { value: "year_desc", label: "Newest" },
       { value: "year_asc", label: "Oldest" },
       { value: "issues_asc", label: "Fewest issues" },
       { value: "issues_desc", label: "Most issues" },
       ].map((opt) => (
          <button
            key={opt.value}
            className={`cat-sort-btn ${sort === opt.value ? "on" : ""}`}
            onClick={() => handleSort(opt.value)}
            type="button"
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="nm-run-grid">
        {paginated.map((run) => (
          <Link key={run.id} href={`/runs/${run.id}`} className="nm-run-card">
            {run.cover_url ? (
              <img
                src={run.cover_url}
                alt={run.title}
                className="nm-run-cover"
              />
            ) : (
              <div className="nm-run-cover nm-run-cover-placeholder">
                {run.title}
              </div>
            )}
            <div className="nm-run-meta">
              <div className="nm-run-title">{run.title}</div>
              <div className="nm-run-writer">
                {run.creative_team?.writers?.join(", ") ?? ""}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="cat-pagination">
          <button
            className="cat-page-btn"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            type="button"
          >
            ← Previous
          </button>
          <span className="cat-page-info">
            Page {page + 1} of {totalPages}
          </span>
          <button
            className="cat-page-btn"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            type="button"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}