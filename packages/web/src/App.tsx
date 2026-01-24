import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AdminApp } from "./admin/AdminApp";
import { PlayerApp } from "./player/PlayerApp";
import { SpecBrowser } from "./player/pages/SpecBrowser";

/**
 * Simple 404 Not Found component
 */
function NotFound(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <h1 className="text-4xl font-bold text-foreground">404</h1>
      <p className="mt-2 text-muted-foreground">Page not found</p>
      <Link to="/" className="mt-4 text-primary underline hover:no-underline">
        Go home
      </Link>
    </div>
  );
}

/**
 * Main App component with routing
 *
 * Routes:
 * - / : Player-facing spec browser
 * - /admin : Admin tools (import, browse, scoring, migration, profile)
 * - * : 404 catch-all
 */
export function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        {/* Player-facing routes */}
        <Route path="/" element={<PlayerApp />}>
          <Route index element={<SpecBrowser />} />
        </Route>

        {/* Admin routes */}
        <Route path="/admin" element={<AdminApp />} />

        {/* 404 catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Toaster />
    </BrowserRouter>
  );
}
