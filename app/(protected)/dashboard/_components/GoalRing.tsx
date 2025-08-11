// app/(protected)/dashboard/_components/GoalRing.tsx

type Props = {
    minutesToday: number;
    minutesGoal: number;
    deltaMinutes: number;
  };
  
  export default function GoalRing({ minutesToday, minutesGoal, deltaMinutes }: Props) {
    // Clamp to 0–100
    const pct = Math.max(0, Math.min(100, Math.round((100 * minutesToday) / Math.max(1, minutesGoal))));
  
    // CSS custom property for the conic fill
    const fillStyle = { ['--p' as any]: `${pct}%` } as React.CSSProperties;
  
    return (
      <div className="db-goal">
        <div className="db-ring" aria-label={`Goal progress ${pct}%`} role="img">
          <div className="db-ring-track" />
          <div className="db-ring-fill" style={fillStyle} />
          <div className="db-ring-center">
            <div className="db-ring-main">{minutesToday}</div>
            <div className="db-ring-sub">/ {minutesGoal}m</div>
          </div>
        </div>
        <div className="db-goal-text">
          <div className="db-goal-title">Daily goal</div>
          <div className="db-goal-sub">
            {deltaMinutes >= 0 ? `+${deltaMinutes}` : deltaMinutes} vs yesterday
          </div>
        </div>
      </div>
    );
  }  