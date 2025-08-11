// app/(protected)/dashboard/_components/FocusCard.tsx
import { formatPercent } from "@/src/lib/number";

type Props = {
  averageRecallPct: number | null;
  weakestTopic: string | null;
  strongestTopic: string | null;
};

export default function FocusCard({ averageRecallPct, weakestTopic, strongestTopic }: Props) {
  return (
    <section className="db-card">
      <div className="db-card-head">
        <h3 className="db-card-title">Focus</h3>
      </div>
      <div className="db-insights">
        <div className="db-chip">
          <span className="db-chip-dot" aria-hidden />
          <span className="db-chip-label">Avg recall</span>
          <span className="db-chip-value">{formatPercent(averageRecallPct)}</span>
        </div>
        <div className="db-chip">
          <span className="db-chip-dot" aria-hidden />
          <span className="db-chip-label">Weakest</span>
          <span className="db-chip-value">{weakestTopic ?? "Not enough data"}</span>
        </div>
        <div className="db-chip">
          <span className="db-chip-dot" aria-hidden />
          <span className="db-chip-label">Strongest</span>
          <span className="db-chip-value">{strongestTopic ?? "Not enough data"}</span>
        </div>
      </div>
    </section>
  );
}