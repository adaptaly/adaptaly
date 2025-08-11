// app/(protected)/dashboard/_components/EmptyStates.tsx
import Link from "next/link";

export function ZeroDocsCard() {
  return (
    <section className="db-card db-empty" aria-label="No documents yet">
      <h3 className="db-card-title">Start your first pack</h3>
      <p className="db-empty-sub">Turn any PDF or DOCX into study cards and a summary.</p>
      <Link className="db-btn db-btn-primary" href="/?upload=1">Upload a file</Link>
    </section>
  );
}

export function ZeroDueCard() {
  return (
    <section className="db-card db-empty" aria-label="No cards due">
      <h3 className="db-card-title">You are all caught up</h3>
      <p className="db-empty-sub">Keep momentum with a quick 5 minute session.</p>
      <Link className="db-btn db-btn-secondary" href="/review?quick=1">Quick review</Link>
    </section>
  );
}

export function ZeroMinutesCard() {
  return (
    <section className="db-card db-empty" aria-label="No minutes tracked today">
      <h3 className="db-card-title">Make today count</h3>
      <p className="db-empty-sub">Short, focused sessions work best. Try 15 minutes.</p>
      <Link className="db-btn db-btn-secondary" href="/review?quick=1">Start 15 minute session</Link>
    </section>
  );
}