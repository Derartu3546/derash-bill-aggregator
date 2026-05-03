import { Bill, BillStatus } from "../entities/Bill.ts";
import { Biller } from '../entities/Biller.ts';
import { Customer } from '../entities/Customer.ts';


export type BillWithRelations = Bill & {
  biller: Biller;
  customer: Customer;
};


export interface IBillRepository {
  findById(id: string): Promise<Bill | null>;

  findByReference(
    biller_id: string,
    bill_reference: string,
    period: string,
  ): Promise<BillWithRelations | null>;
  

  upsert(billData: any): Promise<void>;

 
  findActiveBillsForAgent(bill_reference: string): Promise<Bill[]>;

  // update bill status during payment transaction
  updateStatus(
    id: string,
    tx: any,
    status: string,
    amount_paid?: number,
    paid_at?: Date | null
  ): Promise<Bill>;

  // lock bill during payment to avoid race conditions
  findByIdWithLock(id: string, tx: any): Promise<BillWithRelations | null>;
}
