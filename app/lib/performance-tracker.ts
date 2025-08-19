// Performance tracking and analytics for learning progress

import { calculateNextReview } from "./adaptive-algorithm";

export interface PerformanceData {
  userId: string;
  documentId: string;
  flashcardId: string;
  correct: boolean;
  confidence: number;
  responseTime: number;
  topic?: string;
}

export interface SessionStats {
  totalCards: number;
  correctCards: number;
  averageConfidence: number;
  averageResponseTime: number;
  topicBreakdown: { [topic: string]: { correct: number; total: number } };
  weakAreas: string[];
  improvementAreas: string[];
}

export interface LearningAnalytics {
  streak: number;
  totalCardsReviewed: number;
  accuracyRate: number;
  averageConfidence: number;
  timeStudied: number;
  masteredCards: number;
  strugglingCards: number;
  topicPerformance: { topic: string; accuracy: number; cardCount: number }[];
  recentTrends: {
    accuracyTrend: number; // -1, 0, 1 for declining, stable, improving
    confidenceTrend: number;
    speedTrend: number;
  };
}

export async function trackPerformance(data: PerformanceData): Promise<void> {
  // This function should be called from server-side code with a supabase client
  console.log("Performance tracking:", data);
  return;
}

export function getSessionStats(reviews: Array<{
  correct: boolean;
  confidence: number;
  response_time: number;
  topic?: string;
}>): SessionStats {
  if (reviews.length === 0) {
    return {
      totalCards: 0,
      correctCards: 0,
      averageConfidence: 0,
      averageResponseTime: 0,
      topicBreakdown: {},
      weakAreas: [],
      improvementAreas: []
    };
  }

  const totalCards = reviews.length;
  const correctCards = reviews.filter(r => r.correct).length;
  const averageConfidence = reviews.reduce((sum, r) => sum + r.confidence, 0) / totalCards;
  const averageResponseTime = reviews.reduce((sum, r) => sum + r.response_time, 0) / totalCards;

  // Topic breakdown
  const topicBreakdown: { [topic: string]: { correct: number; total: number } } = {};
  reviews.forEach(review => {
    const topic = review.topic || "General";
    if (!topicBreakdown[topic]) {
      topicBreakdown[topic] = { correct: 0, total: 0 };
    }
    topicBreakdown[topic].total++;
    if (review.correct) {
      topicBreakdown[topic].correct++;
    }
  });

  // Identify weak areas (topics with < 70% accuracy or < 3 confidence)
  const weakAreas: string[] = [];
  const improvementAreas: string[] = [];

  Object.entries(topicBreakdown).forEach(([topic, stats]) => {
    const accuracy = stats.correct / stats.total;
    const topicReviews = reviews.filter(r => (r.topic || "General") === topic);
    const avgConfidence = topicReviews.reduce((sum, r) => sum + r.confidence, 0) / topicReviews.length;
    
    if (accuracy < 0.7 || avgConfidence < 3) {
      weakAreas.push(topic);
    } else if (accuracy >= 0.8 && avgConfidence >= 4) {
      improvementAreas.push(topic);
    }
  });

  return {
    totalCards,
    correctCards,
    averageConfidence,
    averageResponseTime,
    topicBreakdown,
    weakAreas,
    improvementAreas
  };
}

export async function getLearningAnalytics(userId: string): Promise<LearningAnalytics> {
  // Return mock data for now - should be called from server-side
  return {
    streak: 3,
    totalCardsReviewed: 45,
    accuracyRate: 0.78,
    averageConfidence: 3.4,
    timeStudied: 1800, // 30 minutes
    masteredCards: 12,
    strugglingCards: 5,
    topicPerformance: [
      { topic: "Biology", accuracy: 0.85, cardCount: 15 },
      { topic: "Chemistry", accuracy: 0.67, cardCount: 18 },
      { topic: "Physics", accuracy: 0.82, cardCount: 12 }
    ],
    recentTrends: {
      accuracyTrend: 1,
      confidenceTrend: 0,
      speedTrend: 1
    }
  };
}