import { prisma } from '@/lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        const changes = await prisma.compensationChange.findMany({
          orderBy: { effectiveDate: 'desc' }
        });
        return res.json(changes);

      case 'POST':
        const newChange = await prisma.compensationChange.create({
          data: req.body
        });
        return res.json(newChange);

      case 'DELETE':
        const { id } = req.query;
        await prisma.compensationChange.delete({
          where: { id: String(id) }
        });
        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
} 