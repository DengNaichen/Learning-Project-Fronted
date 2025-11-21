// Export auth components
export { default as LoginPage } from "./components/LoginPage";
export { default as RegisterPage } from "./components/RegisterPage";
export { default as HomePage } from "./components/HomePage";

// Export API functions
export { registerUser, loginUser } from "./api/auth";

// Export types
export type {
  RegistrationRequest,
  LoginRequest,
  RegistrationResponse,
  LoginResponse,
} from "./types/auth";
