// app/(protected)/dashboard/_components/Hero.tsx
import Link from "next/link";

type DefaultAction = "due" | "quick" | "topic";

type Props = {
  name: string | null;
  dueCount: number;
  duePacksCount: number;
  hasDocs: boolean;
  defaultAction: DefaultAction;
  onSettings?: () => void;
};

function resolvePrimary(
  hasDocs: boolean,
  dueCount: number,
  action: DefaultAction
): { label: string; href: string } {
  if (action === "due") {
    if (dueCount > 0) return { label: `Review ${dueCount} due`, href: "/review" };
    if (hasDocs) return { label: "Quick review", href: "/review?quick=1" };
    return { label: "Upload file", href: "/?upload=1" };
  }
  if (action === "quick") {
    if (hasDocs) return { label: "Start quick session", href: "/review?quick=1" };
    return { label: "Upload file", href: "/?upload=1" };
  }
  // "topic"
  if (hasDocs) return { label: "Resume last pack", href: "/review?topic=1" };
  return { label: "Upload file", href: "/?upload=1" };
}

export default function Hero({
  name,
  dueCount,
  duePacksCount,
  hasDocs,
  defaultAction,
  onSettings,
}: Props) {
  const greeting = name ? `Welcome, ${name}` : "Welcome";
  const breakdown =
    dueCount > 0
      ? `${dueCount} due • ${duePacksCount} pack${duePacksCount === 1 ? "" : "s"}`
      : hasDocs
      ? "No cards due"
      : "No documents yet";

  const { label: primaryLabel, href: primaryHref } = resolvePrimary(hasDocs, dueCount, defaultAction);
  const secondaryHref = hasDocs ? "/review" : "/?upload=1";

  return (
    <section className="db-hero" aria-labelledby="db-hero-title">
      <div className="db-hero-inner">
        <div>
          <h1 id="db-hero-title" className="db-hero-title">{greeting}</h1>
          <p className="db-hero-sub" aria-live="polite">{breakdown}</p>
        </div>

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
      </div>
    </section>
  );
}