/**
 * Passphrase Auth UI for Web
 *
 * Uses Jazz's passphrase auth for development and simulator testing.
 * Will be replaced with passkey UI once Jazz passkey PR is merged.
 */

import { wordlist } from "@scure/bip39/wordlists/english.js";
import { usePassphraseAuth } from "jazz-tools/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PassphraseAuthUIProps {
  children: React.ReactNode;
}

export function PassphraseAuthUI({ children }: PassphraseAuthUIProps) {
  const auth = usePassphraseAuth({ wordlist });

  const [step, setStep] = useState<"initial" | "create" | "login">("initial");
  const [loginPassphrase, setLoginPassphrase] = useState("");
  const [name, setName] = useState("");
  const [currentPassphrase, setCurrentPassphrase] = useState(() =>
    auth.generateRandomPassphrase(),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSaved, setConfirmSaved] = useState(false);

  if (auth.state === "signedIn") {
    return <>{children}</>;
  }

  const handleCreateAccount = () => {
    setStep("create");
    setError(null);
  };

  const handleLogin = () => {
    setStep("login");
    setError(null);
  };

  const handleReroll = () => {
    const newPassphrase = auth.generateRandomPassphrase();
    setCurrentPassphrase(newPassphrase);
    setConfirmSaved(false); // Reset confirmation when passphrase changes
  };

  const handleBack = () => {
    setStep("initial");
    setLoginPassphrase("");
    setName("");
    setError(null);
  };

  const handleLoginSubmit = async () => {
    if (!loginPassphrase.trim()) {
      setError("Please enter your passphrase");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await auth.logIn(loginPassphrase.trim());
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid passphrase. Please check and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await auth.registerNewAccount(currentPassphrase, name.trim());
    } catch (err) {
      console.error("Registration error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPassphrase = async () => {
    try {
      await navigator.clipboard.writeText(currentPassphrase);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        {step === "initial" && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Spicy Golf</CardTitle>
              <CardDescription>Web Admin &amp; Tools</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" onClick={handleCreateAccount}>
                Create Account
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleLogin}
              >
                Log In
              </Button>
            </CardContent>
          </>
        )}

        {step === "create" && (
          <>
            <CardHeader>
              <CardTitle>Create Account</CardTitle>
              <CardDescription>
                Save your recovery passphrase securely
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>

              <div className="space-y-2">
                <Label>Recovery Passphrase</Label>
                <p className="text-sm text-muted-foreground">
                  Save this passphrase securely. You'll need it to log in on
                  other devices.
                </p>
                <textarea
                  className="w-full rounded-md border border-input bg-muted p-3 font-mono text-sm"
                  value={currentPassphrase}
                  readOnly
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleReroll}>
                    Generate New
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPassphrase}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="confirm-saved"
                  checked={confirmSaved}
                  onChange={(e) => setConfirmSaved(e.target.checked)}
                  className="mt-1"
                />
                <Label htmlFor="confirm-saved" className="cursor-pointer">
                  I have securely saved my recovery passphrase
                </Label>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleRegister}
                  disabled={isLoading || !confirmSaved}
                >
                  {isLoading ? "Creating..." : "Create Account"}
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {step === "login" && (
          <>
            <CardHeader>
              <CardTitle>Log In</CardTitle>
              <CardDescription>Enter your recovery passphrase</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="passphrase">Passphrase</Label>
                <textarea
                  id="passphrase"
                  className="w-full rounded-md border border-input bg-background p-3 font-mono text-sm"
                  value={loginPassphrase}
                  onChange={(e) => setLoginPassphrase(e.target.value)}
                  placeholder="Enter your passphrase"
                  rows={4}
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleLoginSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Log In"}
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
