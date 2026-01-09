import { Routes, Route } from "react-router-dom";
import { ProfilePage } from "./features/auth";
import { HomePage } from "./features/home";
import {
  GraphList,
  GraphDetail,
  KnowledgeGraphPage,
  MyGraphs,
  MyGraphDetail,
} from "./features/graphs";
import { ProtectedRoute } from "./components/routing/ProtectedRoute";
import { AuthCallback } from "./features/auth/pages/AuthCallback";

export function AppRoutes() {
  return (
    <div className="min-h-screen">
      <div>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Graph routes - public for viewing */}
          <Route path="/graphs" element={<GraphList />} />
          <Route path="/graphs/:graphId" element={<GraphDetail />} />
          <Route path="/graphs/:graphId/3d" element={<KnowledgeGraphPage />} />

          {/* Protected routes - require authentication */}
          <Route
            path="/my-graphs"
            element={
              <ProtectedRoute>
                <MyGraphs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-graphs/:graphId"
            element={
              <ProtectedRoute>
                <MyGraphDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-graphs/:graphId/3d"
            element={
              <ProtectedRoute>
                <KnowledgeGraphPage isMyGraph />
              </ProtectedRoute>
            }
          />
          <Route
            path="/me"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
}

// Route constants for consistent navigation
export const ROUTES = {
  HOME: "/",
  GRAPHS: "/graphs",
  GRAPH_DETAIL: (id: string) => `/graphs/${id}`,
  GRAPH_3D: (id: string) => `/graphs/${id}/3d`,
  MY_GRAPHS: "/my-graphs",
  MY_GRAPH_DETAIL: (id: string) => `/my-graphs/${id}`,
  MY_GRAPH_3D: (id: string) => `/my-graphs/${id}/3d`,
  PROFILE: "/me",
} as const;
