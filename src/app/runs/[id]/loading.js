export default function Loading() {
  return (
    <div className="nm-page-body">
      <div className="skeleton-back" />

      <div className="rd-hero">
        <div className="skeleton-rd-cover" />
        <div className="rd-info">
          <div className="skeleton-publisher" />
          <div className="skeleton-rd-title" />
          <div className="skeleton-rd-meta" />
          <div className="skeleton-rating-row" />
          <div className="skeleton-actions" />
        </div>
      </div>

      <hr className="rd-divider" />

      <div className="rd-body">
        <div className="rd-main">
          <div className="skeleton-section-label" />
          <div className="skeleton-summary" />
          <div className="skeleton-summary" style={{ width: "80%" }} />
          <div className="skeleton-summary" style={{ width: "60%" }} />
        </div>
        <div className="rd-sidebar">
          <div className="skeleton-sidebar-card" />
          <div className="skeleton-sidebar-card" />
        </div>
      </div>
    </div>
  );
}