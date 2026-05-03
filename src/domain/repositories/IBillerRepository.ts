import { Biller } from '../entities/Biller.ts';


export interface BillerStats {
  totalBills: number;
  totalReceivableAmount: number;
  breakdown: Array<{
    status: string;
    count: number;
    amount: number;
  }>;
}

export interface IBillerRepository {
  findById(id: string): Promise<Biller | null>;
  findByCode(code: string): Promise<Biller | null>;
  create(biller: any): Promise<Biller>;
  update(biller: any): Promise<Biller>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
  
  findAll(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<Biller[]>;

  getBillerStats(billerId: string): Promise<BillerStats>;
}