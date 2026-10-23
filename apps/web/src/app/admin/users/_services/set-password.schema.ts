import { PasswordSchema } from "@/app/_domains/auth/_services/password.schema";
import { z } from "zod";

export const SetPasswordSchema = z.object({
  userId: z.string(),
  newPassword: PasswordSchema,
});

export type SetPasswordInput = z.infer<typeof SetPasswordSchema>;
