"use client";

import { defaultRedirect, onboardingUrl } from "@/app/_constants/routes";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { PasswordInput } from "@workspace/ui/components/password-input";
import { PasswordStrengthIndicator } from "@workspace/ui/components/password-strength-indicator";
import { AlertCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { RegisterUserInput } from "@/app/_domains/auth/_services/register-user.schema";
import { RegisterUserSchema } from "@/app/_domains/auth/_services/register-user.schema";

type SignupFormProps = {
  /** Prefilled and locked when the visitor arrived through an invitation link. */
  email?: string;
  invitationId?: string;
};

export function SignupForm({ email, invitationId }: SignupFormProps = {}) {
  const trpc = useTRPC();
  const router = useRouter();

  const form = useForm<RegisterUserInput>({
    resolver: zodResolver(RegisterUserSchema),
    defaultValues: {
      email: email ?? "",
      password: "",
      confirmPassword: "",
    },
  });

  const acceptInvitationMutation = useMutation(
    trpc.authenticated.organization.invitation.accept.mutationOptions({
      onSuccess: () => {
        router.push(defaultRedirect);
        router.refresh();
      },
      onError: (error) => {
        form.setError("root", {
          message:
            error.message ||
            "Your account was created, but joining the organization failed. Open the invitation link again.",
        });
      },
    }),
  );

  const signupMutation = useMutation(
    trpc.auth.registerUser.mutationOptions({
      onError: (error) => {
        const message =
          error.message || "Account creation failed. Please try again.";
        form.setError("root", { message });
      },
      onSuccess: () => {
        // Sign-up signs the user in directly, so the accept call below already
        // carries a session cookie. Without an invitation there is no membership
        // yet, which is what onboarding creates.
        if (invitationId) {
          acceptInvitationMutation.mutate({ invitationId });
          return;
        }

        router.push(onboardingUrl);
      },
    }),
  );

  const isPending =
    signupMutation.isPending || acceptInvitationMutation.isPending;

  const onSubmit = async (data: RegisterUserInput) => {
    signupMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Server Error */}
        {form.formState.errors.root && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              <p>{form.formState.errors.root.message}</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Email Field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  {...field}
                  readOnly={Boolean(email)}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password Field */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder="••••••••"
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <PasswordStrengthIndicator password={field.value} />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm password</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder="••••••••"
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isPending} size="lg">
          {isPending ? "Creating account..." : "Sign up"}
        </Button>
      </form>
    </Form>
  );
}
