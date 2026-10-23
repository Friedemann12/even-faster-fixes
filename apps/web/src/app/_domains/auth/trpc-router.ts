import {
  protectedProcedure,
  publicProcedure,
  router,
} from "@/server/trpc/trpc";
import { headers } from "next/headers";
import { registerUser } from "./_services/register-user";
import { RegisterUserSchema } from "./_services/register-user.schema";
import { signInUser } from "./_services/sign-in-user";
import { SignInUserSchema } from "./_services/sign-in-user.schema";
import { stopImpersonate } from "./_services/stop-impersonate";

export const authRouter = router({
  signInUser: publicProcedure
    .input(SignInUserSchema)
    .mutation(({ input }) => signInUser(input)),

  registerUser: publicProcedure
    .input(RegisterUserSchema)
    .mutation(({ input }) => registerUser(input)),

  stopImpersonate: protectedProcedure.mutation(async () =>
    stopImpersonate({ headers: await headers() }),
  ),
});
