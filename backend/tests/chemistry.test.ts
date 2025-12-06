import { describe, it, expect, beforeEach } from 'vitest';
import { ChemistryPredictor } from '../src/services/chemistryPredictor.js';
import { CommunicationProfile } from '../src/models/CommunicationProfile.js';

describe('ChemistryPredictor', () => {
  let predictor: ChemistryPredictor;

  beforeEach(() => {
    predictor = new ChemistryPredictor();
  });

  const createMockProfile = (overrides: Partial<CommunicationProfile>): CommunicationProfile => ({
    user_id: 'user_1',
    avg_response_time_seconds: 600,
    median_response_time_seconds: 600,
    active_hours: [9, 10, 14, 15, 19, 20],
    message_frequency_per_day: 20,
    group_participation_rate: 0.7,
    conversation_initiator_score: 0.5,
    avg_messages_per_conversation: 8,
    verbosity: 'moderate',
    consistency_score: 0.7,
    betweenness_centrality: 0.5,
    clustering_coefficient: 0.6,
    degree: 10,
    social_catalyst_score: 5.0,
    energy_level: 'medium',
    last_updated: new Date(),
    total_messages_analyzed: 500,
    ...overrides,
  });

  it('should predict chemistry for a group', () => {
    const profiles = [
      createMockProfile({ user_id: 'user_1' }),
      createMockProfile({ user_id: 'user_2' }),
      createMockProfile({ user_id: 'user_3' }),
    ];

    const result = predictor.predictGroupChemistry(profiles);

    expect(result.group_score).toBeGreaterThanOrEqual(0);
    expect(result.group_score).toBeLessThanOrEqual(100);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(Array.isArray(result.insights)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it('should detect multiple conversation dominators', () => {
    const profiles = [
      createMockProfile({
        user_id: 'user_1',
        conversation_initiator_score: 0.9,
        verbosity: 'verbose',
      }),
      createMockProfile({
        user_id: 'user_2',
        conversation_initiator_score: 0.9,
        verbosity: 'verbose',
      }),
    ];

    const result = predictor.predictGroupChemistry(profiles);

    expect(result.warnings.some(w => w.includes('dominate conversations'))).toBe(true);
    expect(result.group_score).toBeLessThan(80);
  });

  it('should recognize social catalysts', () => {
    const profiles = [
      createMockProfile({
        user_id: 'user_1',
        social_catalyst_score: 9.0,
      }),
      createMockProfile({
        user_id: 'user_2',
        social_catalyst_score: 8.5,
      }),
      createMockProfile({
        user_id: 'user_3',
        social_catalyst_score: 3.0,
      }),
    ];

    const result = predictor.predictGroupChemistry(profiles);

    expect(result.insights.some(i => i.includes('social catalyst'))).toBe(true);
    expect(result.group_score).toBeGreaterThan(75);
  });

  it('should handle small groups', () => {
    const profiles = [
      createMockProfile({ user_id: 'user_1' }),
      createMockProfile({ user_id: 'user_2' }),
    ];

    const result = predictor.predictGroupChemistry(profiles);

    expect(result.group_score).toBeGreaterThanOrEqual(0);
    expect(result.group_score).toBeLessThanOrEqual(100);
  });

  it('should calculate pairwise scores', () => {
    const profiles = [
      createMockProfile({ user_id: 'user_1' }),
      createMockProfile({ user_id: 'user_2' }),
    ];

    const result = predictor.predictGroupChemistry(profiles);

    expect(Object.keys(result.pairwise_scores).length).toBe(1);
    expect(result.pairwise_scores['user_1_user_2']).toBeGreaterThanOrEqual(0);
    expect(result.pairwise_scores['user_1_user_2']).toBeLessThanOrEqual(100);
  });

  it('should handle empty group gracefully', () => {
    const result = predictor.predictGroupChemistry([]);

    expect(result.group_score).toBe(50);
    expect(result.confidence).toBeLessThan(0.5);
  });

  it('should detect low activity overlap', () => {
    const profiles = [
      createMockProfile({
        user_id: 'user_1',
        active_hours: [0, 1, 2, 3, 4, 5], // Night owl
      }),
      createMockProfile({
        user_id: 'user_2',
        active_hours: [6, 7, 8, 9, 10, 11], // Early bird
      }),
    ];

    const result = predictor.predictGroupChemistry(profiles);

    // Should have low overlap, might generate warning
    expect(result.group_score).toBeLessThan(85);
  });

  it('should prefer style diversity', () => {
    const profiles = [
      createMockProfile({
        user_id: 'user_1',
        verbosity: 'verbose',
      }),
      createMockProfile({
        user_id: 'user_2',
        verbosity: 'concise',
      }),
    ];

    const result = predictor.predictGroupChemistry(profiles);

    // Verbose + concise = good balance
    expect(result.group_score).toBeGreaterThan(70);
  });
});

