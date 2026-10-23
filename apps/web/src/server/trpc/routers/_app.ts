import { authenticatedRouter } from "@/app/(authenticated)/trpc-router";
import { authRouter } from "@/app/_domains/auth/trpc-router";
import { organizationRouter } from "@/app/_domains/organization/trpc-router";
import { adminRouter } from "@/app/admin/trpc-router";
import { onboardingRouter } from "@/app/onboarding/trpc-router";
import { router } from "../trpc";

export const appRouter = router({
  auth: authRouter,
  authenticated: authenticatedRouter,
  onboarding: onboardingRouter,
  admin: adminRouter,
  organization: organizationRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
