import { z } from 'zod';


export const CreateAgentSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    code: z.string().min(2).max(10).toUpperCase(),
    isEnabled: z.boolean().default(false)
});