import { prisma } from '@/infrastructure/database/prisma.ts';
import bcrypt from 'bcrypt';

async function main() {
  const saltRounds = 10;
  const commonPassword = await bcrypt.hash('password123', saltRounds);

  console.log('🌱 Starting Seed...');

  // 1. Create Super Admin (To manage the whole system)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@derash.com' },
    update: {},
    create: {
      email: 'admin@derash.com',
      name: 'SUPER_ADMIN',
      password: commonPassword,
      role: 'SUPER_ADMIN',
    },
  });

  // 2. Create a Biller Organization (e.g., Water & Sewerage)
  const waterBiller = await prisma.biller.upsert({
    where: { code: 'AAWSA' },
    update: {},
    create: {
      name: 'Addis Ababa Water Authority',
      code: 'AAWSA',
      category: 'UTILITY',
      account_no: '1000123456789',
      allows_partial: true,
      isActive: true,
      grace_period: 5,
    },
  });

  // 3. Create a Biller User (The person who will log in to upload the CSV)
  await prisma.user.upsert({
    where: { email: 'biller@aawsa.com' },
    update: {},
    create: {
      email: 'biller@aawsa.com',
      name: 'AAWSA Manager',
      password: commonPassword,
      role: 'BILLER_ADMIN',
      biller_id: waterBiller.id, // Linking the user to the biller
    },
  });

  // 4. Create an Agent (e.g., A bank or a kiosk)
  const bankAgent = await prisma.agent.upsert({
    where: { code: 'CBE_AGENT' },
    update: {},
    create: {
      name: 'Commercial Bank Agent',
      code: 'CBE_AGENT',
      api_key: 'CBE_SECRET_KEY', // In production, use a secure random key and store in env variables
      isActive: true,
    },
  });

  // 5. Create an Agent User (The person at the kiosk who collects payment)
  await prisma.user.upsert({
    where: { email: 'agent@cbe.com' },
    update: {},
    create: {
      email: 'agent@cbe.com',
      name: 'CBE Teller',
      password: commonPassword,
      role: 'AGENT_USER',
      agent_id: bankAgent.id, // Linking the user to the agent
    },
  });

  console.log(`
  ✅ Seed Successful!
  -----------------------------------------------
  Super Admin: admin@derash.com / password123
  Biller User: biller@aawsa.com / password123
  Agent User:  agent@cbe.com  / password123
  -----------------------------------------------
  `);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });