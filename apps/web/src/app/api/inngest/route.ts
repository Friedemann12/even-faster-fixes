import { inngest } from "@/server/inngest";
import { createGitHubIssue } from "@/app/_domains/integration/_services/github/create-github-issue.inngest";
import { createLinearIssue } from "@/app/_domains/integration/_services/linear/create-linear-issue.inngest";
import { handleLinearOAuthRevoked } from "@/app/_domains/integration/_services/linear/handle-linear-oauth-revoked.inngest";
import { syncFeedbackStatusToGitHub } from "@/app/_domains/integration/_services/github/sync-feedback-status-to-github.inngest";
import { syncFeedbackStatusToLinear } from "@/app/_domains/integration/_services/linear/sync-feedback-status-to-linear.inngest";
import { syncGitHubIssueStatus } from "@/app/_domains/integration/_services/github/sync-github-issue-status.inngest";
import { syncLinearIssueStatus } from "@/app/_domains/integration/_services/linear/sync-linear-issue-status.inngest";
import { serve } from "inngest/next";

// Required by v4 checkpointing: client maxRuntime ("50s") must sit below this.
export const maxDuration = 60;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    createGitHubIssue,
    syncGitHubIssueStatus,
    syncFeedbackStatusToGitHub,
    createLinearIssue,
    syncLinearIssueStatus,
    syncFeedbackStatusToLinear,
    handleLinearOAuthRevoked,
  ],
});
