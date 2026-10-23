import { adminProcedure, router } from "@/server/trpc/trpc";
import { getFeedbackOverview } from "./_services/get-feedback-overview";
import { getUsageOverview } from "./_services/get-usage-overview";

// The admin role check stays on `adminProcedure`: it is answerable from the
// context alone, so no dashboard service repeats it.
export const dashboardRouter = router({
  getUsageOverview: adminProcedure.query(() =>
    getUsageOverview({ now: new Date() }),
  ),
  getFeedbackOverview: adminProcedure.query(() =>
    getFeedbackOverview({ now: new Date() }),
  ),
});
