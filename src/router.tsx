import { Routes, Route, useLocation } from "react-router-dom";
import { LoginPage, RegisterPage, HomePage, ProfilePage } from "./features/auth";
import {
  GraphList,
  GraphDetail,
  KnowledgeGraphPage,
  MyGraphs,
  MyGraphDetail,
  GraphNotesPage,
} from "./features/graphs";
import { NotesPage } from "./features/notes";
import { ProtectedRoute } from "./components/ProtectedRoute";

export function AppRoutes() {
  const location = useLocation();
  const isNotesPage = location.pathname === "/notes";
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";

  return (
    <div className="min-h-screen">
      <div
        className={
          isNotesPage
            ? "h-screen"
            : isAuthPage
              ? "flex items-center justify-center min-h-screen p-4"
              : ""
        }
      >
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Graph routes - public for viewing */}
          <Route path="/graphs" element={<GraphList />} />
          <Route path="/graphs/:graphId" element={<GraphDetail />} />
          <Route path="/graphs/:graphId/3d" element={<KnowledgeGraphPage />} />
          <Route path="/graphs/:graphId/notes" element={<GraphNotesPage />} />

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
            path="/my-graphs/:graphId/notes"
            element={
              <ProtectedRoute>
                <GraphNotesPage isMyGraph />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notes"
            element={
              <ProtectedRoute>
                <NotesPage />
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
  LOGIN: "/login",
  REGISTER: "/register",
  GRAPHS: "/graphs",
  GRAPH_DETAIL: (id: string) => `/graphs/${id}`,
  GRAPH_3D: (id: string) => `/graphs/${id}/3d`,
  GRAPH_NOTES: (id: string) => `/graphs/${id}/notes`,
  MY_GRAPHS: "/my-graphs",
  MY_GRAPH_DETAIL: (id: string) => `/my-graphs/${id}`,
  MY_GRAPH_3D: (id: string) => `/my-graphs/${id}/3d`,
  MY_GRAPH_NOTES: (id: string) => `/my-graphs/${id}/notes`,
  NOTES: "/notes",
  PROFILE: "/me",
} as const;
