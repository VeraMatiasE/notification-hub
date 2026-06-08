import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient, Role } from '../src/generated/prisma/client';
import { HashService } from '../src/auth/services/password-hasher.service';

const databaseUrl = process.env.DATABASE_URL;
const adminPassword = process.env.ADMIN_PASSWORD;
const userPassword = process.env.USER_PASSWORD;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const pool = new Pool({
  connectionString: databaseUrl,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting database seed...');

  if (!adminPassword || !userPassword) {
    throw new Error('ADMIN_PASSWORD and USER_PASSWORD are required');
  }

  const hashService = new HashService();
  const [adminPasswordHash, userPasswordHash] = await Promise.all([
    hashService.hash(adminPassword),
    hashService.hash(userPassword),
  ]);

  const users = [
    {
      username: 'admin',
      role: Role.ADMIN,
      passwordHash: adminPasswordHash,
    },
    {
      username: 'user1',
      role: Role.USER,
      passwordHash: userPasswordHash,
    },
  ];

  const providers = [
    {
      name: 'discord',
      isActive: true,
    },
    {
      name: 'telegram',
      isActive: true,
    },
    {
      name: 'slack',
      isActive: true,
    },
    {
      name: 'team',
      isActive: false,
    },
  ];

  await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  });

  await prisma.messageProvider.createMany({
    data: providers,
    skipDuplicates: true,
  });

  console.log('Database seeded successfully');
}
main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
