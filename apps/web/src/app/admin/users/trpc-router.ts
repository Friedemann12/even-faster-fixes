import { adminProcedure, router } from "@/server/trpc/trpc";
import { headers } from "next/headers";
import { createUser } from "./_services/create-user";
import { CreateUserSchema } from "./_services/create-user.schema";
import { deleteUser } from "./_services/delete-user";
import { DeleteUserSchema } from "./_services/delete-user.schema";
import { getUserEmail } from "./_services/get-user-email";
import { GetUserEmailSchema } from "./_services/get-user-email.schema";
import { impersonateUser } from "./_services/impersonate-user";
import { ImpersonateUserSchema } from "./_services/impersonate-user.schema";
import { listUserOrganizations } from "./_services/list-user-organizations";
import { ListUserOrganizationsSchema } from "./_services/list-user-organizations.schema";
import { listUsers } from "./_services/list-users";
import { ListUsersSchema } from "./_services/list-users.schema";
import { listUsersForExport } from "./_services/list-users-for-export";
import { ListUsersForExportSchema } from "./_services/list-users-for-export.schema";
import { setPassword } from "./_services/set-password";
import { SetPasswordSchema } from "./_services/set-password.schema";
import { revokeUserSessions } from "./_services/revoke-user-sessions";
import { RevokeUserSessionsSchema } from "./_services/revoke-user-sessions.schema";
import { toggleEmailVerified } from "./_services/toggle-email-verified";
import { ToggleEmailVerifiedSchema } from "./_services/toggle-email-verified.schema";

// The admin role check stays on `adminProcedure`: it is answerable from the
// context alone, so no service of this scope repeats it.
export const usersRouter = router({
  list: adminProcedure
    .input(ListUsersSchema)
    .query(({ input }) => listUsers(input)),
  listForExport: adminProcedure
    .input(ListUsersForExportSchema)
    .query(({ input }) => listUsersForExport(input)),
  create: adminProcedure
    .input(CreateUserSchema)
    .mutation(({ input }) => createUser(input)),
  delete: adminProcedure
    .input(DeleteUserSchema)
    .mutation(({ input }) => deleteUser({ userId: input.userId })),
  impersonate: adminProcedure
    .input(ImpersonateUserSchema)
    .mutation(async ({ input }) =>
      impersonateUser({ userId: input.userId, headers: await headers() }),
    ),
  organizations: router({
    list: adminProcedure
      .input(ListUserOrganizationsSchema)
      .query(({ input }) => listUserOrganizations({ userId: input.userId })),
  }),
  sessions: router({
    revoke: adminProcedure
      .input(RevokeUserSessionsSchema)
      .mutation(async ({ input }) =>
        revokeUserSessions({ userId: input.userId, headers: await headers() }),
      ),
  }),
  password: router({
    set: adminProcedure
      .input(SetPasswordSchema)
      .mutation(async ({ input }) =>
        setPassword({ ...input, headers: await headers() }),
      ),
  }),
  email: router({
    get: adminProcedure
      .input(GetUserEmailSchema)
      .query(({ input }) => getUserEmail({ userId: input.userId })),
    toggleVerified: adminProcedure
      .input(ToggleEmailVerifiedSchema)
      .mutation(({ input }) => toggleEmailVerified(input)),
  }),
});
