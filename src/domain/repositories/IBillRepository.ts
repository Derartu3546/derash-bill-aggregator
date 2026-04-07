import { Bill, BillStatus } from "../entities/Bill";

export interface IBillRepository {
  findById(id: string): Promise<Bill | null>;

  findByReference(
    billerId: string,
    billReference: string,
    period: string,
  ): Promise<Bill | null>;

  create(billData: any): Promise<void>;

  upsert(billData: any): Promise<void>;

  findDuplicate(billReference: string, period:string, billerId:string): Promise<any | null>

  findActiveBillsForAgent(billReference: string): Promise<Bill[]>;

  updateStatus(
    id: string,
    tx: any,
    status: BillStatus,
    amountPaid?: number,
  ): Promise<Bill>;

  findByIdWithLock(id: string, tx: any): Promise<Bill | null>;
}
