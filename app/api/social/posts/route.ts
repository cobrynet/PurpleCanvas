import { Request, Response } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../../server/db';
import { socialPosts, insertSocialPostSchema } from '../../shared/schema';
import type { InsertSocialPost, SocialPost } from '../../shared/schema';

// Mock data for development
const mockSocialConnections = [
  { id: '550e8400-e29b-41d4-a716-446655440001', provider: 'facebook', displayName: 'Facebook Page' },
  { id: '550e8400-e29b-41d4-a716-446655440002', provider: 'instagram', displayName: 'Instagram Account' },
  { id: '550e8400-e29b-41d4-a716-446655440003', provider: 'linkedin', displayName: 'LinkedIn Company' },
  { id: '550e8400-e29b-41d4-a716-446655440004', provider: 'twitter', displayName: 'Twitter Account' },
  { id: '550e8400-e29b-41d4-a716-446655440005', provider: 'tiktok', displayName: 'TikTok Account' },
];

// Request body schema
const createSocialPostSchema = insertSocialPostSchema.extend({
  content: z.string().min(1, 'Content is required'),
  channel: z.enum(['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok']),
  usage: z.enum(['organico', 'adv']).default('organico'),
  assetIds: z.array(z.string()).optional(),
  scheduledAt: z.string().datetime().optional(),
});

export async function createSocialPost(req: Request, res: Response) {
  try {
    const body = req.body;
    
    // Validate request body
    const validatedData = createSocialPostSchema.parse(body);
    
    // Mock user and organization (in real app, get from session/auth)
    const mockUserId = 'mock-user-123';
    const mockOrgId = '00000000-0000-0000-0000-000000000001';
    
    // Get mock connection ID based on channel
    const mockConnection = mockSocialConnections.find(conn => 
      conn.provider === validatedData.channel || 
      (validatedData.channel === 'twitter' && conn.provider === 'twitter') ||
      (validatedData.channel === 'facebook' && conn.provider === 'facebook')
    );
    
    if (!mockConnection) {
      return res.status(400).json({
        error: 'Social connection not found for channel'
      });
    }

    // Prepare data for insertion
    const postData: InsertSocialPost = {
      organizationId: mockOrgId,
      createdByUserId: mockUserId,
      usage: validatedData.usage,
      channel: validatedData.channel,
      connectionId: mockConnection.id,
      content: validatedData.content,
      assetIds: validatedData.assetIds || [],
      scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : null,
      status: validatedData.scheduledAt ? 'scheduled' : 'draft',
    };

    // Insert social post into database
    const [newPost] = await db.insert(socialPosts).values(postData).returning();

    // Return created post
    return res.status(201).json({
      success: true,
      data: {
        id: newPost.id,
        content: newPost.content,
        channel: newPost.channel,
        status: newPost.status,
        scheduledAt: newPost.scheduledAt,
        createdAt: newPost.createdAt,
        connectionDisplayName: mockConnection.displayName,
      }
    });

  } catch (error) {
    console.error('Error creating social post:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error', 
        details: error.errors
      });
    }

    return res.status(500).json({
      error: 'Internal server error'
    });
  }
}

export async function getSocialPosts(req: Request, res: Response) {
  try {
    const { channel, status } = req.query;
    
    // Mock organization ID (in real app, get from session/auth)
    const mockOrgId = '00000000-0000-0000-0000-000000000001';

    // Build query with filters
    const posts = await db.select().from(socialPosts)
      .where(eq(socialPosts.organizationId, mockOrgId));

    // Enhance with mock connection data
    const enhancedPosts = posts.map(post => {
      const connection = mockSocialConnections.find(conn => conn.id === post.connectionId);
      return {
        ...post,
        connectionDisplayName: connection?.displayName || 'Unknown Connection'
      };
    });

    return res.json({
      success: true,
      data: enhancedPosts
    });

  } catch (error) {
    console.error('Error fetching social posts:', error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
}