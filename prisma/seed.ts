import { prisma } from '@/core/lib/prisma.ts';
import { BillStatus } from '@prisma/client';

async function main() {
  // --- 1. DATE HELPERS ---
  const now = new Date();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const withinGrace = new Date(now); withinGrace.setDate(now.getDate() - 2);
  const pastGrace = new Date(now); pastGrace.setDate(now.getDate() - 5);
  const tooLate = new Date(now); tooLate.setDate(now.getDate() - 18);
  const futureDate = new Date(now); futureDate.setDate(now.getDate() + 10);

  // --- 2. AGENTS ---
  const telebirr = await prisma.agent.upsert({
    where: { code: 'TELEBIRR' }, update: {},
    create: { name: 'Telebirr', code: 'TELEBIRR', api_key: 'tele-secret-123' }
  });
  const cbe = await prisma.agent.upsert({
    where: { code: 'CBE' }, update: {},
    create: { name: 'Commercial Bank of Ethiopia', code: 'CBE', api_key: 'cbe-secret-456' }
  });
  const awash = await prisma.agent.upsert({
    where: { code: 'AWASH' }, update: {},
    create: { name: 'Awash Bank', code: 'AWASH', api_key: 'awash-secret-789' }
  });
  // NEW DATA
  const dashen = await prisma.agent.upsert({
    where: { code: 'DASHEN' }, update: {},
    create: { name: 'Dashen Bank', code: 'DASHEN', api_key: 'dash-secret-000' }
  });

  // --- 3. BILLERS ---
  const water = await prisma.biller.upsert({
    where: { code: 'AAWSA' }, update: {},
    create: { name: 'AA Water Authority', code: 'AAWSA', allows_partial: true, category: 'UTILITY', account_no: 'AA-123456' }
  });
  const electric = await prisma.biller.upsert({
    where: { code: 'EEU' }, update: {},
    create: { name: 'Ethiopian Electric Utility', code: 'EEU', allows_partial: false, category: 'UTILITY', account_no: 'EEU-789012' }
  });
  const etc = await prisma.biller.upsert({
    where: { code: 'ETC' }, update: {},
    create: { name: 'Ethio Telecom', code: 'ETC', category: 'TELECOM', grace_period: 3, charges_late_fee: true, account_no: 'ETC-345678' }
  });
  const isp = await prisma.biller.upsert({
    where: { code: 'STRICT_ISP' }, update: {},
    create: { name: 'Strict Internet Provider', code: 'STRICT_ISP', category: 'INTERNET', charges_late_fee: false, account_no: 'STRICT_ISP-901234' }
  });
  // NEW DATA
  const dstv = await prisma.biller.upsert({
    where: { code: 'DSTV' }, update: {},
    create: { name: 'DSTV Ethiopia', code: 'DSTV', category: 'ENTERTAINMENT', allows_partial: false, account_no: 'DSTV-555' }
  });

  // --- 4. CUSTOMERS ---
  const abebe = await prisma.customer.upsert({
    where: { phone_no: '0911223344' }, update: {},
    create: { full_name: 'Abebe Kebede', phone_no: '0911223344' }
  });
  const chala = await prisma.customer.upsert({
    where: { phone_no: '0922334455' }, update: {},
    create: { full_name: 'Chala Tadesse', phone_no: '0922334455' }
  });
  // NEW DATA
  const sara = await prisma.customer.upsert({
    where: { phone_no: '0933445566' }, update: {},
    create: { full_name: 'Sara Tesfaye', phone_no: '0933445566' }
  });

  // --- 5. BILLS ---
  await prisma.bill.upsert({
    where: { bill_reference: 'REF-STRICT-01' }, update: {},
    create: { bill_reference: 'REF-STRICT-01', amount_due: 1000, remaining_bal: 1000, due_date: yesterday, biller_id: isp.id, customer_id: abebe.id }
  });
  await prisma.bill.upsert({
    where: { bill_reference: 'REF-GRACE-OK' }, update: {},
    create: { bill_reference: 'REF-GRACE-OK',
       amount_due: 500, 
       remaining_bal: 500, 
       due_date: withinGrace, 
       biller_id: etc.id, 
       customer_id: chala.id }
  });
  await prisma.bill.upsert({
    where: { bill_reference: 'REF-PENALTY-ACTUAL' }, update: {},
    create: { bill_reference: 'REF-PENALTY-ACTUAL',
       amount_due: 750,
       remaining_bal: 750,
        due_date: pastGrace,
         biller_id: etc.id, 
         customer_id: abebe.id }
  });
  await prisma.bill.upsert({
    where: { bill_reference: 'BILL-PAID-001' }, update: {},
    create: { bill_reference: 'BILL-PAID-001',
       amount_due: 2000, 
       remaining_bal: 2000,
        status: BillStatus.PAID,
         due_date: new Date('2026-03-22'), 
         customer_id: chala.id, biller_id: 
         water.id, paid_at: new Date() }
  });
  await prisma.bill.upsert({
    where: { bill_reference: 'BILL-FUTURE' }, update: {},
    create: { bill_reference: 'BILL-FUTURE', 
      amount_due: 3000, remaining_bal: 3000, 
      status: BillStatus.UNPAID, due_date: futureDate, 
      customer_id: abebe.id, 
      biller_id: electric.id }
  });
  // NEW DATA
  await prisma.bill.upsert({
    where: { bill_reference: 'BILL-DSTV-01' }, update: {},
    create: { bill_reference: 'BILL-DSTV-01', 
      amount_due: 1200, remaining_bal: 1200, 
      status: BillStatus.UNPAID, due_date: tomorrow,
       customer_id: sara.id,
        biller_id: dstv.id }
  });

  console.log("✅ Database seeded successfully with existing and new data!");
}

main()
  .catch((e) => { console.error("Seeding Error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });