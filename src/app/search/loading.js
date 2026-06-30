export default function Loading() {
  return (
    <div className="nm-page-body">
      <div className="skeleton-search-bar" />
      <div className="search-top-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-cover" />
            <div className="skeleton-meta" />
          </div>
        ))}
      </div>
    </div>
  );
}