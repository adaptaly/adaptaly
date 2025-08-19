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
  // Check if we're on the client side
  if (typeof window !== 'undefined') {
    // For client-side, return enhanced mock data that changes based on userId
    const seed = userId.length % 10;
    return {
      streak: 3 + seed,
      totalCardsReviewed: 30 + (seed * 5),
      accuracyRate: 0.65 + (seed * 0.03),
      averageConfidence: 3.0 + (seed * 0.1),
      timeStudied: 1200 + (seed * 300), // 20-50 minutes
      masteredCards: 8 + seed,
      strugglingCards: Math.max(0, 7 - seed),
      topicPerformance: [
        { topic: "Biology", accuracy: 0.70 + (seed * 0.03), cardCount: 10 + seed },
        { topic: "Chemistry", accuracy: 0.60 + (seed * 0.02), cardCount: 12 + seed },
        { topic: "Physics", accuracy: 0.75 + (seed * 0.02), cardCount: 8 + seed }
      ].slice(0, Math.max(1, 3 - Math.floor(seed / 3))),
      recentTrends: {
        accuracyTrend: (seed % 3) - 1, // -1, 0, or 1
        confidenceTrend: ((seed + 1) % 3) - 1,
        speedTrend: ((seed + 2) % 3) - 1
      }
    };
  }
  
  // Server-side fallback
  return {
    streak: 0,
    totalCardsReviewed: 0,
    accuracyRate: 0,
    averageConfidence: 0,
    timeStudied: 0,
    masteredCards: 0,
    strugglingCards: 0,
    topicPerformance: [],
    recentTrends: {
      accuracyTrend: 0,
      confidenceTrend: 0,
      speedTrend: 0
    }
  };
}