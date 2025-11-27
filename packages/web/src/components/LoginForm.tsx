import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { betterAuthClient } from "@/lib/auth-client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        await betterAuthClient.signUp.email(
          { email, password, name: email.split("@")[0] || "User" },
          {
            onSuccess: () => {
              toast({
                title: "Account created",
                description: "You can now sign in with your credentials.",
              });
              setIsSignUp(false);
            },
            onError: (e) => {
              toast({
                title: "Sign up failed",
                description: e.error.message || "Please try again.",
                variant: "destructive",
              });
            },
          },
        );
      } else {
        await betterAuthClient.signIn.email(
          { email, password },
          {
            onSuccess: () => {
              toast({
                title: "Signed in",
                description: "Welcome back!",
              });
            },
            onError: (e) => {
              toast({
                title: "Sign in failed",
                description:
                  e.error.message || "Please check your credentials.",
                variant: "destructive",
              });
            },
          },
        );
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          disabled={loading}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={() => setIsSignUp(!isSignUp)}
        disabled={loading}
      >
        {isSignUp
          ? "Already have an account? Sign in"
          : "Don't have an account? Sign up"}
      </Button>
    </form>
  );
}
