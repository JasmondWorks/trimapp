"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/SiteHeader";
import { StatusScreen } from "@/components/StatusScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PASSWORD_MIN_LENGTH, POST_AUTH_REDIRECT } from "@/models/auth/auth.constants";
import { useCurrentUser, useUpdatePassword } from "@/models/auth/auth.hooks";

/**
 * Sets a new password.
 *
 * A recovery link signs the user in first (that is how Supabase's flow works),
 * so this page requires a session and simply updates the password on it. It is
 * also reachable from the account area by anyone already signed in.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const { user, isLoading } = useCurrentUser();
  const { updatePassword, isUpdating } = useUpdatePassword();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updatePassword({ password, confirmPassword });
      toast.success("Password updated");
      router.push(POST_AUTH_REDIRECT);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  if (isLoading) {
    return (
      <div role="status" className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  // No session means the recovery link never completed — there is nothing to
  // update, and letting the form render would only fail on submit.
  if (!user) {
    return (
      <StatusScreen
        title="This reset link has expired"
        description="Password reset links are single-use and time-limited. Request a fresh one from the sign-in page."
        primaryAction={{ label: "Request a new link", href: "/auth" }}
        secondaryAction={{ label: "Go home", href: "/" }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-display text-3xl">Set a new password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Signed in as {user.email}. Choose a password of at least {PASSWORD_MIN_LENGTH} characters.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={PASSWORD_MIN_LENGTH}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            disabled={isUpdating}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
