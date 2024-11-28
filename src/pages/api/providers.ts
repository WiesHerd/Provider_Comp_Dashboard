import { prisma } from '@/lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        const providers = await prisma.provider.findMany({
          orderBy: { lastName: 'asc' }
        });
        return res.json(providers);

      case 'POST':
        const newProvider = await prisma.provider.create({
          data: req.body
        });
        return res.json(newProvider);

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
} 