"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { CopyableText } from "@workspace/ui/components/copyable-text";
import { Input } from "@workspace/ui/components/input";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

const InviteMemberFormSchema = z.object({
  email: z.email("Invalid email address"),
});

type InviteMemberFormInputs = z.infer<typeof InviteMemberFormSchema>;

type InviteMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InviteMemberDialog({
  open,
  onOpenChange,
}: InviteMemberDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<InviteMemberFormInputs>({
    resolver: zodResolver(InviteMemberFormSchema),
    defaultValues: { email: "" },
  });

  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      form.reset();
      setInviteUrl(null);
    }
  };

  const createInvitation = useMutation(
    trpc.authenticated.organization.invitation.create.mutationOptions({
      onSuccess: async (invitation) => {
        await queryClient.invalidateQueries(
          trpc.authenticated.organization.invitation.list.queryFilter(),
        );
        // The dialog stays open: nothing was sent, and the operator still needs
        // to copy the link before closing it.
        setInviteUrl(invitation.inviteUrl);
      },
      onError: (error) => {
        form.setError("root", {
          message: error.message || "Error sending invitation.",
        });
      },
    }),
  );

  const onSubmit = (data: InviteMemberFormInputs) => {
    createInvitation.mutate({
      email: data.email,
      role: "member",
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a member</DialogTitle>
          <DialogDescription>
            Create an invitation link and send it to the person yourself. This
            instance does not send email.
          </DialogDescription>
        </DialogHeader>

        {inviteUrl && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Invitation created. Share this link. It expires in 14 days and
              only works for the invited address.
            </p>
            <CopyableText className="rounded-md border bg-muted px-3 py-2 text-sm">
              {inviteUrl}
            </CopyableText>
            <DialogFooter>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        )}

        {!inviteUrl && (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              {form.formState.errors.root && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.root.message}
                </p>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        disabled={createInvitation.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={createInvitation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createInvitation.isPending}>
                  {createInvitation.isPending ? "Creating..." : "Create link"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
