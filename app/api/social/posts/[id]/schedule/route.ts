import { Request, Response } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../../../../../../server/db';
import { socialPosts } from '../../../../../../shared/schema';

// Schema for scheduling a social post
const schedulePostSchema = z.object({
  scheduledAt: z.string().datetime(),
});

export async function scheduleSocialPost(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const body = req.body;

    // Validate request body
    const validatedData = schedulePostSchema.parse(body);

    // Mock organization ID (in real app, get from session/auth)
    const mockOrgId = '00000000-0000-0000-0000-000000000001';

    // Find the existing post
    const [existingPost] = await db
      .select()
      .from(socialPosts)
      .where(eq(socialPosts.id, id))
      .limit(1);

    if (!existingPost) {
      return res.status(404).json({
        error: 'Social post not found'
      });
    }

    // Check organization ownership
    if (existingPost.organizationId !== mockOrgId) {
      return res.status(403).json({
        error: 'Unauthorized to modify this post'
      });
    }

    // Check if post can be scheduled (only draft or scheduled posts)
    if (!['draft', 'scheduled'].includes(existingPost.status || '')) {
      return res.status(400).json({
        error: 'Post cannot be scheduled. Current status: ' + existingPost.status
      });
    }

    // Validate scheduling time is in the future
    const scheduledAt = new Date(validatedData.scheduledAt);
    const now = new Date();
    
    if (scheduledAt <= now) {
      return res.status(400).json({
        error: 'Scheduled time must be in the future'
      });
    }

    // Update the post with scheduling information
    const [updatedPost] = await db
      .update(socialPosts)
      .set({
        scheduledAt: scheduledAt,
        status: 'scheduled',
        error: null, // Clear any previous errors
      })
      .where(eq(socialPosts.id, id))
      .returning();

    // Mock connection display name
    const mockConnectionNames = {
      'facebook': 'Facebook Page',
      'instagram': 'Instagram Account', 
      'linkedin': 'LinkedIn Company',
      'twitter': 'Twitter Account',
      'tiktok': 'TikTok Account'
    };

    return res.json({
      success: true,
      message: 'Post scheduled successfully',
      data: {
        id: updatedPost.id,
        content: updatedPost.content,
        channel: updatedPost.channel,
        status: updatedPost.status,
        scheduledAt: updatedPost.scheduledAt,
        createdAt: updatedPost.createdAt,
        connectionDisplayName: mockConnectionNames[updatedPost.channel as keyof typeof mockConnectionNames] || 'Unknown Connection',
      }
    });

  } catch (error) {
    console.error('Error scheduling social post:', error);

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

export async function unscheduleSocialPost(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Mock organization ID (in real app, get from session/auth)
    const mockOrgId = '00000000-0000-0000-0000-000000000001';

    // Find the existing post
    const [existingPost] = await db
      .select()
      .from(socialPosts)
      .where(eq(socialPosts.id, id))
      .limit(1);

    if (!existingPost) {
      return res.status(404).json({
        error: 'Social post not found'
      });
    }

    // Check organization ownership
    if (existingPost.organizationId !== mockOrgId) {
      return res.status(403).json({
        error: 'Unauthorized to modify this post'
      });
    }

    // Check if post can be unscheduled (only scheduled posts)
    if (existingPost.status !== 'scheduled') {
      return res.status(400).json({
        error: 'Post is not scheduled. Current status: ' + existingPost.status
      });
    }

    // Update the post to draft status and remove scheduling
    const [updatedPost] = await db
      .update(socialPosts)
      .set({
        scheduledAt: null,
        status: 'draft',
        error: null,
      })
      .where(eq(socialPosts.id, id))
      .returning();

    return res.json({
      success: true,
      message: 'Post unscheduled successfully',
      data: {
        id: updatedPost.id,
        content: updatedPost.content,
        channel: updatedPost.channel,
        status: updatedPost.status,
        scheduledAt: updatedPost.scheduledAt,
        createdAt: updatedPost.createdAt,
      }
    });

  } catch (error) {
    console.error('Error unscheduling social post:', error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
}