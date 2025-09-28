import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const count = await prisma.organization.count();
    
    return {
      ok: true,
      count
    };
  } catch (error) {
    console.error('Health check failed:', error);
    
    return {
      ok: false,
      count: 0
    };
  }
}