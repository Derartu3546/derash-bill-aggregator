import { Biller } from '../entities/Biller';

export interface IBillerRepository {
  findById(id: string): Promise<Biller | null>;
  findByCode(code: string): Promise<Biller | null>;
  create(biller: Biller): Promise<Biller>;
  update(id: string, updatedData: Partial<Biller>): Promise<Biller>;
  delete(id: string): Promise<void>;
  findAll(params: {
    search?: string;
    page: number;
    limit: number;
  }): Promise<Biller[]>;
}