// app/(protected)/dashboard/_components/FocusCard.tsx
type Props = {
  averageRecallPct: number | null;
  weakestTopic: string | null;
  strongestTopic: string | null;
};

export default function FocusCard({ averageRecallPct, weakestTopic, strongestTopic }: Props) {
  return (
    <section className="db-card">
      <h3 className="db-card-title" style={{ marginBottom: 10 }}>Focus</h3>
      <div className="db-insights">
        <div className="db-chip">
          <span className="db-chip-dot" />
          <span className="db-chip-label">Avg recall</span>
          <span className="db-chip-value">{averageRecallPct == null ? "—" : `${Math.round(averageRecallPct)}%`}</span>
        </div>
        <div className="db-chip">
          <span className="db-chip-dot" />
          <span className="db-chip-label">Weakest</span>
          <span className="db-chip-value">{weakestTopic ?? "Not enough data"}</span>
        </div>
        <div className="db-chip">
          <span className="db-chip-dot" />
          <span className="db-chip-label">Strongest</span>
          <span className="db-chip-value">{strongestTopic ?? "Not enough data"}</span>
        </div>
      </div>
    </section>
  );
}