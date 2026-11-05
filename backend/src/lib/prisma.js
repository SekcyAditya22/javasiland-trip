import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.__javaIslandPrisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.__javaIslandPrisma = prisma;

export async function disconnectPrisma() {
  await prisma.$disconnect();
}
