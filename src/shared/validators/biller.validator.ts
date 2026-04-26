import { refine, z } from 'zod';

export const CreateBillerSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    code: z.string().min(2).max(10).toUpperCase(),
    category: z.enum(['UTILITY', 'EDUCATION', 'GOVERNMENT', 'OTHER']),
    allows_partial: z.boolean().default(false)
});

export const IngestBillSchema = z.array(z.object({
    bill_reference: z.string().min(1),
    amount_due: z.number().positive('Amount must be greater than zero'),
    period: z.string().regex(/^\d{4}-\d{2}$/, "Period must be YYYY-MM")
}));


export const RegisterUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(3),
    role: z.enum(['SUPER_ADMIN', 'BILLER_ADMIN', 'AGENT_USER']),
    biller_id: z.string().optional(),
    agent_id: z.string().optional(),
}).refine((data) => {
    // RULE 1 if role is BILLER_USER , billerId is REQUIRED
    if (data.role === 'BILLER_ADMIN' && !data.biller_id) {
        return false;
    }
    // RULE 2: If role is AGENT_USER, agentId is REQUIRED
    if (data.role === 'AGENT_USER' && !data.agent_id) {
        return false;
    }
    return true;
}, {
    message: "Biller ID or Agent ID is required for this role",
    path: ['billerId']
});

