import { getStorageObjectUrl } from "./objects";

type AssetForSignedUrl = {
  key: string;
};

// Issue bodies in GitHub and Linear embed the screenshot once and are read for
// months, so the default hour would leave a broken image. Ten years only works
// with the `local` provider, whose URL is an HMAC with an expiry field; S3
// presigning caps at 7 days.
export const ISSUE_SCREENSHOT_URL_EXPIRES_IN = 60 * 60 * 24 * 365 * 10;

export async function getSignedAssetUrl(
  asset: AssetForSignedUrl,
  expiresIn = 3600,
): Promise<string> {
  return getStorageObjectUrl(asset, expiresIn);
}
