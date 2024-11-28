import { prisma } from '@/lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { providerId } = req.query;

  switch (req.method) {
    case 'GET':
      // Get all compensation changes for a provider
      const changes = await prisma.compensationChange.findMany({
        where: { providerId: String(providerId) },
        orderBy: { effectiveDate: 'desc' }
      });
      return res.json(changes);

    case 'POST':
      // Create a new compensation change
      const newChange = await prisma.compensationChange.create({
        data: {
          ...req.body,
          providerId: String(providerId)
        }
      });
      return res.json(newChange);

    case 'PUT':
      // Update an existing compensation change
      const { id, ...updateData } = req.body;
      const updatedChange = await prisma.compensationChange.update({
        where: { id },
        data: updateData
      });
      return res.json(updatedChange);

    case 'DELETE':
      // Delete a compensation change
      const { id: deleteId } = req.body;
      await prisma.compensationChange.delete({
        where: { id: deleteId }
      });
      return res.status(204).end();

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 