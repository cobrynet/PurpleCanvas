import { Request, Response } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../../../../../../server/db';
import { socialPosts } from '../../../../../../shared/schema';

// Schema for publishing options
const publishPostSchema = z.object({
  publishNow: z.boolean().default(true),
  scheduledAt: z.string().datetime().optional(),
}).refine(data => {
  if (!data.publishNow && !data.scheduledAt) {
    throw new Error('Either publishNow must be true or scheduledAt must be provided');
  }
  return true;
});

export async function publishSocialPost(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const body = req.body || {};

    // Validate request body
    const validatedData = publishPostSchema.parse(body);

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

    // Check if post can be published
    if (!['draft', 'scheduled', 'failed'].includes(existingPost.status || '')) {
      return res.status(400).json({
        error: `Post cannot be published. Current status: ${existingPost.status}`
      });
    }

    // Mock external API call to social platform
    const mockPublishResult = await mockPublishToSocialPlatform(existingPost);

    let updateData: any = {
      error: null,
    };

    if (validatedData.publishNow) {
      // Publishing immediately
      if (mockPublishResult.success) {
        updateData = {
          ...updateData,
          status: 'published',
          publishedAt: new Date(),
          externalPostId: mockPublishResult.externalPostId,
          scheduledAt: null, // Clear any previous scheduling
        };
      } else {
        updateData = {
          ...updateData,
          status: 'failed',
          error: mockPublishResult.error,
        };
      }
    } else {
      // Scheduling for later
      const scheduledAt = new Date(validatedData.scheduledAt!);
      const now = new Date();
      
      if (scheduledAt <= now) {
        return res.status(400).json({
          error: 'Scheduled time must be in the future'
        });
      }

      updateData = {
        ...updateData,
        status: 'scheduled',
        scheduledAt: scheduledAt,
      };
    }

    // Update the post in database
    const [updatedPost] = await db
      .update(socialPosts)
      .set(updateData)
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

    const response = {
      success: true,
      message: validatedData.publishNow 
        ? (mockPublishResult.success ? 'Post published successfully' : 'Failed to publish post')
        : 'Post scheduled for publication',
      data: {
        id: updatedPost.id,
        content: updatedPost.content,
        channel: updatedPost.channel,
        status: updatedPost.status,
        scheduledAt: updatedPost.scheduledAt,
        publishedAt: updatedPost.publishedAt,
        externalPostId: updatedPost.externalPostId,
        error: updatedPost.error,
        createdAt: updatedPost.createdAt,
        connectionDisplayName: mockConnectionNames[updatedPost.channel as keyof typeof mockConnectionNames] || 'Unknown Connection',
      }
    };

    // Return appropriate status code
    if (validatedData.publishNow && !mockPublishResult.success) {
      return res.status(500).json(response);
    }

    return res.json(response);

  } catch (error) {
    console.error('Error publishing social post:', error);

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

// Mock function to simulate publishing to external social platform
async function mockPublishToSocialPlatform(post: any): Promise<{
  success: boolean;
  externalPostId?: string;
  error?: string;
}> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock success/failure logic (90% success rate)
  const success = Math.random() > 0.1;

  if (success) {
    return {
      success: true,
      externalPostId: `${post.channel}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  } else {
    // Mock different types of failures
    const errorTypes = [
      'Rate limit exceeded. Please try again later.',
      'Invalid content format for this platform.',
      'Media files could not be processed.',
      'Account connection expired. Please reconnect.',
      'Platform maintenance in progress.'
    ];
    
    return {
      success: false,
      error: errorTypes[Math.floor(Math.random() * errorTypes.length)]
    };
  }
}

export async function getPublishStatus(req: Request, res: Response) {
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
        error: 'Unauthorized to access this post'
      });
    }

    return res.json({
      success: true,
      data: {
        id: existingPost.id,
        status: existingPost.status,
        publishedAt: existingPost.publishedAt,
        scheduledAt: existingPost.scheduledAt,
        externalPostId: existingPost.externalPostId,
        error: existingPost.error,
      }
    });

  } catch (error) {
    console.error('Error getting publish status:', error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
}