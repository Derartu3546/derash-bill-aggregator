import dotenv from "dotenv";
import { prisma } from "../config/prisma";
import * as bcrypt from "bcrypt";
import { BillStatus } from "@prisma/client"; // Ensuring the enum is correctly imported
dotenv.config();

async function main() {
  console.log("Cleaning database...");

  // 1. Delete in order (Children first, then parents) to avoid foreign key errors
  await prisma.notification.deleteMany(); // 💡 ADDED THIS FIRST to clear user dependencies!
  await prisma.transaction.deleteMany(); 
  await prisma.refreshToken.deleteMany();
  await prisma.bill.deleteMany();        
  await prisma.customer.deleteMany();    
  await prisma.user.deleteMany();         // 🔑 Now safe to drop users!
  await prisma.biller.deleteMany();
  await prisma.agent.deleteMany();

  const hashedPassword = await bcrypt.hash("Password", 10);
  

  // 2. Create Biller (Organization)
  console.log("🏢 Creating Biller...");
  const eeu = await prisma.biller.create({
    data: {
      name: "Ethiopian Electric Utility",
      code: "EEU",
      category: "UTILITY",
      allowsPartial: false,
      isDeleted: false, 
    },
  });

  // 3. Create Agent (Organization)
  console.log("🏦 Creating Agent...");
  const cbe = await prisma.agent.create({
    data: {
      name: "Commercial Bank of Ethiopia",
      code: "CBE",
      apiKey : "CBE-API-KEY-123456",
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

  // 7. Create Customers Individually to grab their generated IDs for relation linking
  console.log("👥 Seeding customers...");
  const abebe = await prisma.customer.create({
    data: {
      fullName: "Abebe Bikila",
      email: "abebe@gmail.com",
      phoneNo: "+251911223344",
      isActive: true,
    },
  });

  const aster = await prisma.customer.create({
    data: {
      fullName: "Aster Aweke",
      email: "aster@gmail.com",
      phoneNo: "+251912556677",
      isActive: true,
    },
  });

  const chala = await prisma.customer.create({
    data: {
      fullName: "Chala Kebede",
      email: "chala@gmail.com",
      phoneNo: "+251913889900",
      isActive: true,
    },
  });

  // 8. Create Sample Bills linked strictly to the precise Schema Rules
  console.log("🧾 Seeding sample bills...");
  await prisma.bill.createMany({
    data: [
      {
        billReference: "EEU-REF-1001",
        customerName: abebe.fullName,
        amount: 450.50,
        amountPaid: 0.00,
        remainingBalance: 450.50,
        currency: "ETB",
        dueDate: new Date("2026-06-15"),
        status: BillStatus.UNPAID,
        period: "2026-05",
        billerId: eeu.id,
        customerId: abebe.id,
        phoneNumber: abebe.phoneNo,
        isDeleted: false,
      },
      {
        billReference: "EEU-REF-1002",
        customerName: aster.fullName,
        amount: 1200.00,
        amountPaid: 0.00,
        remainingBalance: 1200.00,
        currency: "ETB",
        dueDate: new Date("2026-06-20"),
        status: BillStatus.UNPAID,
        period: "2026-05",
        billerId: eeu.id,
        customerId: aster.id,
        phoneNumber: aster.phoneNo,
        isDeleted: false,
      },
      {
        billReference: "EEU-REF-1003",
        customerName: chala.fullName,
        amount: 280.75,
        amountPaid: 280.75,
        remainingBalance: 0.00,
        currency: "ETB",
        dueDate: new Date("2026-05-10"),
        paidAt: new Date(),
        status: BillStatus.PAID,
        period: "2026-04",
        billerId: eeu.id,
        customerId: chala.id,
        phoneNumber: chala.phoneNo,
        isDeleted: false,
      }
    ]
  });

  console.log("🎉 Seeding finished successfully based on the unified schema!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });