import { Biller } from "../../models/Biller";
import { IBillRepository } from "../../models/IBillRepository";
import { ITransactionRepository } from "../../models/ITransactionRepository";
import { prisma } from "../../config/prisma";

export class ProcessPaymentUseCase {
  constructor(
    private billRepo: IBillRepository,
    private transactionRepo: ITransactionRepository,
  ) {}

  async execute(input: {
    billId: string;
    agentId: string;
    amount: number;
    idempotencykey: string;
    agentReference?: string;
  }) {
    // 1 START ATOMIC TRANSACTION
    return await prisma.$transaction(async (tx) => {
      // CHECK IDEMPOTENCY
      const existingTx = await tx.transaction.findUnique({
        where: { idempotencyKey: input.idempotencykey },
      });
      if (existingTx) {
        return {
          status: "ALREADY_PROCESSED",
          transactionId: existingTx.transactionId,
        };
      }
      // FIND AND LOCK THE BILL
      const bill = await this.billRepo.findByIdWithLock(input.billId, tx);
      if (!bill) throw new Error("Bill not found");
      if (bill.status === "PAID") throw new Error("Bill already paid");

      // Validate Amount
      if (input.amount < bill.getRemainingAmount()) {
        throw new Error("Insufficient payment amount");
      }
    });
  }
}
