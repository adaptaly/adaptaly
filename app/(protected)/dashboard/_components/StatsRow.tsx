// app/(protected)/dashboard/_components/StatsRow.tsx
import { formatInt, formatDelta } from "@/src/lib/number";

type Props = {
  streakDays: number;
  bestStreak: number;
  cardsReviewedToday: number;
  deltaCardsVsYesterday: number;
};

export default function StatsRow({ streakDays, bestStreak, cardsReviewedToday, deltaCardsVsYesterday }: Props) {
  return (
    <section className="db-tiles" aria-label="Today at a glance">
      <div className="db-tile">
        <div className="db-tile-label">Streak</div>
        <div className="db-tile-value">
          {formatInt(streakDays)}<span className="db-tile-suffix">d</span>
        </div>
        <div className="db-tile-sub">Best: {formatInt(bestStreak)}d</div>
      </div>

      <div className="db-tile">
        <div className="db-tile-label">Cards reviewed</div>
        <div className="db-tile-value">{formatInt(cardsReviewedToday)}</div>
        <div className="db-tile-sub">{formatDelta(deltaCardsVsYesterday)} vs yesterday</div>
      </div>
    </section>
  );
}