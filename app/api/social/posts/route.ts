import type { Request, Response } from "express";

// Mock social media connections
const mockConnections = {
  facebook: { connected: true, lastSync: new Date().toISOString() },
  instagram: { connected: true, lastSync: new Date().toISOString() },
  twitter: { connected: false, lastSync: null },
  linkedin: { connected: true, lastSync: new Date().toISOString() },
};

// Mock posts storage
let mockPosts: any[] = [
  {
    id: "post-1",
    content: "🚀 Exciting news! Our new marketing automation features are now live!",
    platforms: ["facebook", "linkedin"],
    status: "published",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    engagement: { likes: 42, shares: 18, comments: 7 }
  },
  {
    id: "post-2", 
    content: "Check out our latest case study on B2B lead generation best practices 📈",
    platforms: ["linkedin", "instagram"],
    status: "scheduled",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    scheduledFor: new Date(Date.now() + 7200000).toISOString(),
    engagement: { likes: 0, shares: 0, comments: 0 }
  }
];

export async function createSocialPost(req: Request, res: Response) {
  try {
    const { content, platforms, scheduledFor } = req.body;
    
    if (!content || !platforms || !Array.isArray(platforms)) {
      return res.status(400).json({ 
        success: false, 
        error: "Content and platforms array are required" 
      });
    }

    // Validate platforms
    const validPlatforms = Object.keys(mockConnections);
    const invalidPlatforms = platforms.filter((p: string) => !validPlatforms.includes(p));
    
    if (invalidPlatforms.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid platforms: ${invalidPlatforms.join(', ')}`
      });
    }

    // Check if platforms are connected
    const disconnectedPlatforms = platforms.filter((p: string) => !mockConnections[p as keyof typeof mockConnections].connected);
    
    if (disconnectedPlatforms.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Platforms not connected: ${disconnectedPlatforms.join(', ')}`
      });
    }

    const newPost = {
      id: `post-${Date.now()}`,
      content,
      platforms,
      status: scheduledFor ? "scheduled" : "draft",
      createdAt: new Date().toISOString(),
      scheduledFor: scheduledFor || null,
      publishedAt: null,
      engagement: { likes: 0, shares: 0, comments: 0 }
    };

    // Simulate 90% success rate
    const success = Math.random() > 0.1;
    
    if (!success) {
      return res.status(500).json({
        success: false,
        error: "Failed to create post due to platform API limitations"
      });
    }

    mockPosts.push(newPost);

    res.json({
      success: true,
      data: newPost
    });

  } catch (error) {
    console.error('Error creating social post:', error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
}

export async function getSocialPosts(req: Request, res: Response) {
  try {
    const { status, platform, limit = 10, offset = 0 } = req.query;

    let filteredPosts = [...mockPosts];

    // Filter by status
    if (status && typeof status === 'string') {
      filteredPosts = filteredPosts.filter(post => post.status === status);
    }

    // Filter by platform
    if (platform && typeof platform === 'string') {
      filteredPosts = filteredPosts.filter(post => 
        post.platforms.includes(platform)
      );
    }

    // Sort by creation date (newest first)
    filteredPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const paginatedPosts = filteredPosts.slice(
      Number(offset), 
      Number(offset) + Number(limit)
    );

    res.json({
      success: true,
      data: {
        posts: paginatedPosts,
        total: filteredPosts.length,
        connections: mockConnections
      }
    });

  } catch (error) {
    console.error('Error fetching social posts:', error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
}