import { prisma } from '@/core/lib/prisma.ts';
import { BillStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

async function main() {
   const hashedPass = await bcrypt.hash('password123', 10);

  const now = new Date();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const withinGrace = new Date(now); withinGrace.setDate(now.getDate() - 2);
  const pastGrace = new Date(now); pastGrace.setDate(now.getDate() - 5);
  const tooLate = new Date(now); tooLate.setDate(now.getDate() - 18);
  const futureDate = new Date(now); futureDate.setDate(now.getDate() + 10);
  const pastDateStrict = new Date();
  const pastDatePenalty = new Date();
  const pastDateMax = new Date();
  pastDateStrict.setDate(pastDateStrict.getDate() - 5);
  pastDatePenalty.setDate(pastDatePenalty.getDate() - 10);
  pastDateMax.setDate(pastDateMax.getDate() - 20);


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
const waterBiller = await prisma.biller.upsert({
    where: { code: 'AAWSA@' },
    update: { charges_late_fee: false, grace_period: 2, allows_partial: false },
    create: {
      name: 'AA Water Authority',
      code: 'AAWSA@',
      category: 'UTILITY',
      allows_partial: false,
      charges_late_fee: false, // <--- Key for strict block
      grace_period: 2,
      account_no: 'AA-123456'
    },
  });
  const electricBiller = await prisma.biller.upsert({
    where: { code: 'EEU@' },
    update: { charges_late_fee: true, grace_period: 0 },
    create: {
      name: 'Ethiopian Electric',
      code: 'EEU@',
      category: 'UTILITY',
      allows_partial: true,
      charges_late_fee: true, //
      grace_period: 0,
      account_no: 'EEU-7654321'
    },
  });




  const strictBiller = await prisma.biller.upsert({
    where: { code: 'STRICT_WATER' },
    update: { allows_partial: false },
    create: {
      name: 'AA Water Authority (Strict)',
      code: 'STRICT_WATER',
      allows_partial: false,
      category: 'Utility',
      account_no: 'AA-1234567'
    },
  });

  const flexibleBiller = await prisma.biller.upsert({
    where: { code: 'FLEX_ELECTRIC' },
    update: { allows_partial: true },
    create: {
      name: 'Ethiopian Electric (Flexible)',
      code: 'FLEX_ELECTRIC',
      allows_partial: true,
      category: 'Utility',
      account_no: 'EEU-7654321',
      grace_period: 5, // 5 days grace period
      charges_late_fee: true,
    },
  });


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

  const sara = await prisma.customer.upsert({
    where: { phone_no: '0933445566' }, update: {},
    create: { full_name: 'Sara Tesfaye', phone_no: '0933445566' }
  });


await prisma.bill.upsert({
    where: { bill_reference: 'STRICT-BLOCK-001' },
    update: { due_date: pastDateStrict },
    create: {
      bill_reference: 'STRICT-BLOCK-001',
      customer_id: (await prisma.customer.findFirst())?.id || "", 
      biller_id: waterBiller.id,
      amount_due: 500,
      remaining_bal: 500,
      currency: 'ETB',
      due_date: pastDateStrict,
    },
  });

  await prisma.bill.upsert({
    where: { bill_reference: 'PENALTY-TEST-010' },
    update: { due_date: pastDatePenalty },
    create: {
      bill_reference: 'PENALTY-TEST-010',
      customer_id: (await prisma.customer.findFirst())?.id || "",
      biller_id: electricBiller.id,
      amount_due: 1000,
      remaining_bal: 1000,
      currency: 'ETB',
      due_date: pastDatePenalty,
    },
  });

  await prisma.bill.upsert({
    where: { bill_reference: 'MAX-BLOCK-020' },
    update: { due_date: pastDateMax },
    create: {
      bill_reference: 'MAX-BLOCK-020',
      customer_id: (await prisma.customer.findFirst())?.id || "",
      biller_id: electricBiller.id,
      amount_due: 300,
      remaining_bal: 300,
      currency: 'ETB',
      due_date: pastDateMax,
    },
  });

  await prisma.bill.upsert({
    where: { bill_reference: 'STRICT-EXP-001' }, update: {},
    create: {
      bill_reference: 'STRICT-EXP-001',
      amount_due: 500,
      remaining_bal: 500,
      currency: 'ETB',
      due_date: new Date('2026-01-01'), 
      customer_id: chala.id,
      biller_id: strictBiller.id,
    },
  });
  await prisma.bill.upsert({
    where: { bill_reference: 'STRICT-EXP-1' }, update: {},
    create: {
      bill_reference: 'STRICT-EXP-1',
      amount_due: 650,
      remaining_bal: 650,
      currency: 'ETB',
      due_date: withinGrace, 
      customer_id: chala.id,
      biller_id: strictBiller.id,
    },
  });
  
  await prisma.bill.upsert({
    where: { bill_reference: 'PARTIAL-001' }, update: {},
    create: {
      bill_reference: 'PARTIAL-001',
      amount_due: 1200,
      remaining_bal: 1200,
      currency: 'ETB',
      due_date: new Date('2026-03-20'), 
      customer_id: abebe.id,
      biller_id: flexibleBiller.id,
    },
  });
  await prisma.bill.upsert({
    where: { bill_reference: 'PARTIAL-1' }, update: {},
    create: {
      bill_reference: 'PARTIAL-1',
      amount_due: 1200,
      remaining_bal: 1200,
      currency: 'ETB',
      due_date: yesterday, 
      customer_id: abebe.id,
      biller_id: flexibleBiller.id,
    },
  });
  await prisma.bill.upsert({
    where: { bill_reference: 'PARTIAL-011' }, update: {},
    create: {
      bill_reference: 'PARTIAL-011',
      amount_due: 1200,
      remaining_bal: 1200,
      currency: 'ETB',
      due_date: new Date('2026-04-20'), 
      customer_id: abebe.id,
      biller_id: flexibleBiller.id,
    },
  });
  await prisma.bill.upsert({
    where: { bill_reference: 'PARTIAL-021' }, update: {},
    create: {
      bill_reference: 'PARTIAL-021',
      amount_due: 600,
      remaining_bal: 600,
      currency: 'ETB',
      due_date: new Date('2026-04-15'), 
      customer_id: abebe.id,
      biller_id: flexibleBiller.id,
    },
  });
  

  await prisma.bill.upsert({
    where: { bill_reference: 'STANDARD-001' }, update: {},
    create: {
      bill_reference: 'STANDARD-001',
      amount_due: 300,
      remaining_bal: 300,
      currency: 'ETB',
      due_date: new Date('2026-03-10'),
      customer_id: sara.id,
      biller_id: flexibleBiller.id, 
    },
  });
  await prisma.bill.upsert({
    where: { bill_reference: 'bill-7@' }, update: {},
    create: {
      bill_reference: 'bill-7@',
      amount_due: 300,
      remaining_bal: 300,
      currency: 'ETB',
      due_date: tooLate,
      customer_id: sara.id,
      biller_id: electricBiller.id, 
    },
  });



  await prisma.bill.upsert({
    where: { bill_reference: 'REF-STRICT-01' }, update: {},
    create: { bill_reference: 'REF-STRICT-01', 
      amount_due: 1000, remaining_bal: 1000, 
      due_date: yesterday, biller_id: isp.id,
       customer_id: abebe.id }
  });
  await prisma.bill.upsert({
    where: { bill_reference: 'REF-STRICT-010' }, update: {},
    create: { bill_reference: 'REF-STRICT-010', 
      amount_due: 600, remaining_bal: 600, 
      due_date: tooLate, biller_id: isp.id,
       customer_id: chala.id }
  });
  await prisma.bill.upsert({
    where: { bill_reference: 'REF-GRACE-OK' }, update: {},
    create: { bill_reference: 'REF-GRACE-OK',
       amount_due: 3500, 
       remaining_bal: 3500, 
       due_date: withinGrace, 
       biller_id: etc.id, 
       customer_id: chala.id }
  });
  await prisma.bill.upsert({
    where: { bill_reference: 'REF-G' }, update: {},
    create: { bill_reference: 'REF-G',
       amount_due: 500, 
       remaining_bal: 500, 
       due_date: withinGrace, 
       biller_id: flexibleBiller.id, 
       customer_id: chala.id }
  });

  await prisma.bill.upsert({
    where: { bill_reference: 'bill-3' }, update: {},
    create: { bill_reference: 'bill-3',
       amount_due: 300, 
       remaining_bal: 300, 
       due_date: withinGrace, 
       biller_id: etc.id, 
       customer_id: chala.id }
  });
  await prisma.bill.upsert({
    where: { bill_reference: 'bill-4' }, update: {},
    create: { bill_reference: 'bill-4',
       amount_due: 300, 
       remaining_bal: 300, 
       due_date: withinGrace, 
       biller_id: strictBiller.id, 
       customer_id: chala.id }
  });
  await prisma.bill.upsert({
    where: { bill_reference: 'bill-3' }, update: {},
    create: { bill_reference: 'bill-3',
       amount_due: 300, 
       remaining_bal: 300, 
       due_date: withinGrace, 
       biller_id: etc.id, 
       customer_id: chala.id }
  });
  await prisma.bill.upsert({
    where: { bill_reference: 'REF-GRACE-OK1' }, update: {},
    create: { bill_reference: 'REF-GRACE-OK1',
       amount_due: 500, 
       remaining_bal: 500, 
       due_date: withinGrace, 
       biller_id: water.id, 
       customer_id: chala.id }
  });

  await prisma.bill.upsert({
    where: { bill_reference: 'REF-GRACE' }, update: {},
    create: { bill_reference: 'REF-GRACE',
       amount_due: 500, 
       remaining_bal: 500, 
       due_date: withinGrace, 
       biller_id: etc.id, 
       customer_id: chala.id }
  });
  await prisma.bill.upsert({
    where: { bill_reference: 'REF-23' }, update: {},
    create: { bill_reference: 'REF-23',
       amount_due: 5100, 
       remaining_bal: 5100, 
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
    where: { bill_reference: 'REF-PENALTY' }, update: {},
    create: { bill_reference: 'REF-PENALTY',
       amount_due: 550,
       remaining_bal: 550,
        due_date: pastGrace,
         biller_id: electric.id, 
         customer_id: abebe.id }
         });


  await prisma.bill.upsert({
    where: { bill_reference: 'REF-P' }, update: {},
    create: { bill_reference: 'REF-P',
       amount_due: 7500,
       remaining_bal: 7500,
        due_date: pastGrace,
         biller_id: etc.id, 
         customer_id: abebe.id }
  });
  await prisma.bill.upsert({
    where: { bill_reference: 'REF-Pe' }, update: {},
    create: { bill_reference: 'REF-Pe',
       amount_due: 700,
       remaining_bal: 700,
        due_date: pastGrace,
         biller_id: etc.id, 
         customer_id: abebe.id }
  });
  await prisma.bill.upsert({
    where: { bill_reference: 'REF-Pe1' }, update: {},
    create: { bill_reference: 'REF-Pe1',
       amount_due: 300,
       remaining_bal: 300,
        due_date: pastGrace,
         biller_id: etc.id, 
         customer_id: abebe.id }
  });

  await prisma.bill.upsert({
    where: { bill_reference: 'REF-5' }, update: {},
    create: { bill_reference: 'REF-5',
       amount_due: 7500,
       remaining_bal: 7500,
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
  await prisma.bill.upsert({
    where: { bill_reference: 'BILL-FUTURE1' }, update: {},
    create: { bill_reference: 'BILL-FUTURE1', 
      amount_due: 300, remaining_bal: 300, 
      status: BillStatus.UNPAID, due_date: futureDate, 
      customer_id: abebe.id, 
      biller_id: electric.id }
  });
  await prisma.bill.upsert({
    where: { bill_reference: 'BILL-123' }, update: {},
    create: { bill_reference: 'BILL-123', 
      amount_due: 4000, remaining_bal: 4000, 
      status: BillStatus.UNPAID, due_date: pastGrace, 
      customer_id: abebe.id, 
      biller_id: electric.id }
  });
  await prisma.bill.upsert({
    where: { bill_reference: 'BILL-345' }, update: {},
    create: { bill_reference: 'BILL-345', 
      amount_due: 400, remaining_bal: 400, 
      status: BillStatus.UNPAID, due_date: withinGrace, 
      customer_id: abebe.id, 
      biller_id: electric.id }
  });
  await prisma.bill.upsert({
    where: { bill_reference: 'BILL-567' }, update: {},
    create: { bill_reference: 'BILL-567', 
      amount_due: 450, remaining_bal: 450, 
      status: BillStatus.UNPAID, due_date: pastGrace, 
      customer_id: abebe.id, 
      biller_id: isp.id }
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
  await prisma.bill.upsert({
    where: { bill_reference: 'BILL-DSTV-00' }, update: {},
    create: { bill_reference: 'BILL-DSTV-00', 
      amount_due: 1200, remaining_bal: 2200, 
      status: BillStatus.UNPAID, due_date: tomorrow,
       customer_id: sara.id,
        biller_id: dstv.id }
      
  });

  await prisma.bill.upsert({
    where: { bill_reference: 'BILL-DSTV-02' }, update: {},
    create: { bill_reference: 'BILL-DSTV-02', 
      amount_due: 2200, remaining_bal: 2200, 
      status: BillStatus.UNPAID, due_date: pastGrace,
       customer_id: sara.id,
        biller_id: dstv.id }
  });
  await prisma.bill.upsert({
    where: { bill_reference: 'BILL-DSTV-03' }, update: {},
    create: { bill_reference: 'BILL-DSTV-03', 
      amount_due: 3200, remaining_bal: 3200, 
      status: BillStatus.UNPAID, due_date: withinGrace,
       customer_id: sara.id,
        biller_id: dstv.id }
  });
  const extraBills = [
    { ref: 'SEARCH-TEST-01', amt: 500 },
    { ref: 'SEARCH-TEST-02', amt: 1500 },
    { ref: 'SEARCH-TEST-03', amt: 2500 },
    { ref: 'SEARCH-TEST-04', amt: 3500 },
  ];

  for (const eb of extraBills) {
    await prisma.bill.upsert({
      where: { bill_reference: eb.ref },
      update: {},
      create: {
        bill_reference: eb.ref,
        amount_due: eb.amt,
        remaining_bal: eb.amt,
        status: BillStatus.UNPAID,
        due_date: futureDate,
        customer_id: sara.id,
        biller_id: dstv.id
      }
    });
  }




  // users
 await prisma.user.upsert({
    where: { email: 'admin@derash.com' },
    update: {},
    create: {
      name: 'Derash Administrator',
      email: 'admin@derash.com',
      password: hashedPass,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  // Biller Admin (DSTV Staff)
  await prisma.user.upsert({
    where: { email: 'biller@dstv.com' },
    update: {},
    create: {
      name: 'DSTV Manager',
      email: 'biller@dstv.com',
      password: hashedPass,
      role: 'BILLER_ADMIN',
      isActive: true,
      biller_id: dstv.id, // Linking to the DSTV biller created above
    },
  });

  // Agent User (CBE Bank Teller)
  await prisma.user.upsert({
    where: { email: 'agent@cbe.com' },
    update: {},
    create: {
      name: 'CBE Teller 01',
      email: 'agent@cbe.com',
      password: hashedPass,
      role: 'AGENT_USER',
      isActive: true,
      agent_id: cbe.id, // Linking to the CBE agent created above
    },
  });
  await prisma.user.upsert({
    where: { email: 'agent@telebirr.com' },
    update: {},
    create: {
      name: 'Telebirr Agent 01',
      email: 'agent@telebirr.com',
      password: hashedPass,
      role: 'AGENT_USER',
      isActive: true,
      agent_id: telebirr.id, // Linking to the Telebirr agent created above
    },
  });
  await prisma.user.upsert({
    where: { email: 'agent@dashen.com' },
    update: {},
    create: {
      name: 'Dashen Agent 01',
      email: 'agent@dashen.com',
      password: hashedPass,
      role: 'AGENT_USER',
      isActive: true,
      agent_id: dashen.id, // Linking to the Dashen agent created above
    },
  });

  console.log("✅ Database seeded successfully with existing and new data!");
}

main()
  .catch((e) => { console.error("Seeding Error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });