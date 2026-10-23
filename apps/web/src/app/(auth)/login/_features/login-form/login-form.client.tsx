"use client";

import { defaultRedirect } from "@/app/_constants/routes";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
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
import { AlertCircleIcon } from "lucide-react";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import type { SignInUserInput } from "@/app/_domains/auth/_services/sign-in-user.schema";
import { SignInUserSchema } from "@/app/_domains/auth/_services/sign-in-user.schema";

export function LoginForm() {
  const trpc = useTRPC();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("nextUrl");

  const form = useForm<SignInUserInput>({
    resolver: zodResolver(SignInUserSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation(
    trpc.auth.signInUser.mutationOptions({
      onError: (error) => {
        const message = error.message || "Sign in failed. Please try again.";
        form.setError("root", { message });
      },
      onSuccess: () => {
        router.push(
          (nextUrl === null || nextUrl === ""
            ? defaultRedirect
            : nextUrl) as Route,
        );
      },
    }),
  );

  const onSubmit = async (data: { email: string; password: string }) => {
    loginMutation.mutate(data);
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
                  disabled={loginMutation.isPending}
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
                  disabled={loginMutation.isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={loginMutation.isPending}
          size="lg"
        >
          {loginMutation.isPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </Form>
  );
}
