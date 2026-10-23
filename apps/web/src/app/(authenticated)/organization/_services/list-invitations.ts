import { buildInviteUrl } from "@/app/_domains/organization/_helpers/build-invite-url";
import { ForbiddenError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import type { ListInvitationsInput } from "./list-invitations.schema";

export async function listInvitations(
  { organizationId, userId }: ListInvitationsInput & { userId: string },
  db: typeof prisma = prisma,
) {
  // The denial needs the loaded membership and its role, so it belongs here.
  const membership = await db.member.findFirst({
    where: {
      organizationId,
      userId,
      role: { in: ["owner", "admin"] },
    },
  });

  if (!membership) {
    throw new ForbiddenError("You do not have permission to view invitations.");
  }

  const invitations = await db.invitation.findMany({
    where: {
      organizationId,
      status: "pending",
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  return invitations.map((invitation) => ({
    ...invitation,
    inviteUrl: buildInviteUrl(invitation.id),
    // Expired rows keep status "pending", so without this the table would
    // offer links that no longer work.
    isExpired: invitation.expiresAt < now,
  }));
}

export type ListInvitationsOutput = Awaited<ReturnType<typeof listInvitations>>;
