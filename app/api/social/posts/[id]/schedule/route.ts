import type { Request, Response } from "express";

// This would be imported from the main route file in a real implementation
let mockPosts: any[] = [];

export async function scheduleSocialPost(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { scheduledFor } = req.body;

    if (!scheduledFor) {
      return res.status(400).json({
        success: false,
        error: "scheduledFor date is required"
      });
    }

    // Validate date format
    const scheduleDate = new Date(scheduledFor);
    if (isNaN(scheduleDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: "Invalid date format"
      });
    }

    // Check if date is in the future
    if (scheduleDate <= new Date()) {
      return res.status(400).json({
        success: false,
        error: "Scheduled date must be in the future"
      });
    }

    // Find the post
    const postIndex = mockPosts.findIndex(post => post.id === id);
    
    if (postIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Post not found"
      });
    }

    const post = mockPosts[postIndex];

    // Check if post can be scheduled
    if (post.status === "published") {
      return res.status(400).json({
        success: false,
        error: "Cannot schedule a post that has already been published"
      });
    }

    // Simulate 90% success rate
    const success = Math.random() > 0.1;
    
    if (!success) {
      return res.status(500).json({
        success: false,
        error: "Failed to schedule post due to platform API limitations"
      });
    }

    // Update the post
    mockPosts[postIndex] = {
      ...post,
      status: "scheduled",
      scheduledFor: scheduledFor,
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: mockPosts[postIndex]
    });

  } catch (error) {
    console.error('Error scheduling social post:', error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
}

export async function unscheduleSocialPost(req: Request, res: Response) {
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

    // Check if post is scheduled
    if (post.status !== "scheduled") {
      return res.status(400).json({
        success: false,
        error: "Post is not scheduled"
      });
    }

    // Simulate 95% success rate for unscheduling
    const success = Math.random() > 0.05;
    
    if (!success) {
      return res.status(500).json({
        success: false,
        error: "Failed to unschedule post"
      });
    }

    // Update the post
    mockPosts[postIndex] = {
      ...post,
      status: "draft",
      scheduledFor: null,
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: mockPosts[postIndex]
    });

  } catch (error) {
    console.error('Error unscheduling social post:', error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
}