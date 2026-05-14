import { z } from 'zod';

export const updateSettingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  language: z.enum(["en", "am", "or"]).optional(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  twoFactorEnabled: z.boolean().optional(),
  loginAlerts: z.boolean().optional(),
});
