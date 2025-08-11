// app/(protected)/dashboard/_components/Hero.tsx
import Link from "next/link";

type Props = {
  name: string | null;
  dueCount: number;
  duePacksCount: number;
  hasDocs: boolean;
  onSettings?: () => void;
};

export default function Hero({ name, dueCount, duePacksCount, hasDocs, onSettings }: Props) {
  const greeting = name ? `Welcome, ${name}` : "Welcome";
  const breakdown =
    dueCount > 0
      ? `${dueCount} due • ${duePacksCount} pack${duePacksCount === 1 ? "" : "s"}`
      : hasDocs
      ? "No cards due"
      : "Create your first Study Pack";

  const primaryLabel =
    dueCount > 0 ? `Review ${dueCount} due` : hasDocs ? "Start 5 minute session" : "Upload your first file";
  const primaryHref = dueCount > 0 ? "/review" : hasDocs ? "/review?quick=1" : "/?upload=1";
  const secondaryHref = "/learn";

  return (
    <section className="db-hero" aria-labelledby="db-hero-title">
      <h1 id="db-hero-title" className="db-hero-title">{greeting}</h1>
      <p className="db-hero-sub" aria-live="polite">{breakdown}</p>
      <div className="db-hero-actions" role="group" aria-label="Primary actions">
        <Link className="db-btn db-btn-primary" href={primaryHref} aria-label={primaryLabel}>
          {primaryLabel}
          <span className="db-btn-icon" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </Link>
        <Link className="db-btn db-btn-ghost" href={secondaryHref}>Learn how it works</Link>
        <button type="button" className="db-btn db-btn-ghost" onClick={onSettings} aria-label="Open settings">Settings</button>
      </div>
    </section>
  );
}