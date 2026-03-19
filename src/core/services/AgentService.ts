import { prisma } from '../lib/prisma.ts';
import { BillStatus, PaymentMethod, TransactionStatus } from '@prisma/client';
import { BillingEngine } from '@/core/utils/BillingEngine.ts'; // Adjust path as needed

export class AgentService {
  async inquiry(bill_reference: string, agent_code: string) {
    try {
      const agent = await prisma.agent.findUnique({ where: { code: agent_code } });
      if (!agent) throw new Error("Invalid Agent Code");

      const bill = await prisma.bill.findUnique({
        where: { bill_reference },
        include: { biller: true, customer: true }
      });

      if (!bill || bill.status === BillStatus.PAID) return null;

      const calc = BillingEngine.calculate(bill);

      let warningMessage = null;
      if (calc.isWithinGracePeriod) {
        warningMessage = `Grace Period Active: ${calc.graceDaysRemaining} day(s) remaining before a penalty of ${BillingEngine.DAILY_PENALTY} ETB/day starts.`;
      }
      else if(calc.effectiveStatus === BillStatus.EXPIRED){
        warningMessage = `Penalty Applied: This bill is ${calc.daysLate} days past due date .`
      }

      return {
        customer_name: bill.customer.full_name,
        biller_name: bill.biller.name,
        status: calc.effectiveStatus,
        amount_due: calc.remainingDebt,
        late_penalty: calc.penaltyFee,
        warning: warningMessage,
        total_to_pay: calc.totalRequired,
        due_date: bill.due_date.toISOString().split('T')[0],
        currency: bill.currency,
        bill_id: bill.id,
        agent_id: agent.id,
        allows_partial: bill.biller.allows_partial,
        transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        idempotencyKey: `IDEM-${bill.id}-${Date.now()}`,
      };
    } catch (error) { throw error; }
  }

  async confirmPayment(data: {
    bill_id: string;
    agent_id: string;
    transactionId: string;
    amount: number; // Ensure this is a number in your type/interface
    payment_method: PaymentMethod;
    idempotencyKey: string;
    payer_phone?: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findUnique({ 
        where: { id: data.bill_id },
        include: { biller: true,
                  customer: true,
              }
         
      });

      if (!bill || bill.status === BillStatus.PAID) throw new Error("Bill already paid or not found.");

      // 2. FIX: Fetch the Agent (to identify if it's CBE, Telebirr, etc.)
       const agent = await tx.agent.findUnique({
           where: { id: data.agent_id }
    });

      if (!agent) throw new Error("Unauthorized Agent.");

            // Validation for Telebirr

      if (agent.code === 'TELEBIRR' && !data.payer_phone) {
        throw new Error("Payer phone number is required for Telebirr transactions.");
}

      const calc = BillingEngine.calculate(bill);
      
      // FIX: Force convert to number to prevent NaN
      const paymentAmount = Number(data.amount);
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        throw new Error("Valid payment amount is required.");
      }

      // 1. Rule: Partial Payment Check
      if (!bill.biller.allows_partial && paymentAmount < calc.totalRequired) {
        throw new Error(`${bill.biller.name} does not allow partial payments. Full payment of ${calc.totalRequired} ETB is required.`);
      }

      // 2. Rule: Overpayment Check
      if (paymentAmount > calc.totalRequired) {
        throw new Error(`Overpayment: Maximum allowed is ${calc.totalRequired} ETB.`);
      }

      const principalPaid = paymentAmount - calc.penaltyFee;
                
         // Dynamic Commission Logic
      let agentCommission = 2.00; // Default
         if (agent.code === 'TELEBIRR') {
            agentCommission = 1.50; // Maybe Telebirr is cheaper?
       } else if (agent.code === 'CBE') {
            agentCommission = 2.00;
}  


      // 3. Create Transaction
      // FIX: Using the field names defined in your schema (agent_id, bill_id)
      const transaction = await tx.transaction.create({
        data: {
          transactionId: data.transactionId,
          idempotencyKey: data.idempotencyKey,
          amount: principalPaid, // The amount that goes to the bill
          total_amount: paymentAmount, // The total paid by customer (principal + penalty)
          biller_share: principalPaid - agentCommission - 1.00,
          agent_share: agentCommission,
          aggregator_share: 1.00 + calc.penaltyFee,
          status: TransactionStatus.SUCCESSFUL,
          payment_method: data.payment_method ,
          agent_id: data.agent_id, // Matches your @relation fields
          bill_id: bill.id,
          payer_phone: data.payer_phone || null
        },
        include: {
          agent: true,
        }
      });

      // 4. Update Bill Balance
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
        message: isSettled ? "Payment Successful" : "Partial Payment Successful",
        receipt: {
          transaction_ref: transaction.transactionId,
          customer: bill.customer.full_name,
          amount_paid: `${paymentAmount} ${bill.currency}`,
          remaining_balance: Number(bill.remaining_bal) - principalPaid,
          status: isSettled ? "FULLY PAID" : "PARTIALLY PAID",
          due_date: bill.due_date.toISOString().split('T')[0],
          paymentDate: transaction.createdAt.toISOString().split('T')[0],
        }
      };
    });
  }
  
  async getTransactionHistory(agent_id?: string) {
    return await prisma.transaction.findMany({
      where: {
        // If agent_id is provided, filter by it. If not, get everything.
        ...(agent_id ? { agent_id } : {})
      },
      include: {
        agent: {
          select: { name: true, code: true }
        },
        bill: {
          include: {
            customer: { select: { full_name: true } },
            biller: { select: { name: true } }
          }
        }
      },
      orderBy: {
        createdAt: 'desc' // Newest transactions first
      }
    });
  }

