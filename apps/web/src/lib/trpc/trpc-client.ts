import type { AppRouter } from "@/server/trpc/routers/_app";
import type { QueryClient } from "@tanstack/react-query";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { makeQueryClient } from "./query-client";
import { getAppUrl } from "@/utils/url/get-app-url";

export const { TRPCProvider, useTRPC, useTRPCClient } =
  createTRPCContext<AppRouter>();

let clientQueryClientSingleton: QueryClient | undefined;
export function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  }
  // Browser: use singleton pattern to keep the same query client
  return (clientQueryClientSingleton ??= makeQueryClient());
}

export function getUrl() {
  // Relative in the browser; on the server the app calls itself, so BASE_URL is
  // what the container can actually reach.
  const base = typeof window !== "undefined" ? "" : getAppUrl();
  return `${base}/api/trpc`;
}
