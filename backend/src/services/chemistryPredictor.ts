import { CommunicationProfile } from '../models/CommunicationProfile.js';
import { ChemistryPrediction } from '../models/ChemistryAnalysis.js';
import { Calculations } from '../utils/calculations.js';
import { logger } from '../utils/logger.js';

/**
 * Chemistry Prediction Engine - THE SECRET SAUCE
 * Predicts group dynamics and compatibility for events
 */
export class ChemistryPredictor {
  /**
   * Predict chemistry for a group of users
   */
  predictGroupChemistry(profiles: CommunicationProfile[]): ChemistryPrediction {
    const startTime = Date.now();
    logger.info(`Predicting chemistry for group of ${profiles.length} users`);

    if (profiles.length < 2) {
      return {
        group_score: 50,
        confidence: 0.3,
        insights: ['Group too small for reliable prediction'],
        warnings: [],
        pairwise_scores: {},
        recommended_additions: [],
        recommended_removals: [],
      };
    }

    // STEP 1: Pairwise compatibility
    const pairwiseScores = this.calculateAllPairwiseScores(profiles);

    // STEP 2: Group-level checks
    const catalystCount = profiles.filter(p => p.social_catalyst_score > 7).length;
    const dominatorCount = profiles.filter(
      p => p.conversation_initiator_score > 0.7 && p.verbosity === 'verbose'
    ).length;

    // STEP 3: Energy balance
    const energyDistribution = this.analyzeEnergyBalance(profiles);

    // STEP 4: Activity overlap
    const activityOverlap = this.calculateActivityOverlap(profiles);

    // STEP 5: Communication style diversity
    const styleDiversity = this.calculateStyleDiversity(profiles);

    // STEP 6: Calculate base score
    let baseScore = 70; // neutral baseline

    // Catalysts improve group dynamics
    baseScore += Math.min(catalystCount * 5, 15); // +5 per catalyst, max +15

    // Multiple dominators create conflict
    if (dominatorCount >= 2) {
      baseScore -= 15; // -15 if 2+ dominators
    } else if (dominatorCount === 1) {
      baseScore += 5; // One dominator is good (provides leadership)
    }

    // Energy balance contributes
    baseScore += energyDistribution.balance_score * 10; // +0 to +10

    // Activity overlap helps coordination
    baseScore += activityOverlap * 10; // +0 to +10

    // Style diversity prevents echo chambers
    baseScore += styleDiversity * 5; // +0 to +5

    // STEP 7: Apply pairwise modifiers
    const avgPairwiseScore =
      Object.values(pairwiseScores).reduce((a, b) => a + b, 0) / Object.keys(pairwiseScores).length;
    baseScore = baseScore * 0.7 + avgPairwiseScore * 0.3;

    // STEP 8: Clamp to 0-100
    baseScore = Math.min(100, Math.max(0, baseScore));

    // STEP 9: Generate insights
    const insights = this.generateInsights(
      profiles,
      catalystCount,
      energyDistribution,
      activityOverlap,
      styleDiversity
    );

    // STEP 10: Generate warnings
    const warnings = this.generateWarnings(
      profiles,
      dominatorCount,
      activityOverlap,
      pairwiseScores
    );

    // STEP 11: Recommendations
    const { additions, removals } = this.generateRecommendations(profiles, pairwiseScores, baseScore);

    // STEP 12: Calculate confidence
    const confidence = this.calculateConfidence(profiles);

    const duration = Date.now() - startTime;
    logger.info(`Chemistry prediction complete: score=${baseScore.toFixed(1)}, confidence=${confidence.toFixed(2)}, duration=${duration}ms`);

    return {
      group_score: Math.round(baseScore),
      confidence,
      insights,
      warnings,
      pairwise_scores: pairwiseScores,
      recommended_additions: additions,
      recommended_removals: removals,
    };
  }

  /**
   * Calculate pairwise chemistry for all pairs
   */
  private calculateAllPairwiseScores(
    profiles: CommunicationProfile[]
  ): Record<string, number> {
    const scores: Record<string, number> = {};

    for (let i = 0; i < profiles.length; i++) {
      for (let j = i + 1; j < profiles.length; j++) {
        const p1 = profiles[i];
        const p2 = profiles[j];
        const pairKey = `${p1.user_id}_${p2.user_id}`;
        scores[pairKey] = this.calculatePairwiseChemistry(p1, p2);
      }
    }

    return scores;
  }

