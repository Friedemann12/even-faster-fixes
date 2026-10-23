import { TRPCError } from "@trpc/server";
import { middleware } from "../trpc";

// Upstream gets this from `enforceLimit`, which also checks Plan limits. This
// fork has no Plans, so only the active-Organization half remains: the write
// lands in the session's Organization rather than one the client names.
export const requireActiveOrganization = middleware(async ({ ctx, next }) => {
  const organizationId = (
    ctx.session as {
      session?: { activeOrganizationId?: string | null };
    } | null
  )?.session?.activeOrganizationId;

  if (!organizationId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No active organization selected.",
    });
  }

  return next({ ctx: { organizationId } });
});
