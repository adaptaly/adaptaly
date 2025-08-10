// app/(protected)/dashboard/_components/RecentPacks.tsx
import Link from "next/link";

export type RecentDoc = {
  id: string;
  title: string;
  createdAt: string;
  totalCards: number;
  masteredCount: number;
};

type Props = {
  docs: RecentDoc[];
};

export default function RecentPacks({ docs }: Props) {
  if (!docs || docs.length === 0) {
    return (
      <section className="db-card db-empty">
        <div className="db-empty-illustration" aria-hidden>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M7 8h10M7 12h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </div>
        <h3 className="db-empty-title">No Study Packs yet</h3>
        <p className="db-empty-sub">Upload a file to generate flashcards and summaries.</p>
        <Link href="/?upload=1" className="db-btn db-btn-primary">Upload file</Link>
      </section>
    );
  }

  return (
    <section className="db-card">
      <div className="db-card-head">
        <h3 className="db-card-title">Recent Study Packs</h3>
        {/* placeholder for "View all" in a later iteration */}
      </div>
      <ul className="db-doclist">
        {docs.map((d) => {
          const total = d.totalCards || 0;
          const mastered = Math.min(d.masteredCount || 0, total);
          const pct = total > 0 ? Math.round((100 * mastered) / total) : 0;
          return (
            <li key={d.id} className="db-doc">
              <div className="db-doc-main">
                <div className="db-doc-title">{d.title}</div>
                <div className="db-doc-meta">
                  <time dateTime={d.createdAt}>{new Date(d.createdAt).toLocaleDateString()}</time>
                  <span aria-hidden>•</span>
                  <span>{total} cards</span>
                </div>
                <div className="db-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                  <div className="db-progress-bar" style={{ width: `${pct}%` }} />
                </div>
                <div className="db-progress-label">{mastered} mastered</div>
              </div>
              <div className="db-doc-actions">
                <Link className="db-btn db-btn-ghost" href={`/review?doc=${encodeURIComponent(d.id)}`}>Review</Link>
                <Link className="db-btn db-btn-ghost" href={`/`}>Open</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}