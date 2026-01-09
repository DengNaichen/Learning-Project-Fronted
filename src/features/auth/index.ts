// Export auth components
export { default as ProfilePage } from "./pages/ProfilePage";

// Export auth context
export { AuthProvider, useAuth } from "./AuthContext";

// Re-export Supabase types
export type { User, Session } from "@supabase/supabase-js";
