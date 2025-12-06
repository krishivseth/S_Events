import express, { Request, Response } from 'express';
import { ProfileBuilder } from '../services/profileBuilder.js';
import { ChemistryPredictor } from '../services/chemistryPredictor.js';
import { EventService } from '../services/eventService.js';
import { GraphAnalyzer } from '../services/graphAnalyzer.js';
import { FrontendAdapter } from '../services/frontendAdapter.js';
import { PrivacyGuard } from '../utils/privacy.js';
import { logger } from '../utils/logger.js';
import { FrontendCommunicationProfile, FrontendEvent, FrontendGuest } from '../models/FrontendModels.js';

/**
 * API Routes
 * REST API for frontend integration
 */
export function createRouter(
  profileBuilder: ProfileBuilder,
  chemistryPredictor: ChemistryPredictor,
  eventService: EventService,
  graphAnalyzer: GraphAnalyzer
) {
  const router = express.Router();

  /**
   * Get user's communication profile
   * GET /api/profile/:userId
   */
  router.get('/profile/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      logger.info(`GET /api/profile/${userId}`);

      const profile = profileBuilder.getProfile(userId);

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      res.json(profile);
    } catch (error) {
      logger.error('Error getting profile', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Predict chemistry for a group
   * POST /api/chemistry/predict
   * Body: { userIds: string[] }
   */
  router.post('/chemistry/predict', async (req: Request, res: Response) => {
    try {
      const { userIds } = req.body;
      logger.info(`POST /api/chemistry/predict for ${userIds?.length || 0} users`);

      if (!userIds || !Array.isArray(userIds) || userIds.length < 2) {
        return res.status(400).json({ error: 'At least 2 user IDs required' });
      }

      // Get profiles for all users
      const profiles = userIds
        .map(id => profileBuilder.getProfile(id))
        .filter(p => p !== null);

      if (profiles.length !== userIds.length) {
        const found = profiles.map(p => p!.user_id);
        const missing = userIds.filter(id => !found.includes(id));
        return res.status(404).json({
          error: 'Some profiles not found',
          missing,
        });
      }

      // Predict chemistry
      const prediction = chemistryPredictor.predictGroupChemistry(profiles);

      res.json(prediction);
    } catch (error) {
      logger.error('Error predicting chemistry', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Optimize guest list
   * POST /api/chemistry/optimize
   * Body: { userIds: string[], targetScore?: number }
   */
  router.post('/chemistry/optimize', async (req: Request, res: Response) => {
    try {
      const { userIds, targetScore = 80 } = req.body;
      logger.info(`POST /api/chemistry/optimize for ${userIds?.length || 0} users`);

      if (!userIds || !Array.isArray(userIds)) {
        return res.status(400).json({ error: 'userIds array required' });
      }

      // Get profiles
      const profiles = userIds
        .map(id => profileBuilder.getProfile(id))
        .filter(p => p !== null);

      if (profiles.length === 0) {
        return res.status(404).json({ error: 'No profiles found' });
      }

      // Get current prediction
      const currentPrediction = chemistryPredictor.predictGroupChemistry(profiles);

      // Simple optimization: remove users with consistently low pairwise scores
      // But keep at least 2 users (minimum for a group)
      let optimizedIds = userIds.filter(
        id => !currentPrediction.recommended_removals.includes(id)
      );

      // If optimization removed too many (or all), use a smarter approach
      if (optimizedIds.length < 2 || optimizedIds.length === userIds.length) {
        // Calculate average pairwise score for each user
        const userScores = new Map<string, number[]>();
        
        for (const [pairKey, score] of Object.entries(currentPrediction.pairwise_scores)) {
          const [u1, u2] = pairKey.split('_');
          if (!userScores.has(u1)) userScores.set(u1, []);
          if (!userScores.has(u2)) userScores.set(u2, []);
          userScores.get(u1)!.push(score);
          userScores.get(u2)!.push(score);
        }

        // Calculate average score per user
        const avgScores = Array.from(userScores.entries()).map(([userId, scores]) => ({
          userId,
          avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
        }));

        // Sort by average score and keep top users (at least 2, up to original count)
        avgScores.sort((a, b) => b.avgScore - a.avgScore);
        optimizedIds = avgScores
          .slice(0, Math.max(2, Math.min(profiles.length, userIds.length - 1)))
          .map(u => u.userId);
      }

      // Get optimized prediction
      const optimizedProfiles = optimizedIds
        .map(id => profileBuilder.getProfile(id))
        .filter(p => p !== null) as CommunicationProfile[];

      const optimizedPrediction =
        optimizedProfiles.length >= 2
          ? chemistryPredictor.predictGroupChemistry(optimizedProfiles)
          : null;

      res.json({
        original: {
          userIds,
          score: currentPrediction.group_score,
        },
        optimized: optimizedPrediction
          ? {
              userIds: optimizedIds,
              score: optimizedPrediction.group_score,
            }
          : null,
        improvements: optimizedPrediction
          ? {
              scoreIncrease: optimizedPrediction.group_score - currentPrediction.group_score,
              removed: currentPrediction.recommended_removals,
            }
          : null,
      });
    } catch (error) {
      logger.error('Error optimizing chemistry', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Create event
   * POST /api/events
   */
  router.post('/events', async (req: Request, res: Response) => {
    try {
      const { title, description, date, hostId, guestIds } = req.body;
      logger.info(`POST /api/events: ${title} by ${hostId}`);

      if (!title || !date || !hostId) {
        return res.status(400).json({ error: 'Missing required fields: title, date, hostId' });
      }

      const event = await eventService.createEvent({
        title,
        description: description || '',
        date,
        hostId,
        guestIds: guestIds || [],
      });

      res.status(201).json(event);
    } catch (error) {
      logger.error('Error creating event', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Get event by ID
   * GET /api/events/:eventId
   */
  router.get('/events/:eventId', async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const event = eventService.getEvent(eventId);

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      res.json(event);
    } catch (error) {
      logger.error('Error getting event', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Get events for user
   * GET /api/events/user/:userId
   */
  router.get('/events/user/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const events = eventService.getEventsForUser(userId);
      res.json(events);
    } catch (error) {
      logger.error('Error getting user events', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Send invitations (mock - would integrate with Series API)
   * POST /api/events/:eventId/invite
   */
  router.post('/events/:eventId/invite', async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const event = eventService.getEvent(eventId);

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // Mock invitation sending
      // In production, this would call Series messaging API
      logger.info(`Sending invitations for event ${eventId} to ${event.guest_ids.length} guests`);

      const invitations = event.guest_ids.map(guestId => ({
        guestId,
        status: 'sent',
        message: `You've been invited to ${event.title} on ${event.date.toISOString()}`,
      }));

      res.json({
        success: true,
        eventId,
        invitations,
        note: 'Mock invitations - integrate with Series API in production',
      });
    } catch (error) {
      logger.error('Error sending invitations', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Privacy: Export user data (GDPR compliance)
   * GET /api/privacy/export/:userId
   */
  router.get('/privacy/export/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const profile = profileBuilder.getProfile(userId);

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const exportData = PrivacyGuard.exportUserData(profile, {
        messages_analyzed: profile.total_messages_analyzed,
        last_updated: profile.last_updated,
      });

      res.json(exportData);
    } catch (error) {
      logger.error('Error exporting user data', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Privacy: Delete user data (GDPR compliance)
   * DELETE /api/privacy/delete/:userId
   */
  router.delete('/privacy/delete/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      logger.info(`Privacy: Deleting data for user ${userId}`);

      await profileBuilder.deleteProfile(userId);
      graphAnalyzer.removeNode(userId);

      res.json({
        success: true,
        message: 'User data deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting user data', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Frontend-compatible endpoints
   */

  /**
   * Get all available profiles (for frontend guest selection)
   * GET /api/profiles
   */
  router.get('/profiles', async (req: Request, res: Response) => {
    try {
      // For now, return empty array - frontend uses mock data
      // In production, this would return profiles from database
      res.json([]);
    } catch (error) {
      logger.error('Error getting profiles', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Predict chemistry from frontend profiles
   * POST /api/chemistry/predict-frontend
   * Body: { profiles: FrontendCommunicationProfile[] }
   */
  router.post('/chemistry/predict-frontend', async (req: Request, res: Response) => {
    try {
      const { profiles } = req.body;
      logger.info(`POST /api/chemistry/predict-frontend for ${profiles?.length || 0} profiles`);

      if (!profiles || !Array.isArray(profiles) || profiles.length < 1) {
        return res.status(400).json({ error: 'At least 1 profile required' });
      }

      // Use frontend adapter to calculate chemistry
      const chemistry = FrontendAdapter.calculateChemistryFromFrontendProfiles(profiles);

      res.json(chemistry);
    } catch (error) {
      logger.error('Error predicting chemistry (frontend)', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Optimize guest list (frontend format)
   * POST /api/chemistry/optimize-frontend
   * Body: { profiles: FrontendCommunicationProfile[] }
   */
  router.post('/chemistry/optimize-frontend', async (req: Request, res: Response) => {
    try {
      const { profiles } = req.body;
      logger.info(`POST /api/chemistry/optimize-frontend for ${profiles?.length || 0} profiles`);

      if (!profiles || !Array.isArray(profiles)) {
        return res.status(400).json({ error: 'profiles array required' });
      }

      const { optimizedGuests, removed } = FrontendAdapter.optimizeGuestList(profiles);

      // Recalculate chemistry for optimized list
      const optimizedChemistry = FrontendAdapter.calculateChemistryFromFrontendProfiles(optimizedGuests);
      const originalChemistry = FrontendAdapter.calculateChemistryFromFrontendProfiles(profiles);

      res.json({
        original: {
          profiles,
          score: originalChemistry.groupScore,
        },
        optimized: {
          profiles: optimizedGuests,
          score: optimizedChemistry.groupScore,
        },
        removed: removed.map(p => p.userId),
        improvements: {
          scoreIncrease: optimizedChemistry.groupScore - originalChemistry.groupScore,
        },
      });
    } catch (error) {
      logger.error('Error optimizing guest list (frontend)', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Get individual chemistry score
   * POST /api/chemistry/individual
   * Body: { profile: FrontendCommunicationProfile }
   */
  router.post('/chemistry/individual', async (req: Request, res: Response) => {
    try {
      const { profile } = req.body;

      if (!profile || !profile.userId) {
        return res.status(400).json({ error: 'Profile with userId required' });
      }

      const score = FrontendAdapter.getIndividualChemistry(profile);

      res.json({ userId: profile.userId, chemistry: score });
    } catch (error) {
      logger.error('Error calculating individual chemistry', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Create event (frontend format)
   * POST /api/events-frontend
   */
  router.post('/events-frontend', async (req: Request, res: Response) => {
    try {
      const { title, description, date, host, type, maxAttendees, guests } = req.body;
      logger.info(`POST /api/events-frontend: ${title} by ${host}`);

      if (!title || !date || !host) {
        return res.status(400).json({ error: 'Missing required fields: title, date, host' });
      }

      // Calculate chemistry score for guests
      let chemistryScore = 0;
      if (guests && Array.isArray(guests) && guests.length > 1) {
        const profiles = guests.map((g: FrontendGuest) => {
          // Extract profile from guest - in real app, this would fetch from database
          return {
            userId: g.userId,
            name: g.name,
            avatar: g.avatar,
            age: 25, // Default if not available
            gender: 'other' as const,
            school: '',
            role: '',
            company: '',
            bio: '',
            connectionDegree: 2 as const,
            alreadyKnow: false,
          };
        });
        const chemistry = FrontendAdapter.calculateChemistryFromFrontendProfiles(profiles);
        chemistryScore = chemistry.groupScore;
      }

      const event: FrontendEvent = {
        id: `event_${Date.now()}`,
        title,
        description: description || '',
        date: new Date(date).toISOString(),
        host,
        type: type || 'private',
        maxAttendees: maxAttendees || 20,
        guests: guests || [],
        chemistryScore,
      };

      // Also save in backend event service format
      await eventService.createEvent({
        title,
        description: description || '',
        date: new Date(date).toISOString(),
        hostId: host,
        guestIds: guests ? guests.map((g: FrontendGuest) => g.userId) : [],
      });

      res.status(201).json(event);
    } catch (error) {
      logger.error('Error creating event (frontend)', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Get event (frontend format)
   * GET /api/events-frontend/:eventId
   */
  router.get('/events-frontend/:eventId', async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const event = eventService.getEvent(eventId);

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // Convert to frontend format
      const frontendEvent: FrontendEvent = {
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date.toISOString(),
        host: event.host_id,
        type: 'private',
        maxAttendees: 20,
        guests: event.guest_ids.map(id => ({
          userId: id,
          name: `User ${id}`,
          avatar: '',
          rsvpStatus: 'pending' as const,
          individualChemistry: 75,
        })),
        chemistryScore: 0, // Would calculate if needed
      };

      res.json(frontendEvent);
    } catch (error) {
      logger.error('Error getting event (frontend)', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Health check
   * GET /api/health
   */
  router.get('/health', async (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      privacy: '✓ Privacy Guard Active - NO message content stored',
    });
  });

  return router;
}

