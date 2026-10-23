import { prisma } from "@workspace/db";

export async function listReceivedInvitations({ email }: { email: string }) {
  return prisma.invitation.findMany({
    where: {
      // Better Auth lowercases invitation emails on create, so a mixed-case
      // sign-up address would otherwise never match its own invitation.
      email: email.toLowerCase(),
      status: "pending",
      expiresAt: { gt: new Date() },
    },
    include: {
      organization: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export type ListReceivedInvitationsOutput = Awaited<
  ReturnType<typeof listReceivedInvitations>
>;
