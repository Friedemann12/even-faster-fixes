import { NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import type { Prisma } from "@workspace/db/types";
import { resolveProjectId } from "../../_helpers/resolve-project-id";
import type { CreateFeedbackItemInput } from "../../_services/agent.schema";
import {
  DEFAULT_IMPORT_REVIEWER_NAME,
  upsertImportReviewer,
} from "./upsert-import-reviewer";

type CreateFeedbacksInput = {
  /** Public ID or internal ID, as the caller sent it. */
  project: string;
  /** The projects that Organization owns: the write's whole scope. */
  organizationProjects: Array<{ id: string; publicId: string }>;
  reviewerName?: string;
  source?: string;
  feedbacks: CreateFeedbackItemInput[];
};

/**
 * Bulk-create feedback (used for migrating from other tools like BugHerd,
 * Marker.io, Userback, Usersnap). Skips the `feedback/created` Inngest event
 * so imports don't fan out into integrations (e.g. opening hundreds of GitHub
 * issues).
 */
export async function createFeedbacks(
  {
    project,
    organizationProjects,
    reviewerName,
    source,
    feedbacks,
  }: CreateFeedbacksInput,
  db: typeof prisma = prisma,
) {
  const projectId = resolveProjectId(project, organizationProjects);

  if (!projectId) {
    // No period: this copy is the published agent API contract.
    throw new NotFoundError("Project not found");
  }

  const reviewer = await upsertImportReviewer(
    projectId,
    reviewerName ?? DEFAULT_IMPORT_REVIEWER_NAME,
    db,
  );

  const created = await db.$transaction(
    feedbacks.map((f) => {
      const baseMetadata = f.metadata ?? {};
      const metadata: Prisma.InputJsonObject = source
        ? { ...baseMetadata, source }
        : baseMetadata;
      const hasMetadata = Object.keys(metadata).length > 0;

      return db.feedback.create({
        data: {
          projectId,
          reviewerId: reviewer.id,
          comment: f.comment,
          pageUrl: f.pageUrl,
          status: f.status ?? "new",
          selector: f.selector,
          clickX: f.clickX,
          clickY: f.clickY,
          browserName: f.browserName,
          browserVersion: f.browserVersion,
          os: f.os,
          viewportWidth: f.viewportWidth,
          viewportHeight: f.viewportHeight,
          metadata: hasMetadata ? metadata : undefined,
          createdAt: f.createdAt ? new Date(f.createdAt) : undefined,
        },
        select: {
          id: true,
          status: true,
          comment: true,
          pageUrl: true,
          createdAt: true,
        },
      });
    }),
  );

  // `projectId` and the reviewer travel back so the boundary can name both in
  // its access log without resolving them a second time.
  return {
    projectId,
    feedbacks: created,
    reviewer: { id: reviewer.id, name: reviewer.name },
  };
}

export type CreateFeedbacksOutput = Awaited<ReturnType<typeof createFeedbacks>>;
