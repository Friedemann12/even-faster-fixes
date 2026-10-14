import { BadRequestError } from "@/server/errors/domain-errors";
import { getStorageProvider } from "@/server/storage/config";
import { LocalStorage } from "@/server/storage/local";
import { verifyLocalStorageAccess } from "@/server/storage/local-url";

type Context = { params: Promise<{ path: string[] }> };
const contentTypes: Record<string, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  webp: "image/webp",
};

async function storageRequest(req: Request, { params }: Context) {
  if (getStorageProvider() !== "local") {
    return new Response(null, { status: 404 });
  }
  const [bucket = "", ...parts] = (await params).path;
  const key = parts.join("/");
  const access = verifyLocalStorageAccess(
    new URL(req.url).searchParams.get("token"),
    {
      method: req.method,
      bucket,
      key,
    },
  );
  const publicImage =
    req.method === "GET" && /^(user-avatars|organization-logos)\//.test(key);
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
    const contentType = contentTypes[key.split(".").at(-1) ?? ""];
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
