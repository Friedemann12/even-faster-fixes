import { checkRateLimit } from "@/server/rate-limit/check-rate-limit";
import type { NextResponse } from "next/server";
import { agentError } from "../_helpers/agent-error";
import { type AgentScope, hasAgentScope } from "../_helpers/has-agent-scope";
import {
  type AuthenticatedAgentToken,
  findAgentToken,
} from "./find-agent-token";
import { updateAgentTokenLastUsed } from "./update-agent-token-last-used";

type AgentRateLimitKey = "agent:read" | "agent:write";

/**
 * Authenticates an agent request, checks scope, and applies rate limiting.
 * Returns the resolved token on success, or a `NextResponse` to short-circuit
 * the handler with the appropriate error.
 *
 * The one agent API service allowed to return a response: its 401, 403 and 429
 * carry headers and extra body fields a `DomainError` cannot express.
 *
 * The rate limit is an abuse backstop, not authorization (see docs/adr/0007):
 * keyed per organization (not per token: minting tokens must not multiply the
 * budget), with one fixed ceiling because this fork has no plans.
 */
export async function requireAgentAuth(
  authHeader: string | null,
  scope: AgentScope,
  rateLimitKey: AgentRateLimitKey,
): Promise<AuthenticatedAgentToken | NextResponse> {
  const agentToken = await findAgentToken(authHeader);
  if (!agentToken) {
    return agentError("Unauthorized", "UNAUTHORIZED", 401);
  }

  // Not awaited: the stamp is usage telemetry, and a slow or failing write on
  // it must not slow down or fail the request it describes.
  updateAgentTokenLastUsed(agentToken.id).catch(() => {});

  if (!hasAgentScope(agentToken.scopes, scope)) {
    return agentError("Insufficient permissions", "FORBIDDEN", 403);
  }

  {
    const kind = rateLimitKey === "agent:write" ? "write" : "read";

    const result = await checkRateLimit(
      agentToken.organization.id,
      rateLimitKey,
    );

    if (!result.allowed) {
      const resetIso = new Date(result.resetAt).toISOString();
      return agentError(
        `Rate limit exceeded. 0 of ${result.limit} ${kind} operations remaining this hour. Retry after ${result.retryAfterSeconds} seconds (window resets at ${resetIso}).`,
        "RATE_LIMITED",
        429,
        {
          headers: {
            "Retry-After": String(result.retryAfterSeconds),
            "X-RateLimit-Limit": String(result.limit),
            "X-RateLimit-Remaining": String(result.remaining),
            "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
          },
          extra: {
            limit: result.limit,
            remaining: result.remaining,
            retryAfterSeconds: result.retryAfterSeconds,
            resetAt: resetIso,
          },
        },
      );
    }
  }

  return agentToken;
}
