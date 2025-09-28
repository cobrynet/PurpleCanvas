import { prisma } from '@/lib/prisma';

export async function POST(request: any) {
  try {
    const body = request.body || {};
    
    // Mock asset data
    const mockAsset = {
      organizationId: body.organizationId || 'mock-org-id',
      type: 'IMAGE' as const,
      mimeType: body.mimeType || 'image/jpeg',
      sizeBytes: body.sizeBytes || 1024000,
      width: body.width || 800,
      height: body.height || 600,
      checksumSha256: body.checksumSha256 || `mock-checksum-${Date.now()}`,
      url: body.url || `https://mock-storage.example.com/assets/${Date.now()}.jpg`,
      thumbUrl: `https://mock-storage.example.com/thumbnails/${Date.now()}_thumb.jpg`,
      title: body.title || 'Mock Asset',
      tags: body.tags || ['mock', 'upload'],
      folder: body.folder || 'uploads',
      ownerId: body.ownerId || 'mock-user-id'
    };

    // Save asset using Prisma
    const asset = await prisma.asset.create({
      data: mockAsset
    });

    return {
      success: true,
      asset: {
        id: asset.id,
        url: asset.url,
        type: asset.type,
        title: asset.title,
        createdAt: asset.createdAt
      }
    };
  } catch (error) {
    console.error('Error completing upload:', error);
    
    return {
      error: 'Failed to complete upload'
    };
  }
}