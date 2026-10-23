import { getUniqueOrganizationSlug } from "@/app/_domains/organization/_services/get-unique-organization-slug";
import { assertSignUpAllowed } from "@/server/auth/config/signup-gate";
import { prisma } from "@workspace/db";
import type { BetterAuthOptions } from "better-auth";

export const databaseHooks: NonNullable<BetterAuthOptions["databaseHooks"]> = {
  user: {
    create: {
      before: async (user) => {
        await assertSignUpAllowed(user.email);
      },
      after: async (user) => {
        // The first account owns the instance: nobody else can grant the admin
        // role, and the admin area is where passwords are reset.
        const isFirstUser = (await prisma.user.count()) === 1;

        if (isFirstUser) {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: "admin" },
          });
        }

        const invitation = await prisma.invitation.findFirst({
          where: {
            email: user.email.toLowerCase(),
            status: "pending",
            expiresAt: { gt: new Date() },
          },
          select: { id: true },
        });

        // An invited user joins an existing organization, so a personal one
        // would only shadow it: session.create.before prefers the isDefault org
        // and would drag them back into an empty workspace on every sign-in.
        // Onboarding creates a project and requires the owner role, which an
        // invited member does not have, so it is skipped as well.
        if (invitation) {
          await prisma.user.update({
            where: { id: user.id },
            data: { onboardingCompleted: true },
          });
          return;
        }

        // Generate a unique slug for the default organization
        const organizationSlug =
          await getUniqueOrganizationSlug("My organization");

        // Create a default organization for every new user
        await prisma.organization.create({
          data: {
            name: "My organization",
            slug: organizationSlug,
            isDefault: true,
            members: {
              create: [
                {
                  userId: user.id,
                  role: "owner",
                },
              ],
            },
          },
        });
      },
    },
    update: {
      // Better Auth passes the updated user directly, not { data, oldData }
      after: async (user) => {
        console.info(`[audit] user.updated userId=${user.id}`);
      },
    },
  },

  session: {
    create: {
      before: async (session) => {
        try {
          // Invited users have no default organization of their own, so fall
          // back to the one they were invited into.
          const defaultOrg =
            (await prisma.organization.findFirst({
              where: {
                members: { some: { userId: session.userId } },
                isDefault: true,
              },
            })) ??
            (await prisma.organization.findFirst({
              where: { members: { some: { userId: session.userId } } },
              orderBy: { createdAt: "asc" },
            }));

          // Return the modified session with activeOrganizationId set
          // This directly modifies the session before database persistence
          return {
            data: {
              ...session,
              activeOrganizationId: defaultOrg?.id ?? null,
            },
          };
        } catch (error) {
          console.error(
            "Error setting default organization for user session:",
            error,
          );

          // Return session without active organization on error
          return {
            data: {
              ...session,
              activeOrganizationId: null,
            },
          };
        }
      },
      after: async (session) => {
        console.info(`[audit] session.created userId=${session.userId}`);
      },
    },
  },
};
