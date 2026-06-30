export default function Loading() {
  return (
    <div className="nm-page-body">
      <div className="profile-header">
        <div className="skeleton-avatar" />
        <div style={{ flex: 1 }}>
          <div className="skeleton-rd-title" style={{ width: 140 }} />
          <div className="skeleton-summary" style={{ width: "60%" }} />
        </div>
      </div>
      <div className="fav-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-card" style={{ maxWidth: 180 }}>
            <div className="skeleton-cover" />
            <div className="skeleton-meta" />
          </div>
        ))}
      </div>
    </div>
  );
}