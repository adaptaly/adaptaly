// app/(protected)/dashboard/_components/StreakStrip.tsx
type Props = { streakDays: number };

export default function StreakStrip({ streakDays }: Props) {
  // Show last 7 days. If streak >= i, fill the most recent squares.
  const days = Array.from({ length: 7 }, (_, i) => i).map((i) => {
    const filled = streakDays > 0 && i < Math.min(7, streakDays);
    return filled;
  });

  return (
    <div className="db-heat" aria-label="Last 7 days">
      {days.map((on, i) => (
        <span key={i} className={`db-heat-cell ${on ? "on" : ""}`} />
      ))}
    </div>
  );
}