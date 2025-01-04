import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error', 'warn'],
    errorFormat: 'pretty',
  });
} else {
  if (!(global as any).prisma) {
    (global as any).prisma = new PrismaClient({
      log: ['error', 'warn'],
      errorFormat: 'pretty',
    });
  }
  prisma = (global as any).prisma;
}

// Ensure proper cleanup on application shutdown
process.on('beforeExit', async () => {
  console.log('Disconnecting from database...');
  try {
    await prisma.$disconnect();
    console.log('Successfully disconnected from database');
  } catch (err) {
    console.error('Error disconnecting from database:', err);
  }
});

export default prisma; 