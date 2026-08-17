"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { lovable } from "@/integrations/lovable";
import {
  AUTH_CALLBACK_ROUTE,
  PASSWORD_MIN_LENGTH,
  POST_AUTH_REDIRECT,
} from "@/models/auth/auth.constants";
import { RETURN_TO_PARAM } from "@/lib/auth-routes";
import {
  useCompleteOAuthSignIn,
  useCurrentUser,
  useRequestPasswordReset,
  useSignIn,
  useSignUp,
} from "@/models/auth/auth.hooks";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // The proxy appends ?next= when it turns a guest away from a protected page.
  const returnTo = searchParams.get(RETURN_TO_PARAM) ?? POST_AUTH_REDIRECT;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const { user } = useCurrentUser();
  const { signIn, isSigningIn } = useSignIn();
  const { signUp, isSigningUp } = useSignUp();
  const { completeOAuthSignIn } = useCompleteOAuthSignIn();
  const { requestPasswordReset, isSending } = useRequestPasswordReset();
  const loading = isSigningIn || isSigningUp;

  // Already signed in — nothing to do on this page.
  useEffect(() => {
    if (user) router.replace(returnTo);
  }, [user, router, returnTo]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn({ email, password });
      toast.success("Welcome back");
      router.refresh();
      router.push(returnTo);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const session = await signUp({
        fullName,
        email,
        password,
        emailRedirectTo: `${window.location.origin}${AUTH_CALLBACK_ROUTE}`,
      });
      // No session means Supabase is waiting on an email confirmation.
      if (!session) {
        toast.success("Check your inbox to confirm your email.");
        return;
      }
      toast.success("Account created");
      router.refresh();
      router.push(returnTo);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return toast.error("Enter your email address first");
    try {
      const { message } = await requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}${AUTH_CALLBACK_ROUTE}`,
      });
      toast.success(message);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    // A redirect means the browser is leaving; we resume on the way back.
    if (result.redirected) return;
    if (result.error || !result.tokens) return toast.error("Google sign-in failed");

    try {
      // Hand the tokens to the server immediately — they are never stored here.
      await completeOAuthSignIn(result.tokens);
      toast.success("Welcome back");
      router.refresh();
      router.push(returnTo);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="text-center mb-8">
          <p className="text-primary text-xs tracking-[0.3em] uppercase mb-3">TrimApp</p>
          <h1 className="font-display text-4xl">Welcome</h1>
          <p className="text-muted-foreground mt-2 text-sm">Sign in or create an account to book and shop.</p>
        </div>

        <Button variant="outline" className="w-full mb-4" onClick={handleGoogle}>
          Continue with Google
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4 mt-4">
              <div><Label htmlFor="s-email">Email</Label>
                <Input id="s-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label htmlFor="s-pass">Password</Label>
                <Input id="s-pass" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
              </Button>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isSending}
                className="w-full text-center text-xs text-muted-foreground underline hover:text-foreground disabled:opacity-60"
              >
                {isSending ? "Sending reset link…" : "Forgot your password?"}
              </button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4 mt-4">
              <div><Label htmlFor="u-name">Full name</Label>
                <Input id="u-name" required value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
              <div><Label htmlFor="u-email">Email</Label>
                <Input id="u-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label htmlFor="u-pass">Password</Label>
                <Input id="u-pass" type="password" required minLength={PASSWORD_MIN_LENGTH} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
