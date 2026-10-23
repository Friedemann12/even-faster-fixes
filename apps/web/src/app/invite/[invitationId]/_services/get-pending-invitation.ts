import { prisma } from "@workspace/db";

// Read with Prisma rather than auth.api.getInvitation: that endpoint requires a
// session, and the whole point of the invite page is that the visitor has no
// account yet.
export async function getPendingInvitation({
  invitationId,
}: {
  invitationId: string;
}) {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    select: {
      id: true,
      email: true,
      status: true,
      expiresAt: true,
      organization: { select: { name: true } },
    },
  });

  if (!invitation) return null;
  if (invitation.status !== "pending") return null;
  if (invitation.expiresAt < new Date()) return null;

  return invitation;
}

export type GetPendingInvitationOutput = Awaited<
  ReturnType<typeof getPendingInvitation>
>;
