import { SignupForm } from "@/app/(auth)/signup/_features/signup-form/signup-form.client";
import { loginUrl } from "@/app/_constants/routes";
import { auth } from "@/server/auth";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { AcceptInvitationPanel } from "./_features/accept-invitation-panel.client";
import { getPendingInvitation } from "./_services/get-pending-invitation";

export const metadata: Metadata = {
  title: "Invitation",
  description: "Join an organization on this instance",
};

type InviteShellProps = { children: React.ReactNode };

function InviteShell({ children }: InviteShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">{children}</div>
    </div>
  );
}

type InvitePageProps = { params: Promise<{ invitationId: string }> };

export default async function InvitePage({ params }: InvitePageProps) {
  const { invitationId } = await params;
  const invitation = await getPendingInvitation({ invitationId });

  if (!invitation) {
    // Deliberately vague: an unknown id must not reveal whether an organization
    // exists or who was invited.
    return (
      <InviteShell>
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Invitation not valid</h1>
          <p className="text-sm text-muted-foreground">
            This invitation has expired or has already been used. Ask the person
            who invited you for a new link.
          </p>
        </div>
        <div className="text-center text-sm">
          <Link
            href={loginUrl}
            className="font-medium text-primary hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </InviteShell>
    );
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const signedInEmail = session?.user.email.toLowerCase();

  if (session && signedInEmail !== invitation.email.toLowerCase()) {
    return (
      <InviteShell>
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Wrong account</h1>
          <p className="text-sm text-muted-foreground">
            This invitation was sent to {invitation.email}, but you are signed
            in as {session.user.email}. Sign out and open the link again.
          </p>
        </div>
      </InviteShell>
    );
  }

  return (
    <InviteShell>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">
          Join {invitation.organization.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {session
            ? "Accept the invitation to join the organization."
            : `Create your account for ${invitation.email} to continue.`}
        </p>
      </div>

      {session ? (
        <AcceptInvitationPanel invitationId={invitation.id} />
      ) : (
        <>
          <SignupForm email={invitation.email} invitationId={invitation.id} />
          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              Already have an account?{" "}
            </span>
            <Link
              href={`${loginUrl}?nextUrl=/invite/${invitation.id}`}
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </div>
        </>
      )}
    </InviteShell>
  );
}
