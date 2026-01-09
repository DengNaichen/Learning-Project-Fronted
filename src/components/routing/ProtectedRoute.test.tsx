import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAuth } from "../../features/auth/AuthContext";

vi.mock("../../features/auth/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

const renderWithRoutes = () =>
  render(
    <MemoryRouter initialEntries={["/protected"]}>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <div>Secret</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );

describe("ProtectedRoute", () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
  });

  it("renders a loading state while auth is loading", () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      session: null,
      user: null,
      logout: vi.fn(),
    });

    renderWithRoutes();

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("redirects to home when unauthenticated", async () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      session: null,
      user: null,
      logout: vi.fn(),
    });

    renderWithRoutes();

    expect(await screen.findByText("Home")).toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      session: null,
      user: null,
      logout: vi.fn(),
    });

    renderWithRoutes();

    expect(screen.getByText("Secret")).toBeInTheDocument();
  });
});
