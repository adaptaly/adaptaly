// app/(protected)/dashboard/_components/StatsRow.tsx
type Props = {
  streakDays: number;
  bestStreak: number;
  cardsReviewedToday: number;
  deltaCardsVsYesterday: number;
};

export default function StatsRow({ streakDays, bestStreak, cardsReviewedToday, deltaCardsVsYesterday }: Props) {
  return (
    <div className="db-tiles">
      <div className="db-tile">
        <div className="db-tile-label">Streak</div>
        <div className="db-tile-value">
          {streakDays}
          <span className="db-tile-suffix">d</span>
        </div>
        <div className="db-tile-sub">Best: {bestStreak}d</div>
      </div>
      <div className="db-tile">
        <div className="db-tile-label">Cards reviewed</div>
        <div className="db-tile-value">{cardsReviewedToday}</div>
        <div className="db-tile-sub">
          {deltaCardsVsYesterday === 0 ? "±0" : deltaCardsVsYesterday > 0 ? `+${deltaCardsVsYesterday}` : deltaCardsVsYesterday} vs yesterday
        </div>
      </div>
    </div>
  );
}