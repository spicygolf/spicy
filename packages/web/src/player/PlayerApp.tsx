import { useAccount } from "jazz-tools/react";
import { ArrowRight, BookOpen, User } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { PlayerAccount } from "spicylib/schema";
import { Button } from "../components/ui/button";

export function PlayerApp(): React.JSX.Element {
  const location = useLocation();
  const me = useAccount(PlayerAccount, {
    resolve: { root: true, profile: true },
  });

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xl font-bold text-primary">
              Spicy Golf
            </Link>
            <nav className="flex gap-4">
              <Link
                to="/"
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  isActive("/")
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                Game Specs
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {me?.$isLoaded && (
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                {me.profile?.name || "Player"}
              </span>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin">
                Admin
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
