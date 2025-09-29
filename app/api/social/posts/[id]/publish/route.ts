import type { Request, Response } from "express";

// This would be imported from the main route file in a real implementation  
let mockPosts: any[] = [];

export async function publishSocialPost(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Find the post
    const postIndex = mockPosts.findIndex(post => post.id === id);
    
    if (postIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Post not found"
      });
    }

    const post = mockPosts[postIndex];

    // Check if post is already published
    if (post.status === "published") {
      return res.status(400).json({
        success: false,
        error: "Post is already published"
      });
    }

    // Simulate 90% success rate
    const success = Math.random() > 0.1;
    
    if (!success) {
      return res.status(500).json({
        success: false,
        error: "Failed to publish post due to platform API limitations"
      });
    }

    // Simulate publishing to each platform
    const publishResults = post.platforms.map((platform: string) => {
      const platformSuccess = Math.random() > 0.05; // 95% success per platform
      return {
        platform,
        success: platformSuccess,
        error: platformSuccess ? null : `Failed to publish to ${platform}`,
        postId: platformSuccess ? `${platform}_${Date.now()}` : null
      };
    });

    // Update the post
    const hasAnySuccess = publishResults.some((result: any) => result.success);
    
    mockPosts[postIndex] = {
      ...post,
      status: hasAnySuccess ? "published" : "failed",
      publishedAt: hasAnySuccess ? new Date().toISOString() : null,
      publishResults,
      updatedAt: new Date().toISOString(),
      // Simulate some initial engagement
      engagement: hasAnySuccess ? {
        likes: Math.floor(Math.random() * 50),
        shares: Math.floor(Math.random() * 20),
        comments: Math.floor(Math.random() * 15)
      } : post.engagement
    };

    res.json({
      success: hasAnySuccess,
      data: mockPosts[postIndex],
      publishResults
    });

  } catch (error) {
    console.error('Error publishing social post:', error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
}

export async function getPublishStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Find the post
    const post = mockPosts.find(post => post.id === id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found"
      });
    }

    // Return publish status and analytics
    const status = {
      postId: post.id,
      status: post.status,
      publishedAt: post.publishedAt,
      publishResults: post.publishResults || [],
      engagement: post.engagement || { likes: 0, shares: 0, comments: 0 },
      platforms: post.platforms
    };

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Error fetching publish status:', error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
}