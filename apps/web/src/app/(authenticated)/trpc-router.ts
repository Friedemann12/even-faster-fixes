import { projectsRouter } from "@/app/(authenticated)/(project)/trpc-router";
import { accountRouter } from "@/app/(authenticated)/account/trpc-router";
import { integrationsRouter } from "@/app/(authenticated)/integrations/trpc-router";
import { organizationRouter } from "@/app/(authenticated)/organization/trpc-router";
import { requireActiveOrganization } from "@/server/trpc/middlewares/require-active-organization";
import { protectedProcedure, router } from "@/server/trpc/trpc";
import { createProject } from "./_services/create-project";
import { CreateProjectSchema } from "./_services/create-project.schema";

export const authenticatedRouter = router({
  account: accountRouter,
  organization: organizationRouter,
  integrations: integrationsRouter,
  projects: projectsRouter,

  // The operation the authenticated shell owns itself: the sidebar's
  // create-project dialog.
  createProject: protectedProcedure
    .use(requireActiveOrganization)
    .input(CreateProjectSchema)
    .mutation(({ input, ctx }) =>
      createProject({
        organizationId: ctx.organizationId,
        userId: ctx.session.user.id,
        name: input.name,
        domain: input.domain,
      }),
    ),
});
