import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { HashService } from '../src/auth/services/password-hasher.service';
import { PERMISSIONS } from '../src/common/constants/permissions.constants';
import { ROLES } from 'src/common/constants/roles.constants';

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

const PERMISSION_DESCRIPTIONS = {
  [PERMISSIONS.MESSAGES_SEND]: 'Send messages',
  [PERMISSIONS.MESSAGES_LIST]: 'List sent messages',
  [PERMISSIONS.METRICS_VIEW]: 'View metrics',
} as const;

const ROLE_PERMISSIONS = {
  [ROLES.USER]: [PERMISSIONS.MESSAGES_SEND, PERMISSIONS.MESSAGES_LIST],
  [ROLES.ADMIN]: [
    PERMISSIONS.MESSAGES_SEND,
    PERMISSIONS.MESSAGES_LIST,
    PERMISSIONS.METRICS_VIEW,
  ],
} as const;

function getProviders() {
  const discordWebhook = process.env.DISCORD_WEBHOOK;
  const slackWebhook = process.env.SLACK_WEBHOOK;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;

  if (!discordWebhook) throw new Error('DISCORD_WEBHOOK is required');
  if (!slackWebhook) throw new Error('SLACK_WEBHOOK is required');
  if (!telegramChatId) throw new Error('TELEGRAM_CHAT_ID is required');

  return [
    {
      name: 'discord',
      isActive: true,
      channels: [
        { name: 'testing', destination: discordWebhook, isActive: true },
      ],
    },
    {
      name: 'telegram',
      isActive: true,
      channels: [
        { name: 'testing', destination: telegramChatId, isActive: true },
      ],
    },
    {
      name: 'slack',
      isActive: true,
      channels: [
        { name: 'testing', destination: slackWebhook, isActive: true },
      ],
    },
    {
      name: 'team',
      isActive: false,
      channels: [],
    },
  ];
}

async function seedPermissions() {
  const permissions = await Promise.all(
    Object.entries(PERMISSION_DESCRIPTIONS).map(([name, description]) =>
      prisma.permission.upsert({
        where: { name },
        update: {},
        create: {
          name,
          description,
        },
      }),
    ),
  );

  return new Map(
    permissions.map((permission) => [permission.name, permission]),
  );
}

async function seedRoles() {
  const adminRole = await prisma.role.upsert({
    where: { name: ROLES.ADMIN },
    update: {},
    create: {
      name: ROLES.ADMIN,
      description: 'System administrator',
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: ROLES.USER },
    update: {},
    create: {
      name: ROLES.USER,
      description: 'Regular user',
    },
  });

  return {
    adminRole,
    userRole,
  };
}

async function seedRolePermissions(
  permissionMap: Map<
    string,
    Awaited<ReturnType<typeof prisma.permission.upsert>>
  >,
  roles: {
    adminRole: { id: number };
    userRole: { id: number };
  },
) {
  const rolePermissions = [
    ...ROLE_PERMISSIONS[ROLES.USER].map((permissionName) => ({
      roleId: roles.userRole.id,
      permissionId: permissionMap.get(permissionName)!.id,
    })),
    ...ROLE_PERMISSIONS[ROLES.ADMIN].map((permissionName) => ({
      roleId: roles.adminRole.id,
      permissionId: permissionMap.get(permissionName)!.id,
    })),
  ];

  await prisma.rolePermission.createMany({
    data: rolePermissions,
    skipDuplicates: true,
  });
}

async function seedUsers(adminRoleId: number, userRoleId: number) {
  const hashService = new HashService();

  const [adminPasswordHash, userPasswordHash] = await Promise.all([
    hashService.hash(adminPassword!),
    hashService.hash(userPassword!),
  ]);

  await prisma.user.createMany({
    data: [
      {
        username: 'admin',
        roleId: adminRoleId,
        passwordHash: adminPasswordHash,
      },
      {
        username: 'user1',
        roleId: userRoleId,
        passwordHash: userPasswordHash,
      },
    ],
    skipDuplicates: true,
  });
}

async function seedProviders() {
  const providers = getProviders();

  for (const { channels, ...providerData } of providers) {
    const provider = await prisma.messageProvider.upsert({
      where: { name: providerData.name },
      update: {},
      create: providerData,
    });

    if (channels.length > 0) {
      await Promise.all(
        channels.map((channel) =>
          prisma.providerChannel.upsert({
            where: {
              providerId_name: {
                providerId: provider.id,
                name: channel.name,
              },
            },
            update: {},
            create: {
              ...channel,
              providerId: provider.id,
            },
          }),
        ),
      );
    }
  }
}

async function main() {
  console.log('Starting database seed...');

  if (!adminPassword || !userPassword) {
    throw new Error('ADMIN_PASSWORD and USER_PASSWORD are required');
  }

  const permissionMap = await seedPermissions();

  const roles = await seedRoles();

  await seedRolePermissions(permissionMap, roles);

  await seedUsers(roles.adminRole.id, roles.userRole.id);

  await seedProviders();

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
