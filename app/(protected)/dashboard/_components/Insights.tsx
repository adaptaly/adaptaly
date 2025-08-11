// app/(protected)/dashboard/_components/Insights.tsx
import { formatPercent } from "@/src/lib/number";
import MicroSparkline from "./MicroSparkline";

type Props = {
  averageRecallPct: number | null;
  weakestTopic: string | null;
  trend7?: number[]; // optional trend for sparkline
};

export default function Insights({ averageRecallPct, weakestTopic, trend7 }: Props) {
  const recall = formatPercent(averageRecallPct);
  const weak = weakestTopic ?? "Not enough data yet";

  return (
    <section className="db-insights" aria-label="Insights">
      <div className="db-chip" role="group" aria-label="Average recall">
        <span className="db-chip-dot" aria-hidden />
        <span className="db-chip-label">Avg recall</span>
        <span className="db-chip-value">{recall}</span>
        {trend7 && trend7.length > 1 ? (
          <span className="db-chip-spark">
            <MicroSparkline data={trend7} ariaLabel="Average recall trend" />
          </span>
        ) : null}
      </div>
      <div className="db-chip" role="group" aria-label="Weakest topic">
        <span className="db-chip-dot" aria-hidden />
        <span className="db-chip-label">Weakest topic</span>
        <span className="db-chip-value">{weak}</span>
      </div>
    </section>
  );
}