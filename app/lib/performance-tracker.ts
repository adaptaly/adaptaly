// Performance tracking and analytics for learning progress

import { createServerClient } from "@/src/lib/supabaseServer";
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
  try {
    const supabase = await createServerClient();
    
    // Insert review record
    const { error: reviewError } = await supabase
      .from("reviews")
      .insert({
        user_id: data.userId,
        card_id: data.flashcardId,
        correct: data.correct,
        confidence: data.confidence,
        response_time: data.responseTime,
        created_at: new Date().toISOString()
      });

    if (reviewError) {
      console.error("Error inserting review:", reviewError);
      return;
    }

    // Update or create card progress
    const { data: existingCard } = await supabase
      .from("cards")
      .select("*")
      .eq("user_id", data.userId)
      .eq("flashcard_id", data.flashcardId)
      .single();

    const currentEaseFactor = existingCard?.ease_factor || 2.5;
    const currentInterval = existingCard?.interval_days || 1;
    
    const { easeFactor, intervalDays, dueAt } = calculateNextReview(
      data.correct,
      data.confidence,
      currentEaseFactor,
      currentInterval
    );

    const cardUpdate = {
      user_id: data.userId,
      document_id: data.documentId,
      flashcard_id: data.flashcardId,
      topic: data.topic,
      mastered: data.confidence >= 4 && data.correct && intervalDays >= 21, // Consider mastered after 3 weeks with high confidence
      due_at: dueAt.toISOString(),
      ease_factor: easeFactor,
      interval_days: intervalDays,
      last_reviewed: new Date().toISOString(),
      review_count: (existingCard?.review_count || 0) + 1
    };

    if (existingCard) {
      const { error: updateError } = await supabase
        .from("cards")
        .update(cardUpdate)
        .eq("id", existingCard.id);
      
      if (updateError) {
        console.error("Error updating card:", updateError);
      }
    } else {
      const { error: insertError } = await supabase
        .from("cards")
        .insert(cardUpdate);
      
      if (insertError) {
        console.error("Error inserting card:", insertError);
      }
    }

    // Update study session if within last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const { data: recentSession } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", data.userId)
      .eq("document_id", data.documentId)
      .gte("started_at", oneHourAgo.toISOString())
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (recentSession) {
      // Update existing session
      const newDuration = Math.floor((Date.now() - new Date(recentSession.started_at).getTime()) / 1000);
      const { error: sessionError } = await supabase
        .from("study_sessions")
        .update({
          duration_seconds: newDuration,
          cards_reviewed: (recentSession.cards_reviewed || 0) + 1,
          correct_answers: (recentSession.correct_answers || 0) + (data.correct ? 1 : 0)
        })
        .eq("id", recentSession.id);
      
      if (sessionError) {
        console.error("Error updating study session:", sessionError);
      }
    } else {
      // Create new session
      const { error: sessionError } = await supabase
        .from("study_sessions")
        .insert({
          user_id: data.userId,
          document_id: data.documentId,
          started_at: new Date().toISOString(),
          duration_seconds: data.responseTime / 1000,
          cards_reviewed: 1,
          correct_answers: data.correct ? 1 : 0
        });
      
      if (sessionError) {
        console.error("Error creating study session:", sessionError);
      }
    }

  } catch (error) {
    console.error("Error tracking performance:", error);
  }
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
  try {
    const supabase = await createServerClient();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Get recent reviews for trend analysis
    const { data: recentReviews } = await supabase
      .from("reviews")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", fourteenDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    const reviews = recentReviews || [];
    const lastWeekReviews = reviews.filter(r => new Date(r.created_at) >= sevenDaysAgo);
    const previousWeekReviews = reviews.filter(r => 
      new Date(r.created_at) >= fourteenDaysAgo && new Date(r.created_at) < sevenDaysAgo
    );

    // Calculate streak
    let streak = 0;
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    
    const reviewDays = new Set(reviews.map(r => r.created_at.slice(0, 10)));
    let currentDate = reviewDays.has(today) ? new Date() : new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    while (reviewDays.has(currentDate.toISOString().slice(0, 10))) {
      streak++;
      currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
    }

    // Get card statistics
    const { data: cards } = await supabase
      .from("cards")
      .select("*")
      .eq("user_id", userId);

    const cardStats = cards || [];
    const masteredCards = cardStats.filter(c => c.mastered).length;
    const strugglingCards = cardStats.filter(c => 
      !c.mastered && c.review_count >= 3 && new Date(c.due_at) <= now
    ).length;

    // Calculate overall metrics
    const totalCardsReviewed = reviews.length;
    const accuracyRate = reviews.length > 0 ? 
      reviews.filter(r => r.correct).length / reviews.length : 0;
    const averageConfidence = reviews.length > 0 ? 
      reviews.reduce((sum, r) => sum + r.confidence, 0) / reviews.length : 0;

    // Get study time
    const { data: sessions } = await supabase
      .from("study_sessions")
      .select("duration_seconds")
      .eq("user_id", userId)
      .gte("started_at", sevenDaysAgo.toISOString());

    const timeStudied = (sessions || []).reduce((sum, s) => sum + (s.duration_seconds || 0), 0);

    // Topic performance
    const topicStats = new Map<string, { correct: number; total: number }>();
    reviews.forEach(review => {
      const card = cardStats.find(c => c.flashcard_id === review.card_id);
      const topic = card?.topic || "General";
      const stats = topicStats.get(topic) || { correct: 0, total: 0 };
      stats.total++;
      if (review.correct) stats.correct++;
      topicStats.set(topic, stats);
    });

    const topicPerformance = Array.from(topicStats.entries())
      .map(([topic, stats]) => ({
        topic,
        accuracy: stats.correct / stats.total,
        cardCount: stats.total
      }))
      .sort((a, b) => b.cardCount - a.cardCount);

    // Calculate trends
    const lastWeekAccuracy = lastWeekReviews.length > 0 ? 
      lastWeekReviews.filter(r => r.correct).length / lastWeekReviews.length : 0;
    const prevWeekAccuracy = previousWeekReviews.length > 0 ? 
      previousWeekReviews.filter(r => r.correct).length / previousWeekReviews.length : 0;

    const lastWeekConfidence = lastWeekReviews.length > 0 ? 
      lastWeekReviews.reduce((sum, r) => sum + r.confidence, 0) / lastWeekReviews.length : 0;
    const prevWeekConfidence = previousWeekReviews.length > 0 ? 
      previousWeekReviews.reduce((sum, r) => sum + r.confidence, 0) / previousWeekReviews.length : 0;

    const lastWeekSpeed = lastWeekReviews.length > 0 ? 
      lastWeekReviews.reduce((sum, r) => sum + r.response_time, 0) / lastWeekReviews.length : 0;
    const prevWeekSpeed = previousWeekReviews.length > 0 ? 
      previousWeekReviews.reduce((sum, r) => sum + r.response_time, 0) / previousWeekReviews.length : 0;

    const accuracyTrend = Math.abs(lastWeekAccuracy - prevWeekAccuracy) < 0.05 ? 0 : 
      (lastWeekAccuracy > prevWeekAccuracy ? 1 : -1);
    const confidenceTrend = Math.abs(lastWeekConfidence - prevWeekConfidence) < 0.2 ? 0 : 
      (lastWeekConfidence > prevWeekConfidence ? 1 : -1);
    const speedTrend = Math.abs(lastWeekSpeed - prevWeekSpeed) < 1000 ? 0 : 
      (lastWeekSpeed < prevWeekSpeed ? 1 : -1); // Faster is better

    return {
      streak,
      totalCardsReviewed,
      accuracyRate,
      averageConfidence,
      timeStudied,
      masteredCards,
      strugglingCards,
      topicPerformance,
      recentTrends: {
        accuracyTrend,
        confidenceTrend,
        speedTrend
      }
    };

  } catch (error) {
    console.error("Error getting learning analytics:", error);
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
}