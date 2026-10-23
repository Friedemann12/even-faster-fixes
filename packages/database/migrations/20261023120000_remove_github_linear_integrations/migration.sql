-- DropForeignKey
ALTER TABLE "github_installation" DROP CONSTRAINT "github_installation_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "github_installation" DROP CONSTRAINT "github_installation_installedById_fkey";

-- DropForeignKey
ALTER TABLE "project_github_link" DROP CONSTRAINT "project_github_link_projectId_fkey";

-- DropForeignKey
ALTER TABLE "project_github_link" DROP CONSTRAINT "project_github_link_gitHubInstallationId_fkey";

-- DropForeignKey
ALTER TABLE "feedback_issue_link" DROP CONSTRAINT "feedback_issue_link_feedbackId_fkey";

-- DropForeignKey
ALTER TABLE "feedback_issue_link" DROP CONSTRAINT "feedback_issue_link_projectGitHubLinkId_fkey";

-- DropForeignKey
ALTER TABLE "linear_installation" DROP CONSTRAINT "linear_installation_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "linear_installation" DROP CONSTRAINT "linear_installation_installedById_fkey";

-- DropForeignKey
ALTER TABLE "project_linear_link" DROP CONSTRAINT "project_linear_link_projectId_fkey";

-- DropForeignKey
ALTER TABLE "project_linear_link" DROP CONSTRAINT "project_linear_link_linearInstallationId_fkey";

-- DropForeignKey
ALTER TABLE "feedback_linear_issue_link" DROP CONSTRAINT "feedback_linear_issue_link_feedbackId_fkey";

-- DropForeignKey
ALTER TABLE "feedback_linear_issue_link" DROP CONSTRAINT "feedback_linear_issue_link_projectLinearLinkId_fkey";

-- DropTable
DROP TABLE "github_installation";

-- DropTable
DROP TABLE "project_github_link";

-- DropTable
DROP TABLE "feedback_issue_link";

-- DropTable
DROP TABLE "linear_installation";

-- DropTable
DROP TABLE "project_linear_link";

-- DropTable
DROP TABLE "feedback_linear_issue_link";

