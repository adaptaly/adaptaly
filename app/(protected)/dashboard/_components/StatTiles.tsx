// app/(protected)/dashboard/_components/StatTiles.tsx
import { formatInt } from "@/src/lib/number";

type Props = {
  minutesToday: number;
  cardsReviewedToday: number;
  streakDays: number;
};

export default function StatTiles({ minutesToday, cardsReviewedToday, streakDays }: Props) {
  return (
    <section className="db-tiles" aria-label="Today at a glance">
      <div className="db-tile">
        <div className="db-tile-label">Streak</div>
        <div className="db-tile-value">{formatInt(streakDays)}<span className="db-tile-suffix">d</span></div>
        <div className="db-tile-sub">Consecutive days with study</div>
      </div>
      <div className="db-tile">
        <div className="db-tile-label">Minutes today</div>
        <div className="db-tile-value">{formatInt(minutesToday)}</div>
        <div className="db-tile-sub">From sessions recorded</div>
      </div>
      <div className="db-tile">
        <div className="db-tile-label">Cards reviewed</div>
        <div className="db-tile-value">{formatInt(cardsReviewedToday)}</div>
        <div className="db-tile-sub">Since midnight</div>
      </div>
    </section>
  );
}