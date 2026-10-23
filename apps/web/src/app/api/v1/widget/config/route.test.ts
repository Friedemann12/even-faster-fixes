/**
 * Characterization tests: they pin what an installed widget observes today
 * (status, JSON body, headers) on `GET /api/v1/widget/config`, so the step 5
 * move to services behind the route boundary can be proven byte-compatible.
 * They assert on responses only, never on how the handler reaches them.
 *
 * A test here that has to change is a broken contract, not a test to update:
 * widgets already installed on customer sites cannot be forced to update.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  blockRateLimit,
  projectRow,
  resetWidgetApiDoubles,
  widgetApiPrisma,
  widgetRequest,
} from "../../feedback/_helpers/widget-api-test-doubles";

vi.mock("@workspace/db", async () => {
  const { widgetApiPrisma } =
    await import("../../feedback/_helpers/widget-api-test-doubles");
  return { prisma: widgetApiPrisma };
});

const { GET } = await import("./route");

const ROUTE_URL = "https://app.test/api/v1/widget/config";

function configRequest(overrides = {}) {
  return widgetRequest(ROUTE_URL, { method: "GET", ...overrides });
}

beforeEach(() => {
  resetWidgetApiDoubles();
});

describe("GET /api/v1/widget/config", () => {
  it("refuses an unknown project identifier", async () => {
    widgetApiPrisma.project.findFirst.mockResolvedValue(null);

    const response = await GET(configRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("refuses a request with no project identifier at all", async () => {
    const response = await GET(configRequest({ apiKey: null }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(widgetApiPrisma.project.findFirst).not.toHaveBeenCalled();
  });

  it("refuses an origin outside the project's registered domain", async () => {
    const response = await GET(configRequest({ origin: "https://evil.test" }));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Origin not allowed",
    });
  });

  it("refuses a request with no origin and no referer", async () => {
    const response = await GET(configRequest({ origin: null }));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Origin not allowed",
    });
  });

  it("refuses a rate limited reader", async () => {
    blockRateLimit();

    const response = await GET(configRequest());

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Rate limit exceeded. Try again later.",
    });
  });

  // The config is public to the page that embeds the widget: it is read before
  // a Reviewer has a token, so no reviewer token is required.
  it("answers without a reviewer token", async () => {
    const response = await GET(configRequest({ reviewerToken: null }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      enabled: true,
      branding: false,
    });
    expect(widgetApiPrisma.reviewer.findFirst).not.toHaveBeenCalled();
  });

  it("reports the widget as disabled when the project turned it off", async () => {
    widgetApiPrisma.project.findFirst.mockResolvedValue(
      projectRow({ widgetConfig: { enabled: false } }),
    );

    const response = await GET(configRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      enabled: false,
      branding: false,
    });
  });

  it("defaults to enabled when the project has no widget config row", async () => {
    widgetApiPrisma.project.findFirst.mockResolvedValue(
      projectRow({ widgetConfig: null }),
    );

    const response = await GET(configRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ enabled: true });
  });

  // This fork has no Plans, so the branding is always off and no subscription
  // is read.
  it("answers enabled without branding and without reading a subscription", async () => {
    const response = await GET(configRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      enabled: true,
      branding: false,
    });
    expect(widgetApiPrisma.subscription.findFirst).not.toHaveBeenCalled();
  });

  it("accepts a localhost origin so the widget can be tested before deploy", async () => {
    const response = await GET(
      configRequest({ origin: "http://localhost:3000" }),
    );

    expect(response.status).toBe(200);
  });
});
