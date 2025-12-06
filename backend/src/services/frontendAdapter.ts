import { FrontendCommunicationProfile, FrontendChemistryAnalysis, ExtendedProfile } from '../models/FrontendModels.js';
import { CommunicationProfile } from '../models/CommunicationProfile.js';
import { ChemistryPrediction } from '../models/ChemistryAnalysis.js';
import { logger } from '../utils/logger.js';

/**
 * Adapter to convert between frontend and backend models
 * Bridges the gap between social profiles and communication analysis
 */
export class FrontendAdapter {
  /**
   * Convert backend chemistry prediction to frontend format
   */
  static convertChemistryToFrontend(prediction: ChemistryPrediction): FrontendChemistryAnalysis {
    return {
      groupScore: prediction.group_score,
      insights: prediction.insights,
      warnings: prediction.warnings,
      pairwiseScores: prediction.pairwise_scores,
    };
  }

  /**
   * Calculate chemistry from frontend profiles using hybrid approach
   * Combines frontend social data with backend-style analysis
   */
  static calculateChemistryFromFrontendProfiles(
    profiles: FrontendCommunicationProfile[]
  ): FrontendChemistryAnalysis {
    if (profiles.length === 0) {
      return {
        groupScore: 0,
        insights: [],
        warnings: [],
        pairwiseScores: {},
      };
    }

    if (profiles.length === 1) {
      return {
        groupScore: 85,
        insights: ['Add more guests to see vibe predictions'],
        warnings: [],
        pairwiseScores: {},
      };
    }

    const insights: string[] = [];
    const warnings: string[] = [];
    const pairwiseScores: Record<string, number> = {};

    // Social-based analysis (from frontend profile data)
    const alreadyKnowCount = profiles.filter(p => p.alreadyKnow).length;
    if (alreadyKnowCount >= 2) {
      insights.push(`${alreadyKnowCount} people already connected`);
    }

    const firstDegree = profiles.filter(p => p.connectionDegree === 1).length;
    if (firstDegree > 0) {
      insights.push(`${firstDegree} direct connection${firstDegree > 1 ? 's' : ''}`);
    }

    const schools = new Set(profiles.map(p => p.school));
    if (schools.size === 1) {
      insights.push(`All from ${profiles[0].school}`);
    } else if (schools.size <= 3) {
      insights.push('Great school diversity');
    }

    const ages = profiles.map(p => p.age);
    const ageRange = Math.max(...ages) - Math.min(...ages);
    if (ageRange > 15) {
      warnings.push('Wide age range - may affect dynamics');
    } else if (ageRange <= 5) {
      insights.push('Similar age group');
    }

    const genderCounts = profiles.reduce((acc, p) => {
      acc[p.gender] = (acc[p.gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const genderValues = Object.values(genderCounts);
    if (genderValues.length > 1) {
      const maxGender = Math.max(...genderValues);
      const minGender = Math.min(...genderValues);
      if (maxGender / minGender <= 2) {
        insights.push('Balanced gender mix');
      }
    }

    // Calculate pairwise scores
    let totalPairwiseScore = 0;
    let pairCount = 0;

    profiles.forEach((profile1, i) => {
      profiles.forEach((profile2, j) => {
        if (i < j) {
          const score = this.calculatePairwiseScore(profile1, profile2);
          const key = `${profile1.userId}_${profile2.userId}`;
          pairwiseScores[key] = score;
          totalPairwiseScore += score;
          pairCount++;
        }
      });
    });

    // Calculate base score from pairwise
    let baseScore = pairCount > 0 ? totalPairwiseScore / pairCount : 70;

    // Apply bonuses
    const connectionBonus = firstDegree * 2;
    const knowBonus = alreadyKnowCount * 2;

    // Final calculation
    const groupScore = Math.min(98, Math.max(45, Math.round(baseScore + connectionBonus + knowBonus)));

    return {
      groupScore,
      insights: insights.slice(0, 4),
      warnings,
      pairwiseScores,
    };
  }

  /**
   * Calculate pairwise chemistry between two frontend profiles
   * Uses the frontend's algorithm enhanced with backend insights
   */
  private static calculatePairwiseScore(
    p1: FrontendCommunicationProfile,
    p2: FrontendCommunicationProfile
  ): number {
    let score = 60; // Base score

    // Same school
    if (p1.school === p2.school) {
      score += 15;
    }

    // Similar age (±5 years)
    const ageDiff = Math.abs(p1.age - p2.age);
    if (ageDiff <= 5) {
      score += 10;
    }

    // Same gender
    if (p1.gender === p2.gender) {
      score += 5;
    }

    // Already know each other
    if (p1.alreadyKnow && p2.alreadyKnow) {
      score += 10;
    }

    // Connection degree
    if (p1.connectionDegree === 1 || p2.connectionDegree === 1) {
      score += 8;
    } else if (p1.connectionDegree === 2 || p2.connectionDegree === 2) {
      score += 4;
    }

    // Same role/industry (simple check on role string)
    if (p1.role === p2.role || p1.company === p2.company) {
      score += 5;
    }

    // Add some consistency based on userId hash
    const hash1 = p1.userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const hash2 = p2.userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const variance = (hash1 + hash2) % 10;
    score += variance - 5; // ±5 points for consistency

    return Math.min(98, Math.max(45, Math.round(score)));
  }

  /**
   * Get individual chemistry score for a profile
   */
  static getIndividualChemistry(profile: FrontendCommunicationProfile): number {
    let score = 65; // Base score

    if (profile.connectionDegree === 1) score += 15;
    else if (profile.connectionDegree === 2) score += 8;

    if (profile.alreadyKnow) score += 10;

    const hash = profile.userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    score += hash % 10;

    return Math.min(99, Math.max(50, Math.round(score)));
  }

  /**
   * Optimize guest list (frontend-style)
   */
  static optimizeGuestList(
    profiles: FrontendCommunicationProfile[]
  ): { optimizedGuests: FrontendCommunicationProfile[]; removed: FrontendCommunicationProfile[] } {
    // Remove 3rd degree connections to improve chemistry
    const thirdDegree = profiles.filter(p => p.connectionDegree === 3 && !p.alreadyKnow);

    if (thirdDegree.length > 0 && profiles.length > 5) {
      const toRemove = thirdDegree.slice(0, 2);
      const removeIds = new Set(toRemove.map(p => p.userId));

      return {
        optimizedGuests: profiles.filter(p => !removeIds.has(p.userId)),
        removed: toRemove,
      };
    }

    return {
      optimizedGuests: profiles,
      removed: [],
    };
  }

  /**
   * Convert backend CommunicationProfile to ExtendedProfile
   */
  static extendProfileWithCommunicationData(
    frontendProfile: FrontendCommunicationProfile,
    backendProfile: CommunicationProfile | null
  ): ExtendedProfile {
    return {
      ...frontendProfile,
      communicationProfile: backendProfile
        ? {
            avg_response_time_seconds: backendProfile.avg_response_time_seconds,
            active_hours: backendProfile.active_hours,
            verbosity: backendProfile.verbosity,
            social_catalyst_score: backendProfile.social_catalyst_score,
            energy_level: backendProfile.energy_level,
          }
        : undefined,
    };
  }
}

