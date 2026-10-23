import { beforeEach, describe, expect, it, vi } from "vitest";

// The slug service is a sibling, so it is not mocked: it reaches the Prisma
// singleton instead of taking the `db` parameter, and the boundary that drives
// it is the database package. The real slug generation runs here.
const organizationFindFirst = vi.fn();

vi.mock("@workspace/db", () => ({
  prisma: { organization: { findFirst: organizationFindFirst } },
}));

const { createOrganization } = await import("./create-organization");

type FakeDb = NonNullable<Parameters<typeof createOrganization>[1]>;

function fakeDb() {
  return {
    organization: {
      create: vi.fn().mockResolvedValue({
        id: "org_1",
        name: "Acme",
        slug: "acme",
      }),
    },
  } as unknown as FakeDb;
}

const input = { name: "Acme", ownerId: "user_1" };

describe("createOrganization", () => {
  beforeEach(() => {
    organizationFindFirst.mockReset().mockResolvedValue(null);
  });

  it("creates the organization with its owner", async () => {
    const db = fakeDb();

    await expect(createOrganization(input, db)).resolves.toEqual({
      id: "org_1",
      name: "Acme",
      slug: "acme",
    });
    expect(db.organization.create).toHaveBeenCalledWith({
      data: {
        name: "Acme",
        slug: "acme",
        members: { create: [{ userId: "user_1", role: "owner" }] },
      },
    });
  });
});
