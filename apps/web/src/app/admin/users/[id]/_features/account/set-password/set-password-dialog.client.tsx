"use client";

import { PasswordSchema } from "@/app/_domains/auth/_services/password.schema";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { PasswordInput } from "@workspace/ui/components/password-input";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const FormSchema = z.object({ newPassword: PasswordSchema });
type FormInputs = z.infer<typeof FormSchema>;

type SetPasswordDialogProps = {
  userId: string;
};

export function SetPasswordDialog({ userId }: SetPasswordDialogProps) {
  const trpc = useTRPC();
  const [open, setOpen] = useState(false);

  const form = useForm<FormInputs>({
    resolver: zodResolver(FormSchema),
    defaultValues: { newPassword: "" },
  });

  const setPasswordMutation = useMutation(
    trpc.admin.users.password.set.mutationOptions({
      onSuccess: () => {
        toast.success("Password updated", {
          description: "Share the new password with the user directly.",
        });
        form.reset();
        setOpen(false);
      },
      onError: (error) => {
        toast.error("Error", {
          description: error.message || "Failed to set the password",
        });
      },
    }),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Set password</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set a new password</DialogTitle>
          <DialogDescription>
            This instance sends no email, so there is no reset link. Set a
            password here and pass it to the user through a private channel.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) =>
              setPasswordMutation.mutate({ userId, ...data }),
            )}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="••••••••"
                      {...field}
                      disabled={setPasswordMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={setPasswordMutation.isPending}>
                {setPasswordMutation.isPending ? "Saving..." : "Set password"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
