import { DashboardPageContent } from "@/app/_components/dashboard/dashboard-page-content";
import { HeadlineStrip } from "./_components/headline-strip";
import { EngagedOrganizationsCard } from "./_features/engaged-organizations-card/engaged-organizations-card.client";
import { FeedbackSummary } from "./_features/feedback-summary.client";

// Upstream's self-hosted subset: the revenue, retention and growth panels read
// Stripe and only exist on the cloud instance.
export default function AdminDashboardPage() {
  return (
    <DashboardPageContent
      breadcrumbs={[{ label: "Dashboard", link: "/admin" }]}
    >
      <div className="space-y-4">
        <HeadlineStrip>
          <EngagedOrganizationsCard />
        </HeadlineStrip>

        <FeedbackSummary />
      </div>
    </DashboardPageContent>
  );
}
