// app/(protected)/dashboard/_components/Insights.tsx
import { formatPercent } from "@/src/lib/number";

type Props = {
  averageRecallPct: number | null;
  weakestTopic: string | null;
};

export default function Insights({ averageRecallPct, weakestTopic }: Props) {
  const recall = formatPercent(averageRecallPct);
  const weak = weakestTopic ?? "Not enough data yet";

  return (
    <section className="db-insights" aria-label="Insights">
      <div className="db-chip" role="group" aria-label="Average recall">
        <span className="db-chip-dot" aria-hidden />
        <span className="db-chip-label">Avg recall</span>
        <span className="db-chip-value">{recall}</span>
      </div>
      <div className="db-chip" role="group" aria-label="Weakest topic">
        <span className="db-chip-dot" aria-hidden />
        <span className="db-chip-label">Weakest topic</span>
        <span className="db-chip-value">{weak}</span>
      </div>
    </section>
  );
}