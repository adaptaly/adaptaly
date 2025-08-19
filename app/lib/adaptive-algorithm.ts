// Adaptive card selection algorithm based on spaced repetition and performance tracking

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  hint?: string;
  order_index: number;
  topic?: string;
}

interface CardProgress {
  flashcard_id: string;
  mastered: boolean;
  due_at: string;
  ease_factor: number;
  interval_days: number;
}

interface Review {
  card_id: string;
  correct: boolean;
  confidence: number;
  response_time: number;
  created_at: string;
}

interface CardScore {
  flashcard: Flashcard;
  priority: number;
  reason: string;
}

export function adaptiveCardSelection(
  flashcards: Flashcard[],
  cardProgress: CardProgress[],
  recentReviews: Review[]
): Flashcard[] {
  const now = new Date();
  const progressMap = new Map(cardProgress.map(p => [p.flashcard_id, p]));
  const reviewMap = new Map<string, Review[]>();
  
  // Group reviews by card
  recentReviews.forEach(review => {
    const cardReviews = reviewMap.get(review.card_id) || [];
    cardReviews.push(review);
    reviewMap.set(review.card_id, cardReviews);
  });

  // Score each flashcard for selection priority
  const scoredCards: CardScore[] = flashcards.map(flashcard => {
    const progress = progressMap.get(flashcard.id);
    const reviews = reviewMap.get(flashcard.id) || [];
    
    let priority = 100; // Base priority
    let reason = "New card";

    if (progress) {
      const dueDate = new Date(progress.due_at);
      const daysDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (progress.mastered) {
        // Lower priority for mastered cards unless overdue
        priority = daysDue > 0 ? 80 + Math.min(daysDue * 10, 50) : 20;
        reason = daysDue > 0 ? `Mastered but ${daysDue} days overdue` : "Mastered";
      } else if (daysDue > 0) {
        // High priority for due cards
        priority = 150 + Math.min(daysDue * 20, 100);
        reason = `Due ${daysDue} days ago`;
      } else {
        // Medium priority for not-yet-due cards
        priority = 60 - Math.min(Math.abs(daysDue) * 5, 40);
        reason = `Due in ${Math.abs(daysDue)} days`;
      }
      
      // Adjust based on ease factor (lower ease = higher priority)
      const easeAdjustment = (2.5 - progress.ease_factor) * 20;
      priority += easeAdjustment;
    }

    // Adjust based on recent performance
    if (reviews.length > 0) {
      const recentReview = reviews[0]; // Most recent
      const avgConfidence = reviews.reduce((sum, r) => sum + r.confidence, 0) / reviews.length;
      const successRate = reviews.filter(r => r.correct).length / reviews.length;
      
      // Boost priority for cards with low confidence or success rate
      if (avgConfidence < 3) {
        priority += 40;
        reason += ", low confidence";
      }
      
      if (successRate < 0.7) {
        priority += 30;
        reason += ", struggling";
      }
      
      // Lower priority for recently reviewed cards with high performance
      const hoursSinceReview = (now.getTime() - new Date(recentReview.created_at).getTime()) / (1000 * 60 * 60);
      if (hoursSinceReview < 4 && successRate > 0.8 && avgConfidence >= 4) {
        priority -= 50;
        reason = "Recently reviewed with high performance";
      }
    }

    // Topic-based adjustments
    if (flashcard.topic) {
      const topicReviews = recentReviews.filter(r => {
        const card = flashcards.find(f => f.id === r.card_id);
        return card?.topic === flashcard.topic;
      });
      
      if (topicReviews.length > 0) {
        const topicSuccessRate = topicReviews.filter(r => r.correct).length / topicReviews.length;
        if (topicSuccessRate < 0.6) {
          priority += 25;
          reason += ", weak topic";
        }
      }
    }

    return {
      flashcard,
      priority: Math.max(0, priority), // Ensure non-negative
      reason
    };
  });

  // Sort by priority (highest first) and return flashcards
  return scoredCards
    .sort((a, b) => b.priority - a.priority)
    .map(scored => scored.flashcard);
}

export function calculateNextReview(
  correct: boolean,
  confidence: number,
  currentEaseFactor: number = 2.5,
  currentInterval: number = 1
): { easeFactor: number; intervalDays: number; dueAt: Date } {
  let easeFactor = currentEaseFactor;
  let intervalDays = currentInterval;

  if (correct) {
    // Successful review - increase interval
    if (currentInterval === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(currentInterval * easeFactor);
    }
    
    // Adjust ease factor based on confidence
    const easeAdjustment = (confidence - 3) * 0.1;
    easeFactor = Math.max(1.3, Math.min(2.5, easeFactor + easeAdjustment));
  } else {
    // Failed review - reset to beginning
    intervalDays = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  }

  // Calculate due date
  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + intervalDays);

  return {
    easeFactor: Math.round(easeFactor * 100) / 100, // Round to 2 decimal places
    intervalDays,
    dueAt
  };
}

export function getStudyRecommendations(
  flashcards: Flashcard[],
  cardProgress: CardProgress[],
  recentReviews: Review[]
): {
  dueCount: number;
  newCount: number;
  strugglingCount: number;
  recommendedSessionSize: number;
  focusTopics: string[];
} {
  const now = new Date();
  const progressMap = new Map(cardProgress.map(p => [p.flashcard_id, p]));
  const reviewMap = new Map<string, Review[]>();
  
  // Group reviews by card
  recentReviews.forEach(review => {
    const cardReviews = reviewMap.get(review.card_id) || [];
    cardReviews.push(review);
    reviewMap.set(review.card_id, cardReviews);
  });

  let dueCount = 0;
  let newCount = 0;
  let strugglingCount = 0;
  const topicPerformance = new Map<string, { correct: number; total: number }>();

  flashcards.forEach(flashcard => {
    const progress = progressMap.get(flashcard.id);
    const reviews = reviewMap.get(flashcard.id) || [];
    
    if (!progress) {
      newCount++;
    } else {
      const dueDate = new Date(progress.due_at);
      if (dueDate <= now && !progress.mastered) {
        dueCount++;
      }
    }
    
    // Check if struggling (recent reviews with low success rate)
    if (reviews.length >= 3) {
      const recentThree = reviews.slice(0, 3);
      const successRate = recentThree.filter(r => r.correct).length / recentThree.length;
      if (successRate < 0.7) {
        strugglingCount++;
      }
    }
    
    // Track topic performance
    if (flashcard.topic && reviews.length > 0) {
      const stats = topicPerformance.get(flashcard.topic) || { correct: 0, total: 0 };
      reviews.forEach(review => {
        stats.total++;
        if (review.correct) stats.correct++;
      });
      topicPerformance.set(flashcard.topic, stats);
    }
  });

  // Identify focus topics (lowest success rates)
  const focusTopics = Array.from(topicPerformance.entries())
    .filter(([_, stats]) => stats.total >= 3) // Minimum reviews for meaningful data
    .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))
    .slice(0, 3)
    .map(([topic]) => topic);

  // Recommend session size based on due cards and user capacity
  let recommendedSessionSize = Math.min(20, Math.max(5, dueCount + Math.min(newCount, 5)));
  
  // Adjust for struggling cards (focus on fewer cards for better retention)
  if (strugglingCount > 10) {
    recommendedSessionSize = Math.min(15, recommendedSessionSize);
  }

  return {
    dueCount,
    newCount,
    strugglingCount,
    recommendedSessionSize,
    focusTopics
  };
}