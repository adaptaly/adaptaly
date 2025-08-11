// app/(protected)/dashboard/_components/StreakStripe.tsx
type Props = { streakDays: number };

/**
 * 7 cells. Rightmost is today.
 * If streakDays >= k, the k rightmost cells are filled.
 */
export default function StreakStrip({ streakDays }: Props) {
  const len = 7;
  const n = Math.max(0, Math.min(len, streakDays));
  const cells = Array.from({ length: len }, (_, i) => i >= len - n);

  return (
    <div className="db-heat" aria-label="Last 7 days activity">
      {cells.map((on, i) => (
        <span key={i} className={`db-heat-cell ${on ? "on" : ""}`} />
      ))}
    </div>
  );
}