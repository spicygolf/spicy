import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AdminApp } from "./admin/AdminApp";
import { PlayerApp } from "./player/PlayerApp";
import { SpecBrowser } from "./player/pages/SpecBrowser";

/**
 * Main App component with routing
 *
 * Routes:
 * - / : Player-facing spec browser
 * - /admin : Admin tools (import, browse, scoring, migration, profile)
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
      </Routes>

      <Toaster />
    </BrowserRouter>
  );
}
