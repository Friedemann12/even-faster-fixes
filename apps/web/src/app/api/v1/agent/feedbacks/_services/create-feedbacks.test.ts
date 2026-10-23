import { NotFoundError } from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";
import { createFeedbacks } from "./create-feedbacks";

type FakeDb = NonNullable<Parameters<typeof createFeedbacks>[1]>;

const ORGANIZATION_PROJECTS = [{ id: "project_1", publicId: "proj_public_1" }];
const REVIEWER_ID = "reviewer_1";

const createdRow = {
  id: "feedback_2",
  status: "new",
  comment: "Typo in the footer",
  pageUrl: "https://client.test/",
  createdAt: new Date("2026-01-02T03:04:05.000Z"),
};

const feedbackItem = {
  comment: "Typo in the footer",
  pageUrl: "https://client.test/",
};

/** An existing import reviewer and a transaction that resolves its writes. */
function fakeDb() {
  return {
    feedback: {
      create: vi.fn().mockResolvedValue(createdRow),
    },
    reviewer: {
      findFirst: vi.fn().mockResolvedValue({
        id: REVIEWER_ID,
        name: "Imported feedback",
        isActive: true,
      }),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi
      .fn()
      .mockImplementation(async (operations: Promise<unknown>[]) =>
        Promise.all(operations),
      ),
  } as unknown as FakeDb;
}

describe("createFeedbacks", () => {
  it("reports a project outside the token's organization as not found", async () => {
    const db = fakeDb();

    await expect(
      createFeedbacks(
        {
          project: "someone-elses",
          organizationProjects: ORGANIZATION_PROJECTS,
          feedbacks: [feedbackItem],
        },
        db,
      ),
    ).rejects.toThrow(new NotFoundError("Project not found"));
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("creates the batch and returns the resolved project and reviewer", async () => {
    const db = fakeDb();

    const result = await createFeedbacks(
      {
        project: "proj_public_1",
        organizationProjects: ORGANIZATION_PROJECTS,
        source: "bugherd",
        feedbacks: [feedbackItem],
      },
      db,
    );

    expect(result).toEqual({
      projectId: "project_1",
      feedbacks: [createdRow],
      reviewer: { id: REVIEWER_ID, name: "Imported feedback" },
    });
    expect(db.feedback.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          projectId: "project_1",
          reviewerId: REVIEWER_ID,
          status: "new",
          metadata: { source: "bugherd" },
        }),
      }),
    );
  });
});
