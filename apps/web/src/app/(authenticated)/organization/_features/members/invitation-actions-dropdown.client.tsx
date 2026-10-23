"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Clipboard, MoreHorizontal, X } from "lucide-react";
import { toast } from "sonner";

type InvitationActionsDropdownProps = {
  invitationId: string;
  inviteUrl: string;
};

export function InvitationActionsDropdown({
  invitationId,
  inviteUrl,
}: InvitationActionsDropdownProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const cancelInvitation = useMutation(
    trpc.authenticated.organization.invitation.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.authenticated.organization.invitation.list.queryFilter(),
        );
        toast.success("Invitation canceled");
      },
      onError: (error) => {
        toast.error(error.message || "Error canceling invitation.");
      },
    }),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={cancelInvitation.isPending}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={async () => {
            await navigator.clipboard.writeText(inviteUrl);
            toast.success("Invite link copied");
          }}
        >
          <Clipboard className="size-4" />
          Copy invite link
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => cancelInvitation.mutate({ invitationId })}
          variant="destructive"
        >
          <X className="size-4" />
          Cancel invitation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
