import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Cleaning database...");

  // 1. Delete in order (Children first, then parents) to avoid foreign key errors
  await prisma.refreshToken.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.user.deleteMany();
  await prisma.biller.deleteMany();
  await prisma.agent.deleteMany();

  const hashedPassword = await bcrypt.hash("Password123!", 10);

  // 2. Create Biller (Organization)
  console.log("🏢 Creating Biller...");
  const eeu = await prisma.biller.create({
    data: {
      name: "Ethiopian Electric Utility",
      code: "EEU",
      category: "UTILITY",
      allowsPartial: false,
      isDeleted: false, // 🛡️ Important for our new Soft Delete logic
    },
  });

  // 3. Create Agent (Organization)
  console.log("🏦 Creating Agent...");
  const cbe = await prisma.agent.create({
    data: {
      name: "Commercial Bank of Ethiopia",
      code: "CBE",
      isEnabled: true,
      isDeleted: false,
    },
  });

  // 4. Create System Admin
  console.log("👤 Creating System Admin...");
  await prisma.user.create({
    data: {
      fullName: "System Admin",
      email: "admin@derash.com",
      passwordHash: hashedPassword,
      role: "SYSTEM_ADMIN",
      isDeleted: false,
    },
  });

  // 5. Create Biller Admin (linked to EEU)
  console.log("👤 Creating Biller User...");
  await prisma.user.create({
    data: {
      fullName: "EEU Manager",
      email: "eeu@admin.com",
      passwordHash: hashedPassword,
      role: "BILLER_USER",
      billerId: eeu.id,
      isDeleted: false,
    },
  });

  // 6. Create Agent Admin (linked to CBE)
  console.log("👤 Creating Agent User...");
  await prisma.user.create({
    data: {
      fullName: "CBE Teller Manager",
      email: "cbe@admin.com",
      passwordHash: hashedPassword,
      role: "AGENT_USER",
      agentId: cbe.id,
      isDeleted: false,
    },
  });

  console.log(" Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
