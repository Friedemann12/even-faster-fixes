import type { auth } from "@/server/auth";
import {
  adminClient,
  customSessionClient,
  inferAdditionalFields,
  lastLoginMethodClient,
  organizationClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  updateUser,
  useListOrganizations,
  useActiveOrganization,
  useActiveMember,
  useActiveMemberRole,
  organization,
  getLastUsedLoginMethod,
  isLastUsedLoginMethod,
  changeEmail,
} = createAuthClient({
  plugins: [
    inferAdditionalFields<typeof auth>(),
    customSessionClient<typeof auth>(),
    adminClient(),
    organizationClient(),
    lastLoginMethodClient(),
  ],
});
