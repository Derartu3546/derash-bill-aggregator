import { Bill, BillStatus } from "../entities/Bill";

export interface IBillRepository {
  findById(id: string): Promise<Bill | null>;

  findByReference(
    billerId: string,
    billReference: string,
    period: string,
  ): Promise<Bill | null>;

  upsert(billData: any): Promise<void>;

  // used by agents when checking unpaid bills
  findActiveBillsForAgent(billReference: string): Promise<Bill[]>;

  // update bill status during payment transaction
  updateStatus(
    id: string,
    tx: any,
    status: BillStatus,
    amountPaid?: number,
  ): Promise<Bill>;

  // lock bill during payment to avoid race conditions
  findByIdWithLock(id: string, tx: any): Promise<Bill | null>;
}
