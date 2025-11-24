// Export auth components
export { default as LoginPage } from "./components/LoginPage";
export { default as RegisterPage } from "./components/RegisterPage";
export { default as HomePage } from "./components/HomePage";
export { default as ProfilePage } from "./components/ProfilePage";

// Export auth context
export { AuthProvider, useAuth } from "./context/AuthContext";
export type { User } from "./context/AuthContext";

// Export API functions
export { registerUser, loginUser } from "./api/auth";

// Export types
export type {
  RegistrationRequest,
  LoginRequest,
  RegistrationResponse,
  LoginResponse,
} from "./types/auth";
