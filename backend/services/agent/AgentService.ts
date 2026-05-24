import { prisma } from "../../config/prisma";
import { BillStatus, PaymentMethod, TransactionStatus } from "@prisma/client";
import { BillingEngine } from "../BillingEngine";
import { success } from "zod/mini";

export class AgentService {
  async inquiry(billReference: string, agentCode: string) {
    try {
      console.log(`Inquiry Started: Ref=${billReference}, Agent=${agentCode}`);

      const agent = await prisma.agent.findUnique({
        where: { code: agentCode },
      });
      if (!agent) {
        throw new Error("Invalid Agent Code");
      }

      const bill = await prisma.bill.findFirst({
        where: { billReference: billReference },
        include: { biller: true, customer: true },
      });

      if (!bill || bill.status === BillStatus.PAID) {
        throw new Error("No unpaid bill found with the provided reference.");
      }
const actualDebt =
  Number(bill.remainingBalance) <= 0 && bill.status === "UNPAID"
    ? Number(bill.amount)
    : Number(bill.remainingBalance);
      const calc = BillingEngine.calculate(bill);

      const displayAmount =
        Number(bill.remainingBalance) === 0 && bill.status === "UNPAID"
          ? Number(bill.amount)
          : Number(calc.remainingDebt);

      let warningMessage = calc.blockReason || null;
      if (!warningMessage && calc.isWithinGracePeriod) {
        warningMessage = `Grace Period Active: ${calc.graceDaysRemaining} day(s) remaining.`;
      }

      return {
        // ✅ FIX: fallback to bill.customerName if no linked customer
        customer_name: bill.customer?.fullName || bill.customerName || "N/A",
        biller_name: bill.biller.name,
        status: calc.effectiveStatus,
        amount_due: actualDebt > 0 ? actualDebt : calc.remainingDebt,
        late_penalty: calc.penaltyFee,
        warning: warningMessage,
        is_blocked: calc.isBlocked,
        total_to_pay: displayAmount + calc.penaltyFee,
        due_date: bill.dueDate.toISOString().split("T")[0],
        currency: bill.currency,
        bill_id: bill.id,
        agent_id: agent.id,
        allows_partial: bill.biller.allowsPartial,
        transactionId: `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        idempotencyKey: `IDEM-${bill.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      };
    } catch (error) {
      throw error;
    }
  }

  async confirmPayment(data: {
    billId: string;
    agentId: string;
    transactionId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    idempotencyKey: string;
    payerPhone?: string;
  }) {
    const agent = await prisma.agent.findUnique({
      where: { id: data.agentId },
    });
    if (!agent) throw new Error("Unauthorized Agent.");

    const isPhoneEmpty =
      !data.payerPhone || data.payerPhone.trim().length === 0;
    if (agent.code === "TELEBIRR" && isPhoneEmpty) {
      throw new Error("Payer phone number is required for Telebirr.");
    }

    const initialTx = await prisma.transaction.create({
      data: {
        transactionId: data.transactionId,
        idempotencyKey: data.idempotencyKey,
        amount: 0,
        totalAmount: Number(data.amount),
        status: TransactionStatus.PENDING,
        paymentMethod: data.paymentMethod,
        agentId: data.agentId,
        billId: data.billId,
        payerPhone: data.payerPhone || " ",
        agentShare: 0,
        aggregatorShare: 0,
        billerShare: 0,
      },
    });

    try {
      return await prisma.$transaction(async (tx) => {
        const bill = await tx.bill.findUnique({
          where: { id: data.billId },
          include: { biller: true, customer: true },
        });

        if (!bill || bill.status === BillStatus.PAID)
          throw new Error("Bill settled or not found.");

        const calc = BillingEngine.calculate(bill);
        const paymentAmount = Number(data.amount);

        if (calc.isBlocked) throw new Error(calc.blockReason);

        if (bill.biller.allowsPartial === false && paymentAmount < calc.totalRequired) {
          throw new Error(
            `This biller (${bill.biller.name}) does not allow partial payments. Full amount of ${calc.totalRequired} ${bill.currency} is required.`,
          );
        }

        if (paymentAmount > calc.totalRequired)
          throw new Error("Overpayment not allowed.");

        if (paymentAmount <= calc.penaltyFee) {
          throw new Error(
            `Payment must exceed penalty fee of ${calc.penaltyFee} ${bill.currency}`,
          );
        }

        const principalPaid = paymentAmount - calc.penaltyFee;
        let agentCommission = agent.code === "TELEBIRR" ? 1.5 : 2.0;

        const transaction = await tx.transaction.update({
          where: { id: initialTx.id },
          data: {
            amount: principalPaid,
            billerShare: principalPaid - agentCommission - 1.0,
            agentShare: agentCommission,
            aggregatorShare: 1.0 + calc.penaltyFee,
            status: TransactionStatus.SUCCESSFUL,
          },
          include: { agent: true },
        });
const currentBalance =
  Number(bill.remainingBalance) > 0
    ? Number(bill.remainingBalance)
    : Number(bill.amount);
        const newRemaining = Number(bill.remainingBalance) - principalPaid;
        const isSettled = newRemaining <= 0.05;

        await tx.bill.update({
          where: { id: bill.id },
          data: {
            status: isSettled ? BillStatus.PAID : BillStatus.PARTIALLY_PAID,
            amountPaid: Number(bill.amountPaid) + principalPaid,
            remainingBalance: isSettled ? 0 : newRemaining,
            paidAt: isSettled ? new Date() : undefined,
          },
        });

        return {
          success: true,
          message: isSettled
            ? "Full Payment Successful"
            : "Partial Payment Successful",
          receipt: {
            transaction_ref: transaction.transactionId,
            customer: bill.customer?.fullName,
            amount_paid: `${paymentAmount} ${bill.currency}`,
            remaining_balance: newRemaining,
            status: isSettled ? "FULLY PAID" : "PARTIALLY PAID",
            due_date: bill.dueDate.toISOString().split("T")[0],
            paymentDate: transaction.createdAt.toISOString().split("T")[0],
          },
        };
      });
    } catch (error: any) {
      await prisma.transaction.update({
        where: { id: initialTx.id },
        data: { status: TransactionStatus.FAILED },
      });
      throw error;
    }
  }

  async getFullReport(
    filters: {
      agentId?: string;
      billerId?: string;
      status?: string;
      fromDate?: string;
      toDate?: string;
    } = {},
  ) {
    const { agentId, billerId, status, fromDate, toDate } = filters;

    const whereClause: any = {
      ...(status ? { status } : {}),
      ...(agentId ? { agentId } : {}),
      ...(billerId ? { bill: { billerId: billerId } } : {}),
      ...(fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate
                ? { gte: new Date(`${fromDate}T00:00:00.000Z`) }
                : {}),
              ...(toDate ? { lte: new Date(`${toDate}T23:59:59.999Z`) } : {}),
            },
          }
        : {}),
    };

    const [transactions, aggregates, counts, globalTxCount] = await Promise.all(
      [
        prisma.transaction.findMany({
          where: whereClause,
          include: {
            agent: { select: { name: true, code: true } },
            bill: {
              include: {
                customer: { select: { fullName: true, phoneNo: true } },
                biller: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.transaction.aggregate({
          where: { ...whereClause, status: "SUCCESSFUL" },
          _sum: {
            totalAmount: true,
            agentShare: true,
            aggregatorShare: true,
            billerShare: true,
          },
          _count: { id: true },
        }),
        Promise.resolve({
          userCount: await prisma.customer.count(),
          agentCount: await prisma.agent.count(),
          billerCount: await prisma.biller.count(),
        }),
        prisma.transaction.count(),
      ],
    );

    return {
      transactions,
      total_collected: Number(aggregates._sum.totalAmount || 0),
      total_agent_commissions: Number(aggregates._sum.agentShare || 0),
      total_aggregator_revenue: Number(aggregates._sum.aggregatorShare || 0),
      total_biller_payout: Number(aggregates._sum.billerShare || 0),
      total_users: counts.userCount,
      total_agents: counts.agentCount,
      total_billers: counts.billerCount,
      count: aggregates._count.id || 0,
      total_system_transactions: globalTxCount,
    };
  }

  async getDailySummary(agentId?: string, targetDate?: string) {
    let dateFilter = {};
    if (targetDate) {
      const queryDate = new Date(targetDate);
      const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));
      dateFilter = { gte: startOfDay, lte: endOfDay };
    }

    const baseFilter = {
      ...(agentId ? { agentId } : {}),
      ...(targetDate ? { createdAt: dateFilter } : {}),
    };

    const [aggregates, userCount, agentCount, billerCount] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...baseFilter, status: "SUCCESSFUL" },
        _sum: {
          totalAmount: true,
          agentShare: true,
          aggregatorShare: true,
          billerShare: true,
        },
        _count: { id: true },
      }),
      prisma.customer.count(),
      prisma.agent.count(),
      prisma.biller.count(),
    ]);

    return {
      report_date: targetDate || "All-Time",
      total_collected: Number(aggregates._sum.totalAmount || 0),
      total_agent_commissions: Number(aggregates._sum.agentShare || 0),
      total_aggregator_revenue: Number(aggregates._sum.aggregatorShare || 0),
      total_biller_payout: Number(aggregates._sum.billerShare || 0),
      count: aggregates._count.id || 0,
      total_users: userCount,
      total_agents: agentCount,
      total_billers: billerCount,
    };
  }
}