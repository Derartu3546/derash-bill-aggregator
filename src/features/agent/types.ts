export type TransactionStatus =
  | "INITIATED"
  | "SUCCESS"
  | "FAILED"
  | "PENDING";

export type PaymentMethod =
  | "MOBILE_APP"
  | "USSD"
  | "CARD"
  | "CASH";

export interface Transaction {
  id: string;
  transactionId: string;
  status: TransactionStatus;
  payment_method: PaymentMethod;
  payer_phone?: string;
  agent_id: string;
  bill_id: string;
  amount: number;
  createdAt: string;
}