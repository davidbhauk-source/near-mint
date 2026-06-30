export default function Loading() {
  return (
    <div className="nm-page-body">
      <div className="skeleton-hero">
        <div className="skeleton-eyebrow" />
        <div className="skeleton-title" />
        <div className="skeleton-sub" />
      </div>

      {[1, 2, 3].map((row) => (
        <div key={row} className="nm-section">
          <div className="skeleton-section-label" />
          <div className="nm-run-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-cover" />
                <div className="skeleton-meta" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}