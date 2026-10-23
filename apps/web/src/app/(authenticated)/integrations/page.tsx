import { McpIcon } from "@workspace/ui/components/icons/mcp-icon";
import { DashboardSection } from "@/app/(authenticated)/_features/dashboard/dashboard-section";
import { DashboardPageContent } from "@/app/_components/dashboard/dashboard-page-content";
import { AgentTokensSection } from "./_features/agent-tokens/agent-tokens-section.client";

export default function IntegrationsPage() {
  return (
    <DashboardPageContent breadcrumbs={[{ label: "Integrations" }]}>
      <div className="flex flex-col gap-12">
        <DashboardSection
          title={
            <span className="flex items-center gap-2.5">
              <McpIcon className="size-6 shrink-0" />
              MCP Server
            </span>
          }
          description="API tokens for authenticating the Faster Fixes MCP server."
          cardTitle="MCP Server"
          cardClassName="lg:max-w-lg"
        >
          <AgentTokensSection />
        </DashboardSection>
      </div>
    </DashboardPageContent>
  );
}
