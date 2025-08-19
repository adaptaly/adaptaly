"use client";

import { LearningAnalytics as LearningAnalyticsType } from "@/app/lib/performance-tracker";

interface LearningAnalyticsProps {
  analytics: LearningAnalyticsType | null;
  loading: boolean;
}

export default function LearningAnalytics({ analytics, loading }: LearningAnalyticsProps) {
  if (loading) {
    return (
      <div className="analytics-card">
        <div className="analytics-header">
          <h3>Learning Analytics</h3>
        </div>
        <div className="analytics-loading">
          <div className="loading-skeleton"></div>
          <div className="loading-skeleton short"></div>
          <div className="loading-skeleton"></div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="analytics-card">
        <div className="analytics-header">
          <h3>Learning Analytics</h3>
        </div>
        <p className="analytics-empty">No data available yet. Start reviewing to see your progress!</p>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="trend-up">
          <path d="M7 14l5-5 5 5" />
        </svg>
      );
    } else if (trend < 0) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="trend-down">
          <path d="M17 10l-5 5-5-5" />
        </svg>
      );
    }
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="trend-stable">
        <path d="M5 12h14" />
      </svg>
    );
  };

  return (
    <div className="analytics-card">
      <div className="analytics-header">
        <h3>Learning Analytics</h3>
        <div className="analytics-period">Last 7 days</div>
      </div>

      <div className="analytics-content">
        <div className="metric-row">
          <div className="metric">
            <span className="metric-value">{analytics.streak}</span>
            <span className="metric-label">Day Streak</span>
          </div>
          <div className="metric">
            <span className="metric-value">{Math.round(analytics.accuracyRate * 100)}%</span>
            <span className="metric-label">Accuracy</span>
            {getTrendIcon(analytics.recentTrends.accuracyTrend)}
          </div>
        </div>

        <div className="metric-row">
          <div className="metric">
            <span className="metric-value">{formatTime(analytics.timeStudied)}</span>
            <span className="metric-label">Study Time</span>
          </div>
          <div className="metric">
            <span className="metric-value">{analytics.masteredCards}</span>
            <span className="metric-label">Mastered</span>
          </div>
        </div>

        <div className="confidence-section">
          <div className="confidence-header">
            <span className="confidence-label">Confidence</span>
            <span className="confidence-value">{analytics.averageConfidence.toFixed(1)}/5</span>
            {getTrendIcon(analytics.recentTrends.confidenceTrend)}
          </div>
          <div className="confidence-bar">
            <div 
              className="confidence-fill" 
              style={{ width: `${(analytics.averageConfidence / 5) * 100}%` }}
            />
          </div>
        </div>

        {analytics.strugglingCards > 0 && (
          <div className="struggling-alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>{analytics.strugglingCards} cards need attention</span>
          </div>
        )}

        {analytics.topicPerformance.length > 0 && (
          <div className="topic-performance">
            <h4 className="topic-header">Topic Performance</h4>
            <div className="topic-list">
              {analytics.topicPerformance.slice(0, 3).map((topic, index) => (
                <div key={topic.topic} className="topic-item">
                  <span className="topic-name">{topic.topic}</span>
                  <div className="topic-stats">
                    <span className="topic-accuracy">{Math.round(topic.accuracy * 100)}%</span>
                    <div className="topic-bar">
                      <div 
                        className={`topic-fill ${topic.accuracy >= 0.8 ? 'good' : topic.accuracy >= 0.6 ? 'fair' : 'poor'}`}
                        style={{ width: `${topic.accuracy * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}