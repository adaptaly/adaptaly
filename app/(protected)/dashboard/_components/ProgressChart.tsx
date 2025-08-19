"use client";

import { LearningAnalytics } from "@/app/lib/performance-tracker";

interface ProgressChartProps {
  analytics: LearningAnalytics | null;
  loading: boolean;
}

export default function ProgressChart({ analytics, loading }: ProgressChartProps) {
  if (loading) {
    return (
      <div className="progress-chart-card">
        <div className="chart-header">
          <h3>Progress Overview</h3>
        </div>
        <div className="chart-loading">
          <div className="loading-skeleton chart-skeleton"></div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="progress-chart-card">
        <div className="chart-header">
          <h3>Progress Overview</h3>
        </div>
        <div className="chart-empty">
          <p>Start reviewing to see your progress chart!</p>
        </div>
      </div>
    );
  }

  // Generate mock weekly data for visualization
  const generateWeeklyData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const baseAccuracy = analytics.accuracyRate;
    
    return days.map((day, index) => {
      // Simulate some variation around the actual accuracy
      const variation = (Math.random() - 0.5) * 0.2;
      const accuracy = Math.max(0, Math.min(1, baseAccuracy + variation));
      const cardsReviewed = Math.floor(Math.random() * 20) + 5;
      
      return {
        day,
        accuracy: Math.round(accuracy * 100),
        cardsReviewed,
        isToday: index === 6 // Assume Sunday is today
      };
    });
  };

  const weeklyData = generateWeeklyData();
  const maxCards = Math.max(...weeklyData.map(d => d.cardsReviewed));

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "#10b981"; // Green for 30+ days
    if (streak >= 7) return "#3b82f6";  // Blue for 7+ days  
    if (streak >= 3) return "#f59e0b";  // Orange for 3+ days
    return "#6b7280"; // Gray for < 3 days
  };

  return (
    <div className="progress-chart-card">
      <div className="chart-header">
        <h3>Progress Overview</h3>
        <div className="chart-period">This Week</div>
      </div>

      <div className="chart-content">
        {/* Streak Visualization */}
        <div className="streak-section">
          <div className="streak-display">
            <div 
              className="streak-ring"
              style={{ 
                background: `conic-gradient(${getStreakColor(analytics.streak)} ${Math.min(analytics.streak / 30, 1) * 360}deg, #e5e7eb 0deg)` 
              }}
            >
              <div className="streak-inner">
                <span className="streak-number">{analytics.streak}</span>
                <span className="streak-label">days</span>
              </div>
            </div>
            <div className="streak-info">
              <h4>Current Streak</h4>
              <p className="streak-description">
                {analytics.streak === 0 ? "Start your streak today!" :
                 analytics.streak < 7 ? "Building momentum..." :
                 analytics.streak < 30 ? "Great consistency!" :
                 "Amazing dedication!"}
              </p>
            </div>
          </div>
        </div>

        {/* Weekly Activity Chart */}
        <div className="activity-chart">
          <h4>Weekly Activity</h4>
          <div className="chart-bars">
            {weeklyData.map((data, index) => (
              <div key={data.day} className="chart-bar-container">
                <div 
                  className={`chart-bar ${data.isToday ? 'today' : ''}`}
                  style={{ 
                    height: `${(data.cardsReviewed / maxCards) * 60}px`,
                    backgroundColor: data.accuracy >= 80 ? '#10b981' : 
                                   data.accuracy >= 60 ? '#f59e0b' : '#ef4444'
                  }}
                  title={`${data.day}: ${data.cardsReviewed} cards, ${data.accuracy}% accuracy`}
                />
                <span className="chart-label">{data.day}</span>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-color good"></div>
              <span>80%+ accuracy</span>
            </div>
            <div className="legend-item">
              <div className="legend-color fair"></div>
              <span>60-79% accuracy</span>
            </div>
            <div className="legend-item">
              <div className="legend-color poor"></div>
              <span>Below 60%</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="stat-item">
            <span className="stat-label">Cards Reviewed</span>
            <span className="stat-value">{analytics.totalCardsReviewed}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Response Time</span>
            <span className="stat-value">
              {analytics.recentTrends.speedTrend > 0 ? "Faster" : 
               analytics.recentTrends.speedTrend < 0 ? "Slower" : "Stable"}
              {analytics.recentTrends.speedTrend > 0 && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="trend-icon good">
                  <path d="M7 14l5-5 5 5" />
                </svg>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}