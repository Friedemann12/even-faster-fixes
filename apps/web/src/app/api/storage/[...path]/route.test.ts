/**
 * Characterization tests: they pin what a browser observes on
 * `GET /api/storage/<bucket>/<key>` with the local provider (status, headers,
 * body) and which keys are reachable without a token, so widening the route to
 * the other providers can be proven to leave the local path untouched. They
 * assert on responses only, never on how the handler reaches them.
 *
 * The S3 cases pin the contract the other providers add: avatar and logo keys
 * redirect to a short-lived signed URL, everything else stays unreachable.
 */

import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const BUCKET = "uploads-test";
const AVATAR_KEY = "user-avatars/user_1/1700000000000.png";
const LOGO_KEY = "organization-logos/org_1/1700000000000.webp";
const SCREENSHOT_KEY = "feedback-screenshots/feedback_1/shot.png";
const PNG_BYTES = Buffer.from("png-bytes");
const SIGNED_URL = "https://bucket.storage.test/signed?X-Amz-Signature=test";

let storageRoot: string;

// The S3 backend would need bucket credentials; the local backend is reached
// through its own module and stays real.
const getSignedUrlDouble = vi.fn();
vi.mock("@/server/storage", () => ({
  createStorage: () => ({ getSignedUrl: getSignedUrlDouble }),
}));

vi.stubEnv("BETTER_AUTH_SECRET", "secret_characterization");
vi.stubEnv("BETTER_AUTH_URL", "https://app.test");
vi.stubEnv("STORAGE_BUCKET_NAME", BUCKET);
vi.stubEnv("STORAGE_PROVIDER", "local");

const { GET, PUT } = await import("./route");
const { createLocalStorageUrl } = await import("@/server/storage/local-url");

function storageRequest(key: string, init?: RequestInit, token?: string) {
  const url = new URL(`https://app.test/api/storage/${BUCKET}/${key}`);
  if (token) url.searchParams.set("token", token);
  return new Request(url, init);
}

function routeContext(key: string) {
  return { params: Promise.resolve({ path: [BUCKET, ...key.split("/")] }) };
}

function tokenOf(signedUrl: string) {
  return new URL(signedUrl).searchParams.get("token") ?? "";
}

async function writeObject(key: string, body: Buffer) {
  const path = join(storageRoot, BUCKET, key);
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, body);
}

beforeAll(async () => {
  storageRoot = await mkdtemp(join(tmpdir(), "storage-route-"));
  vi.stubEnv("STORAGE_LOCAL_PATH", storageRoot);
  await writeObject(AVATAR_KEY, PNG_BYTES);
  await writeObject(LOGO_KEY, PNG_BYTES);
  await writeObject(SCREENSHOT_KEY, PNG_BYTES);
});

afterEach(() => {
  vi.stubEnv("STORAGE_PROVIDER", "local");
  getSignedUrlDouble.mockReset();
});

afterAll(async () => {
  vi.unstubAllEnvs();
  await rm(storageRoot, { recursive: true, force: true });
});

describe("GET /api/storage with the local provider", () => {
  it("serves a user avatar without a token", async () => {
    const response = await GET(
      storageRequest(AVATAR_KEY),
      routeContext(AVATAR_KEY),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(Buffer.from(await response.arrayBuffer())).toEqual(PNG_BYTES);
  });

  it("serves an organization logo without a token", async () => {
    const response = await GET(
      storageRequest(LOGO_KEY),
      routeContext(LOGO_KEY),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/webp");
  });

  it("refuses a screenshot without a token", async () => {
    const response = await GET(
      storageRequest(SCREENSHOT_KEY),
      routeContext(SCREENSHOT_KEY),
    );

    expect(response.status).toBe(403);
  });

  it("serves a screenshot with a signed token", async () => {
    const signedUrl = createLocalStorageUrl(
      { bucket: BUCKET, key: SCREENSHOT_KEY, method: "GET" },
      60,
    );

    const response = await GET(
      storageRequest(SCREENSHOT_KEY, undefined, tokenOf(signedUrl)),
      routeContext(SCREENSHOT_KEY),
    );

    expect(response.status).toBe(200);
  });

  it("refuses a screenshot with a token signed for another key", async () => {
    const signedUrl = createLocalStorageUrl(
      { bucket: BUCKET, key: AVATAR_KEY, method: "GET" },
      60,
    );

    const response = await GET(
      storageRequest(SCREENSHOT_KEY, undefined, tokenOf(signedUrl)),
      routeContext(SCREENSHOT_KEY),
    );

    expect(response.status).toBe(403);
  });

  it("returns 404 for a missing avatar", async () => {
    const key = "user-avatars/user_1/missing.png";

    const response = await GET(storageRequest(key), routeContext(key));

    expect(response.status).toBe(404);
  });

  it("returns 404 for an avatar with an unsupported extension", async () => {
    const key = "user-avatars/user_1/1700000000000.svg";
    await writeObject(key, PNG_BYTES);

    const response = await GET(storageRequest(key), routeContext(key));

    expect(response.status).toBe(404);
  });

  it("refuses a PUT without a token", async () => {
    const response = await PUT(
      storageRequest(AVATAR_KEY, { method: "PUT", body: PNG_BYTES }),
      routeContext(AVATAR_KEY),
    );

    expect(response.status).toBe(403);
  });
});

describe("GET /api/storage with an S3 provider", () => {
  function useS3() {
    vi.stubEnv("STORAGE_PROVIDER", "s3");
    getSignedUrlDouble.mockResolvedValue(SIGNED_URL);
  }

  it("redirects a user avatar to a signed URL", async () => {
    useS3();

    const response = await GET(
      storageRequest(AVATAR_KEY),
      routeContext(AVATAR_KEY),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(SIGNED_URL);
    expect(response.headers.get("cache-control")).toBe("private, max-age=600");
    expect(getSignedUrlDouble).toHaveBeenCalledWith(
      { bucket: BUCKET, key: AVATAR_KEY },
      3600,
    );
  });

  it("redirects an organization logo to a signed URL", async () => {
    useS3();

    const response = await GET(
      storageRequest(LOGO_KEY),
      routeContext(LOGO_KEY),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(SIGNED_URL);
  });

  it("never signs a screenshot", async () => {
    useS3();

    const response = await GET(
      storageRequest(SCREENSHOT_KEY),
      routeContext(SCREENSHOT_KEY),
    );

    expect(response.status).toBe(404);
    expect(getSignedUrlDouble).not.toHaveBeenCalled();
  });

  it("never signs an avatar with an unsupported extension", async () => {
    useS3();
    const key = "user-avatars/user_1/1700000000000.svg";

    const response = await GET(storageRequest(key), routeContext(key));

    expect(response.status).toBe(404);
    expect(getSignedUrlDouble).not.toHaveBeenCalled();
  });

  it("never signs for a bucket other than the configured one", async () => {
    useS3();
    const otherBucket = "other-bucket";

    const response = await GET(
      new Request(`https://app.test/api/storage/${otherBucket}/${AVATAR_KEY}`),
      {
        params: Promise.resolve({
          path: [otherBucket, ...AVATAR_KEY.split("/")],
        }),
      },
    );

    expect(response.status).toBe(404);
    expect(getSignedUrlDouble).not.toHaveBeenCalled();
  });

  it("refuses a PUT, uploads go straight to the bucket", async () => {
    useS3();

    const response = await PUT(
      storageRequest(AVATAR_KEY, { method: "PUT", body: PNG_BYTES }),
      routeContext(AVATAR_KEY),
    );

    expect(response.status).toBe(404);
    expect(getSignedUrlDouble).not.toHaveBeenCalled();
  });
});
