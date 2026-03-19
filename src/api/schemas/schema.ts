import { BillStatus, TransactionStatus, PaymentMethod } from '@prisma/client';

/**
 * Request Schema for Bill Inquiry
 * Matches: GET /api/v1/agent/bill-inquiry/:bill_reference
 */
export const billInquirySchema = {
  params: {
    type: 'object',
    required: ['bill_reference'],
    properties: {
      bill_reference: { type: 'string', minLength: 3 }
    }
  }
};

/**
 * Request Schema for Processing Payment
 * This handles the "Confirmation" step from the Agent (Bank/Telebirr)
 */
export const paymentProcessSchema = {
  body: {
    type: 'object',
    required: [
      'bill_id', 
      'agent_id', 
      'amount', 
      'payment_method', 
      'idempotencyKey', 
      'transactionId'
    ],
    properties: {
      bill_id: { type: 'string', format: 'uuid' },
      agent_id: { type: 'string', format: 'uuid' },
      amount: { type: 'number', minimum: 1 },
      payment_method: { 
        type: 'string', 
        enum: Object.values(PaymentMethod) 
      },
      idempotencyKey: { type: 'string' }, // To prevent double charging
      transactionId: { type: 'string' },  // The ID from the Bank/Telebirr system
      payer_phone: { type: 'string' },
      agentReference: { type: 'string' }
    }
  }
};

/**
 * Response Interface for Bill Inquiry
 * Based on your Bill, Biller, and Customer models
 */
export interface BillInquiryResponse {
  id: string;
  bill_reference: string;
  amount_due: number;
  remaining_bal: number;
  currency: string;
  status: BillStatus;
  period: string;
  due_date: Date | null;
  biller: {
    name: string;
    code: string;
  };
  customer: {
    full_name: string;
    contract_number: string;
  };
}

/**
 * Transaction Summary Interface
 * Based on your Transaction model
 */
export interface TransactionResponse {
  derash_ref: string;
  transactionId: string;
  status: TransactionStatus;
  total_amount: number;
  agent_share: number;
  biller_share: number;
  aggregator_share: number;
  createdAt: Date;
}