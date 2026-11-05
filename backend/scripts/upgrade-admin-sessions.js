import { prisma } from '../src/lib/prisma.js';
import { sessionDigest } from '../src/lib/sessions.js';

try {
  const legacy = await prisma.adminSession.findMany({
    where: { NOT: { token: { startsWith: 'sha256:' } } },
    select: { token: true },
  });
  let upgraded = 0;
  for (const { token } of legacy) {
    if (!/^[a-f0-9]{64}$/.test(token)) continue;
    try {
      upgraded += (
        await prisma.adminSession.updateMany({
          where: { token },
          data: { token: sessionDigest(token) },
        })
      ).count;
    } catch (error) {
      if (error.code !== 'P2002') throw error;
    }
  }
  console.log(
    `Upgraded ${upgraded} existing admin session(s) without changing cookies.`,
  );
} finally {
  await prisma.$disconnect();
}
