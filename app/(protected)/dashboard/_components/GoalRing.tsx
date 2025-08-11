// app/(protected)/dashboard/_components/GoalRing.tsx

type Props = {
  minutesToday: number;
  minutesGoal: number;
  deltaMinutes: number;
  onEditGoal?: () => void;
};

export default function GoalRing({ minutesToday, minutesGoal, deltaMinutes, onEditGoal }: Props) {
  const safeGoal = Math.max(1, minutesGoal || 1);
  const pct = Math.max(0, Math.min(100, Math.round((100 * minutesToday) / safeGoal)));
  const style = { ["--p" as any]: `${pct}%` } as React.CSSProperties;
  const label = `Daily goal progress ${pct} percent. ${minutesToday} minutes today out of ${minutesGoal} minutes.`;

  return (
    <div className="db-goal" role="group" aria-label="Daily goal">
      <div className="db-ring" role="img" aria-label={label}>
        <div className="db-ring-track" />
        <div className="db-ring-fill" style={style} />
        <div className="db-ring-center">
          <div className="db-ring-main" aria-live="polite">{minutesToday}m</div>
          <div className="db-ring-sub">/ {minutesGoal}m</div>
        </div>
      </div>
      <div>
        <div className="db-goal-title">
          Daily goal
          <button
            type="button"
            className="db-link"
            onClick={onEditGoal}
            aria-label="Edit daily minutes goal"
          >
            Edit goal
          </button>
        </div>
        <div className="db-goal-sub">
          {deltaMinutes >= 0 ? `+${deltaMinutes}` : deltaMinutes} vs yesterday
        </div>
      </div>
    </div>
  );
}