/**
 * Base URL of this instance. Set BASE_URL to the public URL in production; the
 * fallback only covers local development.
 */
export function getAppUrl(): string {
  // An empty BASE_URL counts as unset.
  const baseUrl = process.env.BASE_URL ?? "";
  return baseUrl === "" ? "http://localhost:3000" : baseUrl;
}
