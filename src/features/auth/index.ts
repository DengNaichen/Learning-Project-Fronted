// Export auth components
export { default as HomePage } from "./components/HomePage";
export { default as ProfilePage } from "./components/ProfilePage";

// Export auth context
export { AuthProvider, useAuth } from "./context/AuthContext";

// Re-export Supabase types
export type { User, Session } from "@supabase/supabase-js";
