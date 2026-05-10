import { refine, z } from 'zod';

export const CreateBillerSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    code: z.string().min(2).max(10).toUpperCase(),
    category: z.enum(['UTILITY', 'EDUCATION', 'GOVERNMENT', 'OTHER']),
    allowsPartial: z.boolean().default(false)
});


export const IngestBillSchema = z.array(
  z.object({
    billReference: z.string().min(1, "billReference is required"),

    customerName: z.string().optional(),

    amount: z.preprocess(
      (val) => Number(val),
      z.number().positive("Amount must be greater than zero"),
    ),

    period: z.string().regex(/^\d{4}-\d{2}$/, "Period must be YYYY-MM"),

    dueDate: z.preprocess(
      (val) => new Date(val as string),
      z.date({ error: "Invalid dueDate format" }),
    ),
  }),
);


export const RegisterUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().min(3),
    role: z.enum(['SYSTEM_ADMIN', 'BILLER_USER', 'AGENT_USER']),
    billerId: z.string().optional(),
    agentId: z.string().optional(),
}).refine((data) => {
    // RULE 1 if role is BILLER_USER , billerId is REQUIRED
    if (data.role === 'BILLER_USER' && !data.billerId) {
        return false;
    }
    // RULE 2: If role is AGENT_USER, agentId is REQUIRED
    if (data.role === 'AGENT_USER' && !data.agentId) {
        return false;
    }
    return true;
}, {
    message: "Biller ID or Agent ID is required for this role",
    path: ['billerId']
});


export const UpdateBillerSchema = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
  category: z.string().optional(),
  allowsPartial: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
