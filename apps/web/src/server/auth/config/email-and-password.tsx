import type { BetterAuthOptions } from "better-auth";

export const emailAndPassword: NonNullable<
  BetterAuthOptions["emailAndPassword"]
> = {
  enabled: true,

  // This instance has no mail channel, so a verification link could never be
  // delivered. Requiring verification would lock every account out permanently.
  requireEmailVerification: false,

  autoSignIn: true,
};
