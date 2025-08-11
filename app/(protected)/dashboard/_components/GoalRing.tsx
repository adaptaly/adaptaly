// app/(protected)/dashboard/_components/GoalRing.tsx

type Props = {
  minutesToday: number;
  minutesGoal: number;
  deltaMinutes: number;
  onEditGoal?: () => void;
};

export default function GoalRing({ minutesToday, minutesGoal, deltaMinutes, onEditGoal }: Props) {
  // Clamp to 0–100
  const pct = Math.max(0, Math.min(100, Math.round((100 * minutesToday) / Math.max(1, minutesGoal))));
  // CSS var for conic fill
  const fillStyle = { ["--p" as any]: `${pct}%` } as React.CSSProperties;

  return (
    <div className="db-goal">
      <div className="db-ring" aria-label={`Goal progress ${pct}%`} role="img">
        <div className="db-ring-track" />
        <div className="db-ring-fill db-ring-animate" style={fillStyle} />
        <div className="db-ring-center">
          <div className="db-ring-main">{minutesToday}</div>
          <div className="db-ring-sub">/ {minutesGoal}m</div>
        </div>
      </div>
      <div className="db-goal-text">
        <div className="db-goal-title">
          Daily goal
          <button type="button" className="db-link" onClick={onEditGoal} aria-label="Edit daily goal">Edit goal</button>
        </div>
        <div className="db-goal-sub">
          {deltaMinutes >= 0 ? `+${deltaMinutes}` : deltaMinutes} vs yesterday
        </div>
      </div>
    </div>
  );
}