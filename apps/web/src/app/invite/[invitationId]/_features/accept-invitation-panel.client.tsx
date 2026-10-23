"use client";

import { defaultRedirect } from "@/app/_constants/routes";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation } from "@tanstack/react-query";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { AlertCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";

type AcceptInvitationPanelProps = {
  invitationId: string;
};

export function AcceptInvitationPanel({
  invitationId,
}: AcceptInvitationPanelProps) {
  const trpc = useTRPC();
  const router = useRouter();

  const acceptInvitationMutation = useMutation(
    trpc.authenticated.organization.invitation.accept.mutationOptions({
      onSuccess: () => {
        router.push(defaultRedirect);
        router.refresh();
      },
    }),
  );

  return (
    <div className="space-y-4">
      {acceptInvitationMutation.error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            <p>{acceptInvitationMutation.error.message}</p>
          </AlertDescription>
        </Alert>
      )}

      <Button
        className="w-full"
        size="lg"
        disabled={acceptInvitationMutation.isPending}
        onClick={() => acceptInvitationMutation.mutate({ invitationId })}
      >
        {acceptInvitationMutation.isPending
          ? "Joining..."
          : "Accept invitation"}
      </Button>
    </div>
  );
}
