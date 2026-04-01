import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt"; // Or whatever you use for hashing

const prisma = new PrismaClient();

async function main() {
  // 1. Create a Hashed Password for the Admin
  const hashedPassword = await bcrypt.hash("admin123", 10);

  // 2. Create the Admin User
  const admin = await prisma.user.upsert({
    where: { email: "admin@derash.com" },
    update: {},
    create: {
      email: "admin@derash.com",
      password: hashedPassword,
      fullName: "System Admin",
      role: "ADMIN", // Ensure this matches your Enum in schema.prisma
    },
  });

  // 3. Create a Sample Biller
  await prisma.biller.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Ethiopian Electric Utility",
      category: "Utility",
      accountNumber: "EEU-001",
    },
  });

  console.log("✅ Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
