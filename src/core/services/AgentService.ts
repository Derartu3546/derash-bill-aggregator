import { prisma } from '../lib/prisma.ts';
import { BillStatus, PaymentMethod, TransactionStatus } from '@prisma/client';
import { BillingEngine } from '@/core/utils/BillingEngine.ts'; // Adjust path as needed

export class AgentService {
  async inquiry(bill_reference: string, agent_code: string) {
    try {
   console.log(`Inquiry Started: Ref=${bill_reference}, Agent=${agent_code}`);

      const agent = await prisma.agent.findUnique({ where: { code: agent_code } });
      if (!agent) {
        console.log(" Agent Not Found in DB");
        throw new Error("Invalid Agent Code");
      }

      const bill = await prisma.bill.findUnique({
        where: { bill_reference },
        include: { biller: true, customer: true }
      });

      if (!bill || bill.status === BillStatus.PAID) {
        console.log(" Bill Not Found or Already Paid");
        throw new Error("No unpaid bill found with the provided reference.");
      };

      const calc = BillingEngine.calculate(bill);

     let warningMessage = calc.blockReason || null;
      if (!warningMessage && calc.isWithinGracePeriod) {
        warningMessage = `Grace Period Active: ${calc.graceDaysRemaining} day(s) remaining before a penalty of ${BillingEngine.DAILY_PENALTY} ETB/day starts.`;
      }
      
      return {
        customer_name: bill.customer.full_name,
        biller_name: bill.biller.name,
        status: calc.effectiveStatus,
        amount_due: calc.remainingDebt,
        late_penalty: calc.penaltyFee,
        warning: warningMessage,
        is_blocked: calc.isBlocked,
        total_to_pay: calc.totalRequired,
        due_date: bill.due_date.toISOString().split('T')[0],
        currency: bill.currency,
        bill_id: bill.id,
        agent_id: agent.id,
        allows_partial: bill.biller.allows_partial,
        transactionId: `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        idempotencyKey: `IDEM-${bill.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      };
    } catch (error) { throw error; }
  }
   async confirmPayment(data: {
  bill_id: string;
  agent_id: string;
  transactionId: string;
  amount: number;
  payment_method: PaymentMethod; // Must match: CASH, MOBILE_APP, etc.
  idempotencyKey: string;
  payer_phone?: string;
}) {
  const agent = await prisma.agent.findUnique({ where: { id: data.agent_id } });
  if (!agent) throw new Error("Unauthorized Agent.");

 const isPhoneEmpty = !data.payer_phone || data.payer_phone.trim().length === 0;

  if (agent.code === 'TELEBIRR' && isPhoneEmpty) {
    throw new Error("Payer phone number is required for Telebirr transactions.");
  }

  // STEP 1: CREATE PENDING RECORD (Invisible to user, visible to Admin)
  const initialTx = await prisma.transaction.create({
    data: {
      transactionId: data.transactionId,
      idempotencyKey: data.idempotencyKey,
      amount: 0, 
      total_amount: Number(data.amount), // Ensure it is a numeric type
      status: TransactionStatus.PENDING,
      payment_method: data.payment_method,
      agent_id: data.agent_id,
      bill_id: data.bill_id,
      payer_phone: data.payer_phone || " ",
      agent_share: 0,
      aggregator_share: 0,
      biller_share: 0,
    }
  });

  try {
    return await prisma.$transaction(async (tx) => {
      // Fetch data using the transaction client (tx)
      const bill = await tx.bill.findUnique({
        where: { id: data.bill_id },
        include: { biller: true, customer: true }
      });

      if (!bill || bill.status === BillStatus.PAID) throw new Error("Bill already paid or not found.");



      const calc = BillingEngine.calculate(bill);
      const paymentAmount = Number(data.amount);

    if (calc.isBlocked) throw new Error(calc.blockReason);

    
    if (paymentAmount > calc.totalRequired) {
      throw new Error(`Overpayment not allowed. Maximum payable: ${calc.totalRequired} ${bill.currency}`);
    }

    if (!bill.biller.allows_partial && paymentAmount < calc.totalRequired) {
      throw new Error(`This biller requires full payment of ${calc.totalRequired}`);
    }
   
      if (isNaN(paymentAmount) || paymentAmount <= 0) throw new Error("Invalid payment amount.");
      if (!bill.biller.allows_partial && paymentAmount < calc.totalRequired) {
        throw new Error(`Partial payment not allowed. Required: ${calc.totalRequired}`);
      }

      const principalPaid = paymentAmount - calc.penaltyFee;
      let agentCommission = agent.code === 'TELEBIRR' ? 1.50 : 2.00;

      const transaction = await tx.transaction.update({
        where: { id: initialTx.id },
        data: {
          amount: principalPaid,
          biller_share: principalPaid - agentCommission - 1.00,
          agent_share: agentCommission,
          aggregator_share: 1.00 + calc.penaltyFee,
          status: TransactionStatus.SUCCESSFUL,
        },
        include: { agent: true }
      });

      const newRemaining = Number(bill.remaining_bal) - principalPaid;
      const isSettled = newRemaining <= 0;

      await tx.bill.update({
        where: { id: bill.id },
        data: {
          status: isSettled ? BillStatus.PAID : BillStatus.PARTIALLY_PAID,
          amount_paid: Number(bill.amount_paid) + principalPaid,
          remaining_bal: newRemaining,
          paid_at: isSettled ? new Date() : undefined
        }
      });

      return {
        message: isSettled ? "Full Payment Successful" : "Partial Payment Successful",
        receipt: {
          transaction_ref: transaction.transactionId,
          customer: bill.customer.full_name,
          amount_paid: `${paymentAmount} ${bill.currency}`,
          remaining_balance: newRemaining,
          status: isSettled ? "FULLY PAID" : "PARTIALLY PAID",
          due_date: bill.due_date.toISOString().split('T')[0],
          paymentDate: transaction.createdAt.toISOString().split('T')[0],
        }
      };
    });
  } catch (error: any) {
    await prisma.transaction.update({
      where: { id: initialTx.id },
      data: { status: TransactionStatus.FAILED }
    });
    throw error; 
  }
}
 
  async getTransactionHistory(agent_id: string, filters: { 
    billReference?: string, 
    fromDate?: string, 
    toDate?: string 
  }) {
    return await prisma.transaction.findMany({
      where: {
        agent_id,
        ...(filters.billReference ? {
          bill: {
            bill_reference: { contains: filters.billReference, mode: 'insensitive' }
          }
        } : {}),
        ...((filters.fromDate || filters.toDate) ? {
          createdAt: {
            ...(filters.fromDate ? { gte: new Date(filters.fromDate) } : {}),
            ...(filters.toDate ? { lte: new Date(filters.toDate) } : {}),
          }
        } : {})
      },
      include: {
        agent: { select: { name: true, code: true } },
        bill: {
          include: {
            customer: { select: { full_name: true } },
            biller: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

async getFullReport(filters: { 
  agent_id?: string; 
  biller_id?: string; 
  status?: string; 
  fromDate?: string; 
  toDate?: string; 
} = {}) {
  const { agent_id, biller_id, status, fromDate, toDate } = filters;

  const whereClause: any = {
    ...(status ? { status } : {}),
    ...(agent_id ? { agent_id } : {}),
    ...(biller_id ? { bill: { biller_id: biller_id } } : {}),
    ...((fromDate || toDate) ? {
      createdAt: {
        ...(fromDate ? { gte: new Date(`${fromDate}T00:00:00.000Z`) } : {}),
        ...(toDate ? { lte: new Date(`${toDate}T23:59:59.999Z`) } : {}),
      }
    } : {})
  };

  const [transactions, aggregates, counts, globalTxCount] = await Promise.all([
 
    prisma.transaction.findMany({
      where: whereClause,
      include: {
        agent: { select: { name: true, code: true } },
        bill: {
          include: {
            customer: { select: { full_name: true, phone_no: true } },
            biller: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),

 
    prisma.transaction.aggregate({
      where: { 
        ...whereClause, 
        status: TransactionStatus.SUCCESSFUL 
      },
      _sum: { 
        total_amount: true,
        agent_share: true,
        aggregator_share: true,
        biller_share: true 
      },
      _count: { id: true }
    }),

    
    Promise.resolve({
      userCount: await prisma.customer.count(),
      agentCount: await prisma.agent.count(),
      billerCount: await prisma.biller.count(),
    }),

    prisma.transaction.count()
  ]);

  return {
    transactions, 
    total_collected: Number(aggregates._sum.total_amount || 0),
    total_agent_commissions: Number(aggregates._sum.agent_share || 0),
    total_aggregator_revenue: Number(aggregates._sum.aggregator_share || 0),
    total_biller_payout: Number(aggregates._sum.biller_share || 0),
    
    total_users: counts.userCount,
    total_agents: counts.agentCount,
    total_billers: counts.billerCount,
    
    count: aggregates._count.id || 0, 
    
   
    total_all_transactions: transactions.length, 
    
  
    total_system_transactions: globalTxCount 
  };
}
async getDailySummary(agent_id?: string, targetDate?: string) {
  let dateFilter = {};
  if (targetDate) {
    const queryDate = new Date(targetDate);
    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);
    dateFilter = { gte: startOfDay, lte: endOfDay };
  }


  const baseFilter = {
    ...(agent_id ? { agent_id } : {}),
    ...(targetDate ? { createdAt: dateFilter } : {})
  };

  const [aggregates, userCount, agentCount, billerCount] = await Promise.all([
   
    prisma.transaction.aggregate({
      where: {
        ...baseFilter,
        status: TransactionStatus.SUCCESSFUL // Only sum money that actually moved
      },
      _sum: {
        total_amount: true,
        agent_share: true,
        aggregator_share: true,
        biller_share: true,
      },
      _count: { id: true }
    }),
    
    
    prisma.customer.count(),
    prisma.agent.count(),
    prisma.biller.count(),
  ]);

  return {
    report_date: targetDate || "All-Time",
   
    total_collected: Number(aggregates._sum.total_amount || 0),
    total_agent_commissions: Number(aggregates._sum.agent_share || 0),
    total_aggregator_revenue: Number(aggregates._sum.aggregator_share || 0),
    total_biller_payout: Number(aggregates._sum.biller_share || 0),
    
   
    count: aggregates._count.id || 0,
    
    total_users: userCount,
    total_agents: agentCount,
    total_billers: billerCount,
  };
}
}