import { prisma } from "../../config/prisma";
import { BillStatus, PaymentMethod, TransactionStatus } from "@prisma/client";
import { BillingEngine } from "../BillingEngine";

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

      if (!bill) {
        throw new Error("No bill found with the provided reference.");
      }

      if (bill.status === BillStatus.PAID) {
        return {
          success: true, 
          customer_name: bill.customer?.fullName || bill.customerName || "N/A",
          biller_name: bill.biller.name,
          status: "PAID", 
          amount_due: 0,
          late_penalty: 0,
          total_to_pay: 0,
          is_paid: true,   
          is_blocked: true, 
          due_date: bill.dueDate.toISOString().split("T")[0],
          currency: bill.currency,
          allows_partial: false,
        };
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

      // 💡 OVERRIDE EXPIRED BLOCKS FOR INQUIRY: Allow terminal to present the payment screen
      // If it's blocked purely because it's expired, allow agent collection by overriding is_blocked
      const finalIsBlocked = calc.effectiveStatus === "EXPIRED" ? false : calc.isBlocked;

      return {
        customer_name: bill.customer?.fullName || bill.customerName || "N/A",
        biller_name: bill.biller.name,
        status: calc.effectiveStatus,
        amount_due: actualDebt > 0 ? actualDebt : calc.remainingDebt,
        late_penalty: calc.penaltyFee,
        warning: warningMessage,
        is_blocked: finalIsBlocked,
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
    paymentMethod: any;
    idempotencyKey: string;
    payerPhone?: string;
  }) {
    const agent = await prisma.agent.findUnique({
      where: { id: data.agentId },
    });
    if (!agent) throw new Error("Unauthorized Agent.");

    // 1. Sanitize the identifiers for Telebirr matching
    const cleanCode = (agent.code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const cleanName = (agent.name || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    
    const isTelebirr = 
      cleanCode.includes("TELEBIRR") || 
      cleanCode.includes("TELE") || 
      cleanCode.startsWith("TEL") ||
      cleanName.includes("TELEBIRR");

    // Clean up incoming phone input strings completely
    const cleanPhone = (data.payerPhone || "").trim();

    // THE HARD STOP: Hard validation checking for Telebirr before opening the database pool
    if (isTelebirr) {
      if (!cleanPhone || cleanPhone === "" || cleanPhone === "N/A") {
        throw new Error("HTTP 400 Bad Request: Payer phone number is strictly mandatory for all Telebirr network transactions.");
      }
      if (cleanPhone.length < 9) {
        throw new Error("HTTP 400 Bad Request: Provided Telebirr phone number is invalid. Please provide a complete contact number.");
      }
    }

    // 3. Dynamic Enum Resolver
    let safePaymentMethod: PaymentMethod = PaymentMethod.CASH;
    if (data.paymentMethod) {
      const upperMethod = String(data.paymentMethod).toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (upperMethod.includes("CBE")) safePaymentMethod = PaymentMethod.CBE;
      else if (upperMethod.includes("TELEBIRR") || upperMethod.includes("TEL")) safePaymentMethod = PaymentMethod.TELEBIRR;
    } else {
      if (cleanCode.includes("CBE")) safePaymentMethod = PaymentMethod.CBE;
      else if (isTelebirr) safePaymentMethod = PaymentMethod.TELEBIRR;
    }

    try {
      return await prisma.$transaction(async (tx) => {
        const bill = await tx.bill.findUnique({
          where: { id: data.billId },
          include: { biller: true, customer: true },
        });

        if (!bill || bill.status === BillStatus.PAID)
          throw new Error("Bill settled or not found.");

        if (Number(bill.remainingBalance) <= 0 && bill.status === BillStatus.UNPAID) {
          (bill as any).remainingBalance = bill.amount;
        }
        
        const calc = BillingEngine.calculate(bill);
        const paymentAmount = Number(data.amount);

        // Overpayment logic verification
        if (paymentAmount > calc.totalRequired) {
          throw new Error(`Overpayment Rejected. Max allowed is ${calc.totalRequired} ${bill.currency}.`);
        }

        // 💡 FIXED PIPELINE BLOCK: Ignore expiration blocks during agent settlements
        const isPipelineBlocked = calc.effectiveStatus === "EXPIRED" ? false : calc.isBlocked;
        if (isPipelineBlocked) {
          throw new Error(calc.blockReason || "Payment pipeline blocked.");
        }

        if (bill.biller.allowsPartial === false && paymentAmount < calc.totalRequired - 0.01) {
          throw new Error(`This biller (${bill.biller.name}) requires full payment of ${calc.totalRequired} ${bill.currency}.`);
        }

        if (paymentAmount <= calc.penaltyFee) {
          throw new Error(`Payment must exceed penalty fee of ${calc.penaltyFee} ${bill.currency}`);
        }

        const principalPaid = paymentAmount - calc.penaltyFee;
        
        // Dynamic Commission Split Logic
        let agentCommission = isTelebirr ? 1.5 : 2.0;
        const calculatedBillerShare = principalPaid - agentCommission - 1.0;

        const transaction = await tx.transaction.create({
          data: {
            transactionId: data.transactionId,
            idempotencyKey: data.idempotencyKey,
            amount: principalPaid,
            totalAmount: paymentAmount,
            billerShare: calculatedBillerShare > 0 ? calculatedBillerShare : 0,
            agentShare: agentCommission,
            aggregatorShare: 1.0 + calc.penaltyFee,
            status: TransactionStatus.SUCCESSFUL,
            paymentMethod: safePaymentMethod,
            agentId: data.agentId,
            billId: data.billId,
            payerPhone: isTelebirr ? cleanPhone : (cleanPhone || "N/A"),
          },
          include: { agent: true },
        });

        const currentBalance = Number(bill.remainingBalance) > 0 ? Number(bill.remainingBalance) : Number(bill.amount);
        const newRemaining = currentBalance - principalPaid;
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
          message: isSettled ? "Full Payment Successful" : "Partial Payment Successful",
          receipt: {
            transaction_ref: transaction.transactionId,
            customer: bill.customer?.fullName,
            amount_paid: `${paymentAmount} ${bill.currency}`,
            remaining_balance: newRemaining > 0 ? newRemaining : 0,
            status: isSettled ? "FULLY PAID" : "PARTIALLY PAID",
            due_date: bill.dueDate.toISOString().split("T")[0],
            paymentDate: transaction.createdAt.toISOString().split("T")[0],
          },
        };
      });
    } catch (error: any) {
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