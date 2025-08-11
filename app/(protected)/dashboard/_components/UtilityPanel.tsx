// app/(protected)/dashboard/_components/UtilityPanel.tsx
import Link from "next/link";

export default function UtilityPanel({ tip }: { tip: string }) {
  return (
    <aside className="db-card" aria-label="Quick actions">
      <h3 className="db-card-title" style={{ marginBottom: 10 }}>Quick actions</h3>
      <div className="db-quick">
        <Link className="db-btn db-btn-secondary" href="/?upload=1">Upload file</Link>
        <Link className="db-btn db-btn-secondary" href="/review">Review all</Link>
      </div>
      <div className="db-tip">{tip}</div>
      <div className="db-news" role="note" aria-label="What is new">
        <span className="db-badge">New</span> Polished progress ring and improved spacing.
      </div>
    </aside>
  );
}