async getFullReport(agent_id?: string) {
  const transactions = await prisma.transaction.findMany({
    where: {
      ...(agent_id ? { agent_id } : {}),
    },
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
  });

  // Transform the data into a human-readable "Report" format
  return transactions.map(tx => ({
    transaction_id: tx.transactionId,
    date_time: tx.createdAt, // This includes date and time
    customer_name: tx.bill.customer.full_name,
    customer_phone: tx.bill.customer.phone_no,
    agent_name: tx.agent.name,
    biller_name: tx.bill.biller.name,
    amount_paid: tx.total_amount,
    payment_method: tx.payment_method,
    // The "Narrative" for the report
    summary: `${tx.bill.customer.full_name} paid ${tx.total_amount} ETB to ${tx.bill.biller.name} via ${tx.agent.name} on ${tx.createdAt.toLocaleString()}`
  }));
}

async getDailySummary(agent_id?: string, targetDate?: string) {
      // 1. Parse the date or default to now
  const queryDate = targetDate ? new Date(targetDate) : new Date();
  
  // 2. Set range to cover the FULL 24 hours of that specific day
  const startOfDay = new Date(queryDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(queryDate);
  endOfDay.setHours(23, 59, 59, 999);

  const transactions = await prisma.transaction.findMany({
    where: {
      ...(agent_id ? { agent_id } : {}),
      createdAt: { gte: startOfDay,
                   lte: endOfDay } 
    }
  });

  // Aggregate the totals
  const summary = transactions.reduce((acc, tx) => {
    return {
      total_collected: acc.total_collected + Number(tx.total_amount),
      total_agent_commissions: acc.total_agent_commissions + Number(tx.agent_share),
      total_aggregator_revenue: acc.total_aggregator_revenue + Number(tx.aggregator_share),
      total_biller_payout: acc.total_biller_payout + Number(tx.biller_share),
      count: acc.count + 1
    };
  }, { 
    total_collected: 0, 
    total_agent_commissions: 0, 
    total_aggregator_revenue: 0, 
    total_biller_payout: 0, 
    count: 0 
  });

  return {
   report_date: startOfDay.toISOString().split('T')[0],
    ...summary
  };
}
}


