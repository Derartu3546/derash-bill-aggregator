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
      else if (calc.effectiveStatus === BillStatus.EXPIRED) {
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
    amount: number;
    payment_method: PaymentMethod;
    idempotencyKey: string;
    payer_phone?: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findUnique({
        where: { id: data.bill_id },
        include: {
          biller: true,
          customer: true,
        }
      });

      if (!bill || bill.status === BillStatus.PAID) throw new Error("Bill already paid or not found.");

      const agent = await tx.agent.findUnique({
        where: { id: data.agent_id }
      });

      if (!agent) throw new Error("Unauthorized Agent.");

      if (agent.code === 'TELEBIRR' && !data.payer_phone) {
        throw new Error("Payer phone number is required for Telebirr transactions.");
      }

      const calc = BillingEngine.calculate(bill);
      const paymentAmount = Number(data.amount);

      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        throw new Error("Valid payment amount is required.");
      }

      if (!bill.biller.allows_partial && paymentAmount < calc.totalRequired) {
        throw new Error(`${bill.biller.name} does not allow partial payments. Full payment of ${calc.totalRequired} ETB is required.`);
      }

      if (paymentAmount > calc.totalRequired) {
        throw new Error(`Overpayment: Maximum allowed is ${calc.totalRequired} ETB.`);
      }

      const principalPaid = paymentAmount - calc.penaltyFee;

      let agentCommission = 2.00;
      if (agent.code === 'TELEBIRR') {
        agentCommission = 1.50;
      } else if (agent.code === 'CBE') {
        agentCommission = 2.00;
      }

      const transaction = await tx.transaction.create({
        data: {
          transactionId: data.transactionId,
          idempotencyKey: data.idempotencyKey,
          amount: principalPaid,
          total_amount: paymentAmount,
          biller_share: principalPaid - agentCommission - 1.00,
          agent_share: agentCommission,
          aggregator_share: 1.00 + calc.penaltyFee,
          status: TransactionStatus.SUCCESSFUL,
          payment_method: data.payment_method,
          agent_id: data.agent_id,
          bill_id: bill.id,
          payer_phone: data.payer_phone || " "
        },
        include: {
          agent: true,
        }
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
        createdAt: 'desc'
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

    return transactions.map(tx => ({
      transaction_id: tx.transactionId,
      date_time: tx.createdAt,
      customer_name: tx.bill.customer.full_name,
      customer_phone: tx.bill.customer.phone_no,
      agent_name: tx.agent.name,
      biller_name: tx.bill.biller.name,
      amount: tx.total_amount,
      payment_method: tx.payment_method,
      summary: `${tx.bill.customer.full_name} paid ${tx.total_amount} ETB to ${tx.bill.biller.name} via ${tx.agent.name} on ${tx.createdAt.toLocaleString()}`
    }));
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

    const [transactions, userCount, agentCount, billerCount] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          ...(agent_id ? { agent_id } : {}),
          ...(targetDate ? { createdAt: dateFilter } : {})
        },
        include: { agent: true }
      }),
      prisma.customer.count(),
      prisma.agent.count(),
      prisma.biller.count(),
    ]);

    const transactionSummary = transactions.reduce((acc, tx) => {
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

    // FLAT RETURN: No more .summary wrapper
    return {
      report_date: targetDate || "All-Time",
      ...transactionSummary,
      total_users: userCount,
      total_agents: agentCount,
      total_billers: billerCount,
    };
  }
}