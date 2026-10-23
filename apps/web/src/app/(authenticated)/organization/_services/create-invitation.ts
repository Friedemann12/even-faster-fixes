import { buildInviteUrl } from "@/app/_domains/organization/_helpers/build-invite-url";
import { auth } from "@/server/auth";
import { BadRequestError, ForbiddenError } from "@/server/errors/domain-errors";
import { APIError } from "better-auth/api";
import { prisma } from "@workspace/db";
import type { CreateInvitationInput } from "./create-invitation.schema";

export async function createInvitation(
  {
    organizationId,
    email,
    role,
    userId,
    headers,
  }: CreateInvitationInput & {
    organizationId: string;
    userId: string;
    headers: Headers;
  },
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
    throw new ForbiddenError("You do not have permission to invite members.");
  }

  try {
    const invitation = await auth.api.createInvitation({
      body: { email, role, organizationId },
      headers,
    });
    // The link is what the operator needs: this instance sends no invitation
    // mail, so it is copied and forwarded by hand.
    return { ...invitation, inviteUrl: buildInviteUrl(invitation.id) };
  } catch (error) {
    // Better Auth reports an already invited member or an invalid address as a
    // 4xx APIError whose message is the copy the dialog shows. Anything else is
    // an outage and keeps its 500 masking.
    if (error instanceof APIError && error.statusCode < 500) {
      throw new BadRequestError(error.message);
    }

    throw error;
  }
}
