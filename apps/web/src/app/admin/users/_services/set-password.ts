import { auth } from "@/server/auth";
import { BadRequestError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import type { SetPasswordInput } from "./set-password.schema";

// Replaces upstream's "send a reset link" action: with no mail channel, the
// operator sets the password directly and passes it on out of band.
export async function setPassword(
  { userId, newPassword, headers }: SetPasswordInput & { headers: Headers },
  db: typeof prisma = prisma,
) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { accounts: { select: { providerId: true } } },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const hasCredentialProvider = user.accounts.some(
    (account) => account.providerId === "credential",
  );

  if (!hasCredentialProvider) {
    throw new BadRequestError("User does not have a credential-based account");
  }

  await auth.api.setUserPassword({
    body: { userId, newPassword },
    headers,
  });

  return { success: true };
}

export type SetPasswordOutput = Awaited<ReturnType<typeof setPassword>>;