  /**
   * Calculate chemistry between two profiles
   */
  private calculatePairwiseChemistry(
    p1: CommunicationProfile,
    p2: CommunicationProfile
  ): number {
    // Response time compatibility (prefer similar speeds)
    const responseTimeSimilarity = this.calculateResponseTimeCompatibility(
      p1.avg_response_time_seconds,
      p2.avg_response_time_seconds
    );

    // Activity overlap (when are they both active?)
    const activityOverlap = Calculations.arrayOverlap(p1.active_hours, p2.active_hours);

    // Communication style balance
    const styleBalance = this.evaluateStyleCompatibility(p1.verbosity, p2.verbosity);

    // Consistency compatibility (both consistent or both flexible is good)
    const consistencyCompatibility = 1 - Math.abs(p1.consistency_score - p2.consistency_score);

    // Avoid two high initiators (conflict risk)
    const initiatorPenalty =
      p1.conversation_initiator_score > 0.7 && p2.conversation_initiator_score > 0.7 ? 0.8 : 1.0;

    // Energy level compatibility
    const energyCompatibility = this.evaluateEnergyCompatibility(p1.energy_level, p2.energy_level);

    // Weighted average
    const score =
      (responseTimeSimilarity * 0.25 +
        activityOverlap * 0.25 +
        styleBalance * 0.2 +
        consistencyCompatibility * 0.15 +
        energyCompatibility * 0.15) *
      initiatorPenalty *
      100;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate response time compatibility
   */
  private calculateResponseTimeCompatibility(rt1: number, rt2: number): number {
    const maxResponseTime = 3600; // 1 hour
    const diff = Math.abs(rt1 - rt2);
    const similarity = 1 - Math.min(1, diff / maxResponseTime);
    return similarity;
  }

  /**
   * Evaluate communication style compatibility
   */
  private evaluateStyleCompatibility(
    style1: 'concise' | 'moderate' | 'verbose',
    style2: 'concise' | 'moderate' | 'verbose'
  ): number {
    // Compatibility matrix
    const compatibilityMatrix: Record<string, number> = {
      'verbose_concise': 0.9, // Good balance
      'verbose_moderate': 0.8,
      'verbose_verbose': 0.6, // Might be overwhelming
      'moderate_concise': 0.8,
      'moderate_moderate': 0.85, // Very compatible
      'concise_concise': 0.7, // Might be too brief
    };

    const key = [style1, style2].sort().join('_');
    return compatibilityMatrix[key] || 0.7;
  }

  /**
   * Evaluate energy level compatibility
   */
  private evaluateEnergyCompatibility(
    energy1: 'low' | 'medium' | 'high',
    energy2: 'low' | 'medium' | 'high'
  ): number {
    if (energy1 === energy2) return 0.9; // Same energy = good
    if (
      (energy1 === 'low' && energy2 === 'high') ||
      (energy1 === 'high' && energy2 === 'low')
    ) {
      return 0.6; // Very different = potential friction
    }
    return 0.8; // Medium with high/low = okay balance
  }

  /**
   * Analyze energy balance across group
   */
  private analyzeEnergyBalance(profiles: CommunicationProfile[]): {
    is_balanced: boolean;
    balance_score: number;
  } {
    const energyCounts = {
      low: 0,
      medium: 0,
      high: 0,
    };

    for (const profile of profiles) {
      energyCounts[profile.energy_level]++;
    }

    const total = profiles.length;
    const lowRatio = energyCounts.low / total;
    const mediumRatio = energyCounts.medium / total;
    const highRatio = energyCounts.high / total;

    // Balanced = no single energy level dominates (>60%)
    const isBalanced = lowRatio < 0.6 && mediumRatio < 0.6 && highRatio < 0.6;

    // Balance score: higher if more evenly distributed
    const maxRatio = Math.max(lowRatio, mediumRatio, highRatio);
    const balanceScore = 1 - maxRatio; // Lower max ratio = more balanced

    return {
      is_balanced: isBalanced,
      balance_score: balanceScore,
    };
  }

  /**
   * Calculate activity time overlap across all pairs
   */
  private calculateActivityOverlap(profiles: CommunicationProfile[]): number {
    if (profiles.length < 2) return 0;

    const overlaps: number[] = [];
    for (let i = 0; i < profiles.length; i++) {
      for (let j = i + 1; j < profiles.length; j++) {
        const overlap = Calculations.arrayOverlap(
          profiles[i].active_hours,
          profiles[j].active_hours
        );
        overlaps.push(overlap);
      }
    }

    return overlaps.reduce((a, b) => a + b, 0) / overlaps.length;
  }

  /**
   * Calculate communication style diversity
   */
  private calculateStyleDiversity(profiles: CommunicationProfile[]): number {
    const styles = profiles.map(p => p.verbosity);
    const uniqueStyles = new Set(styles).size;
    return uniqueStyles / 3; // 0-1 scale (max 3 styles)
  }

  /**
   * Generate insights
   */
  private generateInsights(
    profiles: CommunicationProfile[],
    catalystCount: number,
    energyDistribution: { is_balanced: boolean; balance_score: number },
    activityOverlap: number,
    styleDiversity: number
  ): string[] {
    const insights: string[] = [];

    if (catalystCount > 0) {
      insights.push(
        `${catalystCount} social catalyst${catalystCount > 1 ? 's' : ''} present - great for group engagement`
      );
    }

    if (energyDistribution.is_balanced) {
      insights.push('Balanced energy distribution - diverse activity levels');
    }

    if (activityOverlap > 0.6) {
      insights.push('High activity time overlap - easy scheduling');
    }

    if (styleDiversity > 0.6) {
      insights.push('Diverse communication styles - prevents echo chambers');
    }

    if (profiles.some(p => p.betweenness_centrality > 0.7)) {
      insights.push('Strong network connectors present - good for cross-pollination');
    }

    return insights.length > 0 ? insights : ['Standard group composition'];
  }

  /**
   * Generate warnings
   */
  private generateWarnings(
    profiles: CommunicationProfile[],
    dominatorCount: number,
    activityOverlap: number,
    pairwiseScores: Record<string, number>
  ): string[] {
    const warnings: string[] = [];

    if (dominatorCount >= 2) {
      const dominators = profiles.filter(
        p => p.conversation_initiator_score > 0.7 && p.verbosity === 'verbose'
      );
      warnings.push(
        `Multiple conversation dominators (${dominators.map(d => d.user_id).join(', ')}) - potential for conflict`
      );
    }

    if (activityOverlap < 0.3) {
      warnings.push('Low activity time overlap - scheduling may be difficult');
    }

    // Check for low pairwise scores
    const lowPairs = Object.entries(pairwiseScores).filter(([_, score]) => score < 60);
    if (lowPairs.length > 0 && lowPairs.length > Object.keys(pairwiseScores).length * 0.3) {
      warnings.push('Multiple low compatibility pairs detected - some friction expected');
    }

    if (profiles.length < 3) {
      warnings.push('Small group size - may benefit from additional members');
    }

    return warnings;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    profiles: CommunicationProfile[],
    pairwiseScores: Record<string, number>,
    currentScore: number
  ): { additions: string[]; removals: string[] } {
    const removals: string[] = [];

    // Find users with consistently low pairwise scores
    for (const profile of profiles) {
      const scoresInvolvingUser = Object.entries(pairwiseScores)
        .filter(([key]) => key.includes(profile.user_id))
        .map(([_, score]) => score);

      if (scoresInvolvingUser.length > 0) {
        const avgScore =
          scoresInvolvingUser.reduce((a, b) => a + b, 0) / scoresInvolvingUser.length;
        if (avgScore < 60) {
          removals.push(profile.user_id);
        }
      }
    }

    // Additions would require checking against candidate pool
    // For demo, return empty array
    const additions: string[] = [];

    return { additions, removals };
  }

  /**
   * Calculate prediction confidence
   */
  private calculateConfidence(profiles: CommunicationProfile[]): number {
    if (profiles.length < 2) return 0.3;

    // Confidence based on:
    // 1. Number of profiles (more = more confident)
    // 2. Average messages analyzed (more data = more confident)
    // 3. Profile recency

    const avgMessagesAnalyzed =
      profiles.reduce((sum, p) => sum + p.total_messages_analyzed, 0) / profiles.length;

    const sizeConfidence = Math.min(1, profiles.length / 5); // Max confidence at 5+ people
    const dataConfidence = Math.min(1, avgMessagesAnalyzed / 500); // Max confidence at 500+ messages

    // Check profile recency
    const now = Date.now();
    const avgAge = profiles.reduce(
      (sum, p) => sum + (now - p.last_updated.getTime()),
      0
    ) / profiles.length;
    const recencyConfidence = Math.max(0, 1 - avgAge / (7 * 24 * 60 * 60 * 1000)); // Decay over 7 days

    // Weighted average
    return sizeConfidence * 0.3 + dataConfidence * 0.5 + recencyConfidence * 0.2;
  }
}

