import { getStorageObjectUrl } from "@/server/storage/objects";

type RouteParams = { params: Promise<{ key: string[] }> };

// Kept after the move to upstream's storage layer: GitHub and Linear issues
// created before it embed `/api/assets/<key>` and are never rewritten. Same
// exposure as before (unauthenticated, random keys), now as a short redirect
// to the signed `/api/storage` URL.
export async function GET(_request: Request, { params }: RouteParams) {
  const { key } = await params;

  return new Response(null, {
    status: 302,
    headers: {
      Location: await getStorageObjectUrl({ key: key.join("/") }, 3600),
      "Cache-Control": "private, max-age=600",
    },
  });
}
