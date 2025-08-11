// app/(protected)/dashboard/_components/UtilityPanel.tsx
import Link from "next/link";

export default function UtilityPanel() {
  return (
    <aside className="db-card">
      <h3 className="db-card-title" style={{ marginBottom: 10 }}>Quick actions</h3>
      <div className="db-quick">
        <Link className="db-btn db-btn-secondary" href="/?upload=1">Upload file</Link>
        <Link className="db-btn db-btn-secondary" href="/review">Review all</Link>
      </div>
      <div className="db-tip">
        Tip: Short 15–25 minute sessions improve retention.
      </div>
      <div className="db-news" role="note" aria-label="What’s new">
        <span className="db-badge">New</span> Progress ring & deltas are live.
      </div>
    </aside>
  );
}