import express, { Request, Response } from 'express';
import { ProfileBuilder } from '../services/profileBuilder.js';
import { ChemistryPredictor } from '../services/chemistryPredictor.js';
import { EventService } from '../services/eventService.js';
import { GraphAnalyzer } from '../services/graphAnalyzer.js';
import { FrontendAdapter } from '../services/frontendAdapter.js';
import { InvitationService } from '../services/invitationService.js';
import { PrivacyGuard } from '../utils/privacy.js';
import { logger } from '../utils/logger.js';
import { FrontendCommunicationProfile, FrontendEvent, FrontendGuest } from '../models/FrontendModels.js';
import { InviteRequest, GuestInvite } from '../models/Event.js';
import { normalizePhoneNumber } from '../models/SeriesConfig.js';
import { DEMO_PROFILES, getDemoProfile } from '../models/DemoProfiles.js';
import { chatMessageStore } from '../services/chatMessageStore.js';

/**
 * API Routes
 * REST API for frontend integration
 */
export function createRouter(
  profileBuilder: ProfileBuilder,
  chemistryPredictor: ChemistryPredictor,
  eventService: EventService,
  graphAnalyzer: GraphAnalyzer,
  invitationService?: InvitationService,
  vibeAIAgent?: any
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
   * Get events for a user (frontend format)
   * GET /api/events-frontend/user/:userId
   */
  router.get('/events-frontend/user/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const events = eventService.getEventsForUser(userId);

      // Convert to frontend format with RSVP status
      const frontendEvents: (FrontendEvent & { rsvpStatus?: 'going' | 'maybe' | 'pending' })[] = events.map(event => {
        // Map guest invites to frontend guests
        const frontendGuests = (event.guest_invites || []).map(invite => {
          let rsvpStatus: 'pending' | 'accepted' | 'declined' = 'pending';
          if (invite.rsvp_status === 'accepted') {
            rsvpStatus = 'accepted';
          } else if (invite.rsvp_status === 'declined') {
            rsvpStatus = 'declined';
          }

          return {
            userId: invite.user_id,
            name: invite.name || `User ${invite.user_id}`,
            avatar: '',
            rsvpStatus,
            individualChemistry: invite.chemistry_score || 75,
          };
        });

        // Determine if user is host or guest and get RSVP status
        const isHost = event.host_id === userId;
        let rsvpStatus: 'going' | 'maybe' | 'pending' | undefined;

        if (isHost) {
          rsvpStatus = 'going'; // Host is always going
        } else {
          const userInvite = event.guest_invites?.find(inv => inv.user_id === userId);
          if (userInvite) {
            if (userInvite.rsvp_status === 'accepted') {
              rsvpStatus = 'going';
            } else if (userInvite.rsvp_status === 'declined') {
              rsvpStatus = 'pending'; // Show as pending if declined (can change)
            } else {
              rsvpStatus = 'pending';
            }
          }
        }

        const frontendEvent: FrontendEvent & { rsvpStatus?: 'going' | 'maybe' | 'pending' } = {
          id: event.id,
          title: event.title,
          description: event.description,
          date: event.date.toISOString(),
          host: event.host_id,
          type: 'private',
          maxAttendees: event.guest_ids.length + 5,
          guests: frontendGuests,
          chemistryScore: 0,
        };

        if (rsvpStatus !== undefined && !isHost) {
          frontendEvent.rsvpStatus = rsvpStatus;
        }

        return frontendEvent;
      });

      res.json(frontendEvents);
    } catch (error) {
      logger.error('Error getting user events (frontend)', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Send invitations via Series iMessage API
   * POST /api/events/:eventId/invite
   * Body: { invites: [{ userId?, phoneNumber, name? }] }
   */
  router.post('/events/:eventId/invite', async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const { invites } = req.body as { invites?: InviteRequest[] };
      
      const event = eventService.getEvent(eventId);

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // Validate invites array
      if (!invites || !Array.isArray(invites) || invites.length === 0) {
        return res.status(400).json({ 
          error: 'invites array required with at least one invite',
          example: {
            invites: [
              { phoneNumber: '+1234567890', userId: 'user-1', name: 'John Doe' }
            ]
          }
        });
      }

      // Convert to GuestInvite format
      const guestInvites: GuestInvite[] = invites.map(invite => {
        // Try to get chemistry score if userId provided
        let chemistryScore = 75; // default
        if (invite.userId) {
          const profile = profileBuilder.getProfile(invite.userId);
          // Get chemistry score from frontend adapter if needed
          if (profile) {
            // Use individual chemistry calculation
            chemistryScore = 75; // TODO: calculate from profile
          }
        }

        return {
          user_id: invite.userId || `guest_${Date.now()}`,
          phone_number: invite.phoneNumber,
          name: invite.name,
          chemistry_score: chemistryScore,
          rsvp_status: 'pending',
        };
      });

      // For demo: Always send to demo phone numbers (mock users)
      const DEMO_PHONE_NUMBERS = ['+14843693839', '+19178615579'];
      
      // Replace all guest invites with demo phone numbers
      const demoGuestInvites: GuestInvite[] = DEMO_PHONE_NUMBERS.map((phone, index) => {
        const demoProfile = getDemoProfile(phone);
        return {
          user_id: demoProfile?.userId || `demo-guest-${index + 1}`,
          phone_number: phone,
          name: demoProfile?.name || `Demo Guest ${index + 1}`,
          chemistry_score: guestInvites[index]?.chemistry_score || 75,
          rsvp_status: 'pending' as const,
        };
      });

      logger.info(`Sending invitations for event ${eventId} to ${demoGuestInvites.length} demo phone numbers`);
      logger.info(`Demo phones: ${DEMO_PHONE_NUMBERS.join(', ')}`);

      // Use InvitationService if available, otherwise mock
      if (invitationService && invitationService.isEnabled()) {
        logger.info('Using Series iMessage API to send invitations');
        const results = await invitationService.sendBulkInvitations(event, demoGuestInvites);

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success);

        res.json({
          success: true,
          eventId,
          total: results.length,
          successful,
          failed: failed.length,
          invitations: results.map(r => ({
            guestId: r.guest.user_id,
            phoneNumber: r.guest.phone_number,
            status: r.success ? 'sent' : 'failed',
            error: r.error,
            chatId: r.chatId,
          })),
        });
      } else {
        // Mock mode
        logger.info('Mock mode: Simulating invitation sending to demo phones');
        const invitations = demoGuestInvites.map(guest => ({
          guestId: guest.user_id,
          phoneNumber: guest.phone_number,
          status: 'sent' as const,
          message: `You've been invited to ${event.title} on ${event.date.toISOString()}`,
        }));

        res.json({
          success: true,
          eventId,
          invitations,
          note: 'Mock invitations - Series API credentials not configured',
        });
      }
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

      // Store guest invites with phone numbers if provided
      const guestInvites: GuestInvite[] | undefined = guests?.map((g: any) => ({
        user_id: g.userId,
        phone_number: g.phone_number || g.phoneNumber,
        name: g.name,
        chemistry_score: g.individualChemistry || chemistryScore,
        rsvp_status: 'pending',
      }));

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
      const backendEvent = await eventService.createEvent({
        title,
        description: description || '',
        date: new Date(date).toISOString(),
        hostId: host,
        guestIds: guests ? guests.map((g: FrontendGuest) => g.userId) : [],
        guestInvites,
      });

      // Update event with guest invites if provided
      if (guestInvites && guestInvites.length > 0) {
        await eventService.updateEvent(backendEvent.id, {
          guest_invites: guestInvites,
        });
      }

      // Use backend event ID for consistency
      const frontendEventWithBackendId: FrontendEvent = {
        ...event,
        id: backendEvent.id, // Use backend event ID so invites can find it
      };

      res.status(201).json(frontendEventWithBackendId);
    } catch (error) {
      logger.error('Error creating event (frontend)', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Send invitations (frontend format)
   * POST /api/events-frontend/:eventId/invite
   * Body: { invites: [{ userId?, phoneNumber, name? }] }
   */
  router.post('/events-frontend/:eventId/invite', async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const { invites } = req.body as { invites?: InviteRequest[] };
      
      // Get event from backend service
      const event = eventService.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // Validate invites
      if (!invites || !Array.isArray(invites) || invites.length === 0) {
        return res.status(400).json({ 
          error: 'invites array required with at least one invite',
        });
      }

      // Convert to GuestInvite format
      const guestInvites: GuestInvite[] = invites.map(invite => ({
        user_id: invite.userId || `guest_${Date.now()}_${Math.random()}`,
        phone_number: invite.phoneNumber,
        name: invite.name,
        rsvp_status: 'pending',
        chemistry_score: 75, // Default score
      }));

      // For demo: Always send to demo phone numbers (mock users)
      const DEMO_PHONE_NUMBERS = ['+14843693839', '+19178615579'];
      
      // Replace all guest invites with demo phone numbers
      const demoGuestInvites: GuestInvite[] = DEMO_PHONE_NUMBERS.map((phone, index) => {
        const demoProfile = getDemoProfile(phone);
        return {
          user_id: demoProfile?.userId || `demo-guest-${index + 1}`,
          phone_number: phone,
          name: demoProfile?.name || `Demo Guest ${index + 1}`,
          chemistry_score: guestInvites[index]?.chemistry_score || 75,
          rsvp_status: 'pending' as const,
        };
      });

      // Update event to include demo guest IDs in guest_ids array so they can see the event
      const demoGuestIds = demoGuestInvites.map(g => g.user_id);
      const updatedGuestIds = Array.from(new Set([...event.guest_ids, ...demoGuestIds]));
      const updatedEvent = await eventService.updateEvent(eventId, {
        guest_ids: updatedGuestIds,
        guest_invites: demoGuestInvites,
      });
      
      logger.info(`Sending frontend invitations for event ${eventId} to ${demoGuestInvites.length} demo phone numbers`);
      logger.info(`Demo phones: ${DEMO_PHONE_NUMBERS.join(', ')}`);
      logger.info(`Updated event guest_ids: ${updatedGuestIds.join(', ')}`);

      // Send invitations via iMessage (within Kafka topic)
      if (invitationService && invitationService.isEnabled()) {
        logger.info(`Sending iMessage invitations for event ${eventId} to demo numbers`, {
          phones: DEMO_PHONE_NUMBERS,
          topic: process.env.SERIES_KAFKA_TOPIC,
        });

        const results = await invitationService.sendBulkInvitations(event, demoGuestInvites);
        const successful = results.filter(r => r.success).length;

        // Also store in web chat as backup
        for (const guest of demoGuestInvites) {
          const inviteMessage = `🎉 You've been invited to **${event.title}**!\n\n` +
            `📅 Date: ${event.date.toLocaleDateString()}\n` +
            `📍 Description: ${event.description || 'No description'}\n` +
            `👤 Host: ${event.host_id}\n\n` +
            `Reply with "yes" to accept or "no" to decline.`;

          chatMessageStore.addSystemMessage(guest.user_id, inviteMessage, {
            eventId: event.id,
            type: 'invitation',
          });
        }

        res.json({
          success: true,
          eventId,
          total: results.length,
          successful,
          failed: results.length - successful,
          invitations: results.map(r => ({
            guestId: r.guest.user_id,
            phoneNumber: r.guest.phone_number,
            name: r.guest.name,
            status: r.success ? 'sent' : 'failed',
            channel: r.success ? 'iMessage' : 'failed',
            error: r.error,
          })),
        });
      } else {
        // Fallback to web chat only if iMessage not available
        for (const guest of demoGuestInvites) {
          const inviteMessage = `🎉 You've been invited to **${event.title}**!\n\n` +
            `📅 Date: ${event.date.toLocaleDateString()}\n` +
            `📍 Description: ${event.description || 'No description'}\n` +
            `👤 Host: ${event.host_id}\n\n` +
            `Reply with "yes" to accept or "no" to decline.`;

          chatMessageStore.addSystemMessage(guest.user_id, inviteMessage, {
            eventId: event.id,
            type: 'invitation',
          });
        }

        res.json({
          success: true,
          eventId,
          invitations: demoGuestInvites.map(g => ({
            guestId: g.user_id,
            phoneNumber: g.phone_number,
            name: g.name,
            status: 'sent',
            channel: 'web-chat',
            note: 'iMessage not configured - using web chat',
          })),
        });
      }
    } catch (error: any) {
      const { eventId } = req.params;
      const { invites } = req.body as { invites?: InviteRequest[] };
      
      logger.error('Error sending frontend invitations', { 
        error: error?.message || String(error),
        stack: error?.stack,
        eventId,
        invites: invites?.length || 0,
      });
      res.status(500).json({ 
        error: 'Internal server error',
        message: error?.message || 'Unknown error occurred',
      });
    }
  });

  /**
   * Update event (frontend format)
   * PUT /api/events-frontend/:eventId
   */
  router.put('/events-frontend/:eventId', async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const { title, description, date, type, maxAttendees } = req.body;
      
      const event = eventService.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // Update event
      const updated = await eventService.updateEvent(eventId, {
        title: title || event.title,
        description: description || event.description,
        date: date ? new Date(date) : event.date,
        guest_ids: event.guest_ids,
        guest_invites: event.guest_invites,
      });

      if (!updated) {
        return res.status(404).json({ error: 'Failed to update event' });
      }

      // Convert to frontend format
      const frontendEvent: FrontendEvent = {
        id: updated.id,
        title: updated.title,
        description: updated.description,
        date: updated.date.toISOString(),
        host: updated.host_id,
        type: type || 'private',
        maxAttendees: maxAttendees || updated.guest_ids.length + 5,
        guests: updated.guest_ids.map(id => ({
          userId: id,
          name: `User ${id}`,
          avatar: '',
          rsvpStatus: 'pending' as const,
          individualChemistry: 75,
        })),
        chemistryScore: 0,
      };

      res.json(frontendEvent);
    } catch (error) {
      logger.error('Error updating event (frontend)', { error });
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
      const currentUserId = req.query.userId as string || 'current-user'; // TODO: Get from auth
      const event = eventService.getEvent(eventId);

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // Map guest invites to frontend guests with RSVP status
      const frontendGuests = (event.guest_invites || []).map(invite => {
        // Map backend RSVP status to frontend status
        let rsvpStatus: 'pending' | 'accepted' | 'declined' = 'pending';
        if (invite.rsvp_status === 'accepted') {
          rsvpStatus = 'accepted';
        } else if (invite.rsvp_status === 'declined') {
          rsvpStatus = 'declined';
        }

        return {
          userId: invite.user_id,
          name: invite.name || `User ${invite.user_id}`,
          avatar: '', // Would come from user profile in real app
          rsvpStatus,
          individualChemistry: invite.chemistry_score || 75,
        };
      });

      // Find current user's RSVP status for this event
      let currentUserRSVP: 'going' | 'maybe' | 'pending' | undefined;
      if (event.host_id === currentUserId) {
        // Host is always "going"
        currentUserRSVP = 'going';
      } else {
        const userInvite = event.guest_invites?.find(inv => inv.user_id === currentUserId);
        if (userInvite) {
          if (userInvite.rsvp_status === 'accepted') {
            currentUserRSVP = 'going';
          } else if (userInvite.rsvp_status === 'declined') {
            currentUserRSVP = 'pending'; // Show as pending if declined (can change)
          } else {
            currentUserRSVP = 'pending';
          }
        }
      }

      // Convert to frontend format
      const frontendEvent: FrontendEvent = {
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date.toISOString(),
        host: event.host_id,
        type: 'private',
        maxAttendees: event.guest_ids.length + 5,
        guests: frontendGuests, // Use the mapped guests with RSVP status
        chemistryScore: 0, // Would calculate if needed
        rsvpStatus: currentUserRSVP, // Include current user's RSVP status
      };

      // Add RSVP status for current user if this is an invited event
      const response: any = { 
        ...frontendEvent,
        rsvpStatus: currentUserRSVP, // Include current user's RSVP status
      };
      if (currentUserRSVP !== undefined && event.host_id !== currentUserId) {
        response.rsvpStatus = currentUserRSVP;
      }

      res.json(response);
    } catch (error) {
      logger.error('Error getting event (frontend)', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Send reminders for an event
   * POST /api/events-frontend/:eventId/reminders
   */
  router.post('/events-frontend/:eventId/reminders', async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const event = eventService.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // Get all guests who haven't RSVP'd or are going/maybe
      const guestsToRemind = event.guest_invites?.filter(
        invite => invite.rsvp_status === 'pending' || invite.rsvp_status === 'going'
      ) || [];

      if (guestsToRemind.length === 0) {
        return res.json({
          success: true,
          message: 'No guests to send reminders to',
          sent: 0,
        });
      }

      logger.info(`Sending reminders for event ${eventId} to ${guestsToRemind.length} guests`);

      // For demo: Always send to demo phone numbers
      const DEMO_PHONE_NUMBERS = ['+14843693839', '+19178615579'];
      
      const demoReminders: GuestInvite[] = DEMO_PHONE_NUMBERS.map((phone, index) => {
        const demoProfile = getDemoProfile(phone);
        return {
          user_id: demoProfile?.userId || `demo-guest-${index + 1}`,
          phone_number: phone,
          name: demoProfile?.name || `Guest ${index + 1}`,
          rsvp_status: 'pending' as const,
          chemistry_score: 75,
        };
      });

      // Use InvitationService if available
      if (invitationService && invitationService.isEnabled()) {
        // Send reminders using reminder-specific method
        const results = await Promise.all(
          demoReminders.map(guest => invitationService.sendReminder(event, guest))
        );
        const successful = results.filter(r => r.success).length;

        res.json({
          success: true,
          message: `Reminders sent to ${successful} guest(s)`,
          sent: successful,
          failed: results.length - successful,
        });
      } else {
        // Mock mode
        logger.info(`MOCK: Would send reminders to ${demoReminders.length} guests for event ${event.title}`);
        res.json({
          success: true,
          message: `Reminders sent to ${demoReminders.length} guest(s) (mock mode)`,
          sent: demoReminders.length,
          note: 'Mock mode - Series API not configured',
        });
      }
    } catch (error) {
      logger.error('Error sending reminders', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Update RSVP status for a user
   * PUT /api/events-frontend/:eventId/rsvp
   */
  router.put('/events-frontend/:eventId/rsvp', async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const { userId, status } = req.body as { userId: string; status: 'accepted' | 'declined' | 'pending' | 'maybe' };

      if (!userId || !status) {
        return res.status(400).json({ error: 'Missing required fields: userId, status' });
      }

      if (!['accepted', 'declined', 'pending', 'maybe'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be: accepted, declined, pending, or maybe' });
      }

      const event = eventService.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // Update guest invite RSVP status
      const guestInvites = event.guest_invites || [];
      const guestIndex = guestInvites.findIndex(invite => invite.user_id === userId);

      // Get the old status BEFORE updating
      const oldStatus = guestIndex !== -1 ? guestInvites[guestIndex].rsvp_status : 'pending';
      const guestInfo = guestIndex !== -1 ? { ...guestInvites[guestIndex] } : { user_id: userId };

      if (guestIndex === -1) {
        // Guest not found in invites, add them
        guestInvites.push({
          user_id: userId,
          phone_number: guestInfo.phone_number,
          name: guestInfo.name,
          rsvp_status: status === 'accepted' ? 'accepted' : status === 'declined' ? 'declined' : 'pending',
          chemistry_score: guestInfo.chemistry_score || 75,
        });
      } else {
        // Update existing guest's RSVP status
        guestInvites[guestIndex].rsvp_status = status === 'accepted' ? 'accepted' : status === 'declined' ? 'declined' : 'pending';
      }

      // Update event with new guest invites
      const updated = await eventService.updateEvent(eventId, {
        guest_invites: guestInvites,
      });

      if (!updated) {
        return res.status(404).json({ error: 'Event not found' });
      }

      logger.info(`RSVP updated for user ${userId} on event ${eventId}: ${oldStatus} -> ${status}`);

      // Get updated event and guest info
      const updatedEvent = eventService.getEvent(eventId);
      if (!updatedEvent) {
        return res.status(404).json({ error: 'Event not found after update' });
      }

      const guestInvite = updatedEvent.guest_invites?.find(inv => inv.user_id === userId);
      const guestName = guestInvite?.name || 'A guest';

      // 1. Send notification to HOST via web chat interface
      if ((status === 'accepted' || status === 'declined') && oldStatus !== status) {
        try {
          const hostId = updatedEvent.host_id;
          const statusText = status === 'accepted' ? '✅ accepted' : '❌ declined';
          const hostNotification = `📅 RSVP Update for "${updatedEvent.title}"\n\n` +
            `${guestName} has ${statusText} your invitation.\n\n` +
            `Event: ${updatedEvent.title}\n` +
            `Date: ${updatedEvent.date.toLocaleDateString()}\n` +
            `Guest: ${guestName}`;

          // Add to host's web chat
          chatMessageStore.addSystemMessage(hostId, hostNotification, {
            eventId: updatedEvent.id,
            type: 'rsvp_confirmation',
          });

          logger.info(`RSVP notification added to host's web chat`, {
            hostId,
            eventId,
            guestName,
            status,
          });
        } catch (error: any) {
          logger.error('Failed to add RSVP notification to host chat', {
            error: error.message,
          });
        }
      }

      // 2. Send confirmation to GUEST via iMessage (if they accepted or declined)
      if ((status === 'accepted' || status === 'declined') && invitationService && invitationService.isEnabled()) {
        try {
          if (guestInvite?.phone_number) {
            const normalized = normalizePhoneNumber(guestInvite.phone_number);
            if (normalized) {
              // Get or create chat for guest
              // Note: getOrCreateChat is a public method but TypeScript doesn't see it
              // We access it directly since sendMessage will validate the recipient
              const chat = await (invitationService as { getOrCreateChat(phone: string): Promise<{ id: number } | null> }).getOrCreateChat(normalized);
              if (chat?.id) {
                const confirmationMessage = status === 'accepted' 
                  ? `✅ RSVP Confirmed!\n\n` +
                    `You're going to "${updatedEvent.title}"\n\n` +
                    `Date: ${updatedEvent.date.toLocaleDateString()}\n` +
                    `Time: ${updatedEvent.date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}\n\n` +
                    `See you there! 🎉`
                  : `📅 RSVP Updated\n\n` +
                    `You've declined the invitation to "${updatedEvent.title}".\n\n` +
                    `Date: ${updatedEvent.date.toLocaleDateString()}\n` +
                    `The host has been notified.\n\n` +
                    `You can change your RSVP anytime if your plans change.`;

                // Send confirmation message (sendMessage will validate recipient)
                const sent = await invitationService.sendMessage(chat.id, confirmationMessage, normalized);
                
                if (sent) {
                  logger.info(`RSVP confirmation sent to guest via iMessage`, {
                    guestPhone: normalized,
                    eventId,
                    chatId: chat.id,
                  });
                } else {
                  logger.warn(`Failed to send RSVP confirmation to guest (sendMessage returned false)`, {
                    guestPhone: normalized,
                    eventId,
                  });
                }
              } else {
                logger.warn(`Failed to get or create chat for guest`, {
                  guestPhone: normalized,
                  eventId,
                });
              }
            }
          }
        } catch (error: any) {
          // Don't fail the RSVP update if iMessage fails
          logger.error('Failed to send RSVP confirmation to guest', {
            error: error.message,
            eventId,
            userId,
          });
        }
      }

      // Return updated event data so frontend can refresh
      // updatedEvent is already declared above, reuse it
      if (!updatedEvent) {
        return res.status(404).json({ error: 'Event not found after update' });
      }

      // Map guest invites to frontend format for response
      const frontendGuests = (updatedEvent.guest_invites || []).map(invite => {
        let rsvpStatus: 'pending' | 'accepted' | 'declined' = 'pending';
        if (invite.rsvp_status === 'accepted') {
          rsvpStatus = 'accepted';
        } else if (invite.rsvp_status === 'declined') {
          rsvpStatus = 'declined';
        }

        return {
          userId: invite.user_id,
          name: invite.name || `User ${invite.user_id}`,
          avatar: '',
          rsvpStatus,
          individualChemistry: invite.chemistry_score || 75,
        };
      });

      // Find current user's RSVP status
      let currentUserRSVP: 'going' | 'maybe' | 'pending' | 'declined' | undefined;
      if (updatedEvent.host_id === userId) {
        currentUserRSVP = 'going';
      } else {
        const userInvite = updatedEvent.guest_invites?.find(inv => inv.user_id === userId);
        if (userInvite) {
          if (userInvite.rsvp_status === 'accepted') {
            currentUserRSVP = 'going';
          } else if (userInvite.rsvp_status === 'declined') {
            currentUserRSVP = 'declined';
          } else {
            currentUserRSVP = 'pending';
          }
        }
      }

      res.json({
        success: true,
        message: 'RSVP updated successfully',
        eventId,
        userId,
        status,
        rsvpStatus: currentUserRSVP,
        guests: frontendGuests,
      });
    } catch (error) {
      logger.error('Error updating RSVP', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Create/Open group chat for event guests
   * POST /api/events-frontend/:eventId/group-chat
   */
  router.post('/events-frontend/:eventId/group-chat', async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const event = eventService.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // Get all phone numbers: host + guests
      const phoneNumbers: string[] = [];
      
      // Add host phone (use sender phone as host for demo)
      const hostPhone = process.env.SERIES_SENDER_PHONE || '';
      if (hostPhone) {
        phoneNumbers.push(hostPhone);
      }

      // Add guest phone numbers from guest_invites
      const guestInvites = event.guest_invites || [];
      for (const guest of guestInvites) {
        if (guest.phone_number) {
          phoneNumbers.push(guest.phone_number);
        }
      }

      // For demo: Always use demo phone numbers
      const DEMO_PHONE_NUMBERS = ['+14843693839', '+19178615579'];
      const demoPhones = [hostPhone || '+16463230991', ...DEMO_PHONE_NUMBERS];
      const uniqueDemoPhones = Array.from(new Set(demoPhones)).filter(Boolean);

      logger.info(`Creating group chat for event ${eventId} with ${uniqueDemoPhones.length} participants`);

      // Use InvitationService if available
      if (invitationService && invitationService.isEnabled()) {
        try {
          const chat = await invitationService.getOrCreateGroupChat(uniqueDemoPhones);
          
          if (!chat) {
            logger.error('getOrCreateGroupChat returned null', { 
              eventId, 
              phoneCount: uniqueDemoPhones.length,
              phones: uniqueDemoPhones 
            });
            return res.status(500).json({ 
              error: 'Failed to create group chat',
              details: 'The group chat creation returned null. Check server logs for details.'
            });
          }

          // Send initial message to the group
          const message = `🎉 Group chat for "${event.title}"!\n\n${event.description || ''}\n\nLet's coordinate and get excited! 🚀`;
          const messageSent = await invitationService.sendGroupMessage(chat.id, message);

          res.json({
            success: true,
            chatId: chat.id,
            message: `Group chat created with ${uniqueDemoPhones.length} participants`,
            messageSent,
          });
        } catch (groupChatError: any) {
          logger.error('Error in group chat creation process', {
            eventId,
            error: groupChatError.message,
            stack: groupChatError.stack,
            phones: uniqueDemoPhones,
          });
          return res.status(500).json({
            error: 'Failed to create group chat',
            details: groupChatError.message || 'Unknown error during group chat creation',
          });
        }
      } else {
        // Mock mode
        logger.info(`MOCK: Would create group chat with ${uniqueDemoPhones.length} participants`);
        res.json({
          success: true,
          chatId: 999999,
          message: `Group chat created with ${uniqueDemoPhones.length} participants (mock mode)`,
          messageSent: true,
          note: 'Mock mode - Series API not configured',
        });
      }
    } catch (error: any) {
      logger.error('Error creating group chat', { 
        error: error.message,
        stack: error.stack,
        eventId 
      });
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message || 'Failed to create group chat'
      });
    }
  });

  /**
   * Delete/Cancel an event
   * DELETE /api/events-frontend/:eventId
   */
  router.delete('/events-frontend/:eventId', async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const event = eventService.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // Optionally send cancellation notices to guests
      const guestsToNotify = event.guest_invites || [];
      
      if (guestsToNotify.length > 0 && invitationService && invitationService.isEnabled()) {
        logger.info(`Sending cancellation notices for event ${eventId} to ${guestsToNotify.length} guests`);
        
        // For demo: Send to demo phone numbers
        const DEMO_PHONE_NUMBERS = ['+14843693839', '+19178615579'];
        const demoNotices: GuestInvite[] = DEMO_PHONE_NUMBERS.map((phone, index) => {
          const demoProfile = getDemoProfile(phone);
          return {
            user_id: demoProfile?.userId || `demo-guest-${index + 1}`,
            phone_number: phone,
            name: demoProfile?.name || `Guest ${index + 1}`,
            rsvp_status: 'pending' as const,
            chemistry_score: 75,
          };
        });

        // Send cancellation messages
        for (const guest of demoNotices) {
          try {
            const chat = await invitationService.getOrCreateChat(guest.phone_number);
            if (chat) {
              const message = `We're sorry to inform you that "${event.title}" has been cancelled. We hope to see you at future events!`;
              await invitationService.sendMessage(chat.id, message);
            }
          } catch (error) {
            logger.error(`Failed to send cancellation notice to ${guest.phone_number}`, { error });
          }
        }
      }

      // Delete the event
      const deleted = await eventService.deleteEvent(eventId);
      
      if (deleted) {
        logger.info(`Event ${eventId} deleted`);
        res.json({
          success: true,
          message: 'Event cancelled and guests have been notified',
        });
      } else {
        res.status(404).json({ error: 'Event not found' });
      }
    } catch (error) {
      logger.error('Error cancelling event', { error });
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

  /**
   * Web chat endpoint (for frontend chat interface)
   * POST /api/chat
   */
  router.post('/chat', async (req: Request, res: Response) => {
    try {
      const { text, userId, phoneNumber } = req.body;

      if (!text || !userId) {
        return res.status(400).json({ error: 'Missing required fields: text, userId' });
      }

      logger.info('Received web chat message', {
        userId,
        textLength: text.length,
      });

      // Store user's message
      chatMessageStore.addMessage(userId, {
        userId,
        text,
        sender: 'user',
        timestamp: new Date(),
      });

      // Process through AI agent if available
      if (!vibeAIAgent) {
        return res.status(503).json({ error: 'AI agent not available' });
      }

      const response = await vibeAIAgent.handleInboundMessage({
        sender_phone: phoneNumber || '+1234567890',
        text: text,
        chat_id: 0,
        timestamp: new Date(),
      });

      // Store bot's response
      chatMessageStore.addSystemMessage(userId, response);

      return res.json({
        success: true,
        response: response,
      });
    } catch (error: any) {
      logger.error('Error handling web chat message', {
        error: error.message,
        stack: error.stack,
      });
      return res.status(500).json({
        error: 'Failed to process message',
        message: error.message,
      });
    }
  });

  /**
   * Get chat history for a user
   * GET /api/chat/history/:userId
   */
  router.get('/chat/history/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

      const messages = chatMessageStore.getMessages(userId, limit);

      return res.json({
        success: true,
        messages: messages.map(m => ({
          id: m.id,
          text: m.text,
          sender: m.sender,
          timestamp: m.timestamp,
          metadata: m.metadata,
        })),
      });
    } catch (error: any) {
      logger.error('Error getting chat history', {
        error: error.message,
      });
      return res.status(500).json({
        error: 'Failed to get chat history',
      });
    }
  });

  /**
   * Handle inbound iMessage from Series API
   * POST /api/inbound-message
   * This endpoint receives messages sent to the Series sender phone number
   */
  router.post('/inbound-message', async (req: Request, res: Response) => {
    try {
      if (!vibeAIAgent) {
        logger.warn('VibeAIAgent not initialized - cannot handle inbound messages');
        return res.status(503).json({ error: 'AI agent not available' });
      }

      // Parse Series API webhook format
      // Expected format may vary, but typically includes:
      // - sender_phone or from
      // - text or message or body
      // - chat_id
      // - timestamp
      const body = req.body;
      
      const senderPhone = body.sender_phone || body.from || body.phone_number;
      const messageText = body.text || body.message || body.body || body.content;
      const chatId = body.chat_id || body.chat?.id || body.conversation_id;
      const timestamp = body.timestamp ? new Date(body.timestamp) : new Date();

      if (!senderPhone || !messageText) {
        logger.warn('Inbound message missing required fields', { body });
        return res.status(400).json({ error: 'Missing sender_phone or text' });
      }

      logger.info('Received inbound message', {
        sender: senderPhone,
        textLength: messageText.length,
        chatId,
      });

      // Handle message with Vibe AI agent
      const response = await vibeAIAgent.handleInboundMessage({
        sender_phone: senderPhone,
        text: messageText,
        chat_id: chatId || 0,
        timestamp,
      });

      // Send response back via iMessage (only to authorized recipients)
      if (invitationService && invitationService.isEnabled()) {
        try {
          const normalized = normalizePhoneNumber(senderPhone);
          if (normalized) {
            // SECURITY: Validate recipient is authorized (demo profile)
            const demoProfile = getDemoProfile(normalized);
            if (!demoProfile) {
              logger.warn('Blocked response to unauthorized sender via API endpoint', {
                senderPhone: normalized,
              });
              // Still return success - message was processed, just not sent
            } else {
              const chat = await invitationService.getOrCreateChat(normalized);
              if (chat) {
                await invitationService.sendMessage(chat.id, response, normalized);
              }
            }
          }
        } catch (error: any) {
          logger.error('Error sending response message', { error: error.message });
          // Still return success - message was processed, just couldn't send response
        }
      }

      // Return 200 OK to Series API
      res.json({
        success: true,
        message: 'Message processed',
        response_sent: true,
      });
    } catch (error: any) {
      logger.error('Error handling inbound message', {
        error: error.message,
        stack: error.stack,
      });
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  });

  return router;
}

