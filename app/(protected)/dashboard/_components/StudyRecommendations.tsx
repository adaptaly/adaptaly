"use client";

import { useRouter } from "next/navigation";
import { LearningAnalytics } from "@/app/lib/performance-tracker";

interface StudyRecommendationsProps {
  dueCount: number;
  analytics: LearningAnalytics | null;
  loading: boolean;
}

export default function StudyRecommendations({ 
  dueCount, 
  analytics, 
  loading 
}: StudyRecommendationsProps) {
  const router = useRouter();

  const getRecommendations = () => {
    if (!analytics) return [];

    const recommendations = [];

    // Due cards priority
    if (dueCount > 0) {
      const sessionSize = Math.min(20, Math.max(5, dueCount));
      recommendations.push({
        type: "due" as const,
        priority: "high" as const,
        title: `Review ${sessionSize} due cards`,
        description: `${dueCount} cards are ready for review`,
        action: "Start Review",
        color: "red"
      });
    }

    // Struggling cards
    if (analytics.strugglingCards > 0) {
      recommendations.push({
        type: "struggling" as const,
        priority: "high" as const,
        title: "Focus on difficult cards",
        description: `${analytics.strugglingCards} cards need extra attention`,
        action: "Practice",
        color: "orange"
      });
    }

    // Streak maintenance
    if (analytics.streak === 0) {
      recommendations.push({
        type: "streak" as const,
        priority: "medium" as const,
        title: "Start a new streak",
        description: "Review just 5 cards to begin your learning journey",
        action: "Quick Review",
        color: "blue"
      });
    } else if (analytics.streak >= 7) {
      recommendations.push({
        type: "streak" as const,
        priority: "low" as const,
        title: `Maintain your ${analytics.streak}-day streak`,
        description: "Keep the momentum going with a short session",
        action: "Continue Streak",
        color: "green"
      });
    }

    // Topic focus recommendations
    if (analytics.topicPerformance.length > 0) {
      const weakTopic = analytics.topicPerformance.find(t => t.accuracy < 0.7);
      if (weakTopic) {
        recommendations.push({
          type: "topic" as const,
          priority: "medium" as const,
          title: `Improve ${weakTopic.topic}`,
          description: `${Math.round(weakTopic.accuracy * 100)}% accuracy - needs practice`,
          action: "Study Topic",
          color: "purple"
        });
      }
    }

    // Time-based recommendations
    if (analytics.timeStudied < 300) { // Less than 5 minutes this week
      recommendations.push({
        type: "time" as const,
        priority: "medium" as const,
        title: "Build study habits",
        description: "Start with just 10 minutes daily",
        action: "Quick Session",
        color: "blue"
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }).slice(0, 3);
  };

  const recommendations = getRecommendations();

  if (loading) {
    return (
      <div className="recommendations-card">
        <div className="recommendations-header">
          <h3>Study Recommendations</h3>
        </div>
        <div className="recommendations-loading">
          <div className="loading-skeleton"></div>
          <div className="loading-skeleton short"></div>
          <div className="loading-skeleton"></div>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="recommendations-card">
        <div className="recommendations-header">
          <h3>Study Recommendations</h3>
        </div>
        <div className="recommendations-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="empty-icon">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p>All caught up! Great work on your studies.</p>
          <button 
            className="btn-secondary small"
            onClick={() => router.push("/upload")}
          >
            Add New Content
          </button>
        </div>
      </div>
    );
  }

  const handleRecommendationClick = (rec: typeof recommendations[0]) => {
    // Navigate based on recommendation type
    switch (rec.type) {
      case "due":
      case "struggling":
      case "topic":
        // Navigate to review page to select document
        router.push("/review");
        break;
      case "streak":
        router.push("/review");
        break;
      case "time":
        router.push("/review");
        break;
    }
  };

  return (
    <div className="recommendations-card">
      <div className="recommendations-header">
        <h3>Study Recommendations</h3>
        <span className="recommendations-count">{recommendations.length}</span>
      </div>

      <div className="recommendations-list">
        {recommendations.map((rec, index) => (
          <div 
            key={index} 
            className={`recommendation-item ${rec.priority}`}
            onClick={() => handleRecommendationClick(rec)}
          >
            <div className={`recommendation-indicator ${rec.color}`} />
            <div className="recommendation-content">
              <h4 className="recommendation-title">{rec.title}</h4>
              <p className="recommendation-description">{rec.description}</p>
            </div>
            <button className={`recommendation-action btn-${rec.color}`}>
              {rec.action}
            </button>
          </div>
        ))}
      </div>

      <div className="recommendations-footer">
        <button 
          className="btn-primary small"
          onClick={() => router.push("/upload")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14m-7-7h14"/>
          </svg>
          Add New Material
        </button>
      </div>
    </div>
  );
}