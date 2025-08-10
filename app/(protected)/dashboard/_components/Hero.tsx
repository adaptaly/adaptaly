// app/(protected)/dashboard/_components/Hero.tsx
import Link from "next/link";

type Props = {
  name: string | null;
  dueCount: number | null;
  hasDocs: boolean;
};

export default function Hero({ name, dueCount, hasDocs }: Props) {
  const title = name ? `Welcome, ${name}` : "Welcome";
  let ctaLabel = "Review now";
  if (typeof dueCount === "number") {
    ctaLabel = dueCount > 0 ? `Review ${dueCount} due` : "Start a quick review";
  }

  const ctaHref = "/review";
  const secondaryHref = hasDocs ? "/review" : "/?upload=1";

  return (
    <section className="db-hero">
      <h1 className="db-hero-title">{title}</h1>
      <p className="db-hero-sub">Your next best step is one click away.</p>
      <div className="db-hero-actions">
        <Link className="db-btn db-btn-primary" href={ctaHref} aria-label={ctaLabel}>
          {ctaLabel}
          <span className="db-btn-icon" aria-hidden>
            {/* arrow icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </Link>
        <Link className="db-btn db-btn-ghost" href={secondaryHref}>Learn how it works</Link>
      </div>
    </section>
  );
}