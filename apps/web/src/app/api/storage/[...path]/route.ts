import { BadRequestError } from "@/server/errors/domain-errors";
import { getStorageBucket, getStorageProvider } from "@/server/storage/config";
import { LocalStorage } from "@/server/storage/local";
import { verifyLocalStorageAccess } from "@/server/storage/local-url";
import { getStorageObjectUrl } from "@/server/storage/objects";

type Context = { params: Promise<{ path: string[] }> };
const contentTypes: Record<string, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  webp: "image/webp",
};

// A key changes on every new upload, so a cached redirect never shows a stale
// image; the signed URL outlives the cache so a cached redirect still resolves.
const SIGNED_URL_EXPIRES_IN = 3600;
const REDIRECT_MAX_AGE = 600;

// Avatar and logo keys are the only ones readable without a token. Everything
// else (screenshots) is reached through a signed URL only.
function isPublicImageKey(key: string) {
  return /^(user-avatars|organization-logos)\//.test(key);
}

async function storageRequest(req: Request, { params }: Context) {
  const [bucket = "", ...parts] = (await params).path;
  const key = parts.join("/");
  const publicImage = req.method === "GET" && isPublicImageKey(key);
  const contentType = contentTypes[key.split(".").at(-1) ?? ""];

  if (getStorageProvider() !== "local") {
    // Uploads go straight to the bucket. Only avatar and logo reads pass
    // through here, so a private bucket needs no public base URL.
    if (!publicImage || !contentType || bucket !== getStorageBucket()) {
      return new Response(null, { status: 404 });
    }
    return new Response(null, {
      status: 302,
      headers: {
        Location: await getStorageObjectUrl({ key }, SIGNED_URL_EXPIRES_IN),
        "Cache-Control": `private, max-age=${REDIRECT_MAX_AGE}`,
      },
    });
  }

  const access = verifyLocalStorageAccess(
    new URL(req.url).searchParams.get("token"),
    {
      method: req.method,
      bucket,
      key,
    },
  );
  if (!access && !publicImage) return new Response(null, { status: 403 });
  const storage = new LocalStorage();
  try {
    if (req.method === "PUT") {
      if (
        access?.method !== "PUT" ||
        req.headers.get("content-type") !== access.contentType ||
        req.headers.get("content-length") !== String(access.size)
      ) {
        return new Response(null, { status: 400 });
      }
      const body = Buffer.from(await req.arrayBuffer());
      if (body.length !== access.size) {
        return new Response(null, { status: 400 });
      }
      await storage.put({ bucket, key, contentType: access.contentType, body });
      return new Response(null, { status: 204 });
    }
    if (!contentType) return new Response(null, { status: 404 });
    return new Response(await storage.read(bucket, key), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    if (error instanceof BadRequestError) {
      return new Response(error.message, { status: 400 });
    }
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return new Response(null, { status: 404 });
    }
    throw error;
  }
}

export const GET = storageRequest;
export const PUT = storageRequest;
