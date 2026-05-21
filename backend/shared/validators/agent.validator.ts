import { z } from 'zod';


export const CreateAgentSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    code: z.string().min(2).max(10).toUpperCase(),
    isEnabled: z.boolean().default(false),
    apiKey: z.string().min(10, 'API key must be a valid secure token string')
});