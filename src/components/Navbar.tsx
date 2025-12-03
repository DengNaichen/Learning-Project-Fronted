import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { AuthModal } from "../features/auth/components/AuthModal";

const Logo = () => (
  <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.219 22c0 0-3.182-5.048.813-10-2.822-5.528.98-10 .98-10l-17.709.01S2.52 7.058-2.094 12.01C-6.052 16.952.135 22 .135 22l21.084-.001z"></path>
  </svg>
);

interface NavLinkProps {
  to: string;
  active?: boolean;
  children: React.ReactNode;
}

function NavLink({ to, active, children }: NavLinkProps) {
  return (
    <Link
      to={to}
      className={active ? "nav-link-active" : "nav-link"}
    >
      {children}
    </Link>
  );
}

function UserAvatarDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  // Prioritize OAuth provider avatars (Google/GitHub), fallback to generated avatar
  const providerAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const displayName = user.user_metadata?.name || user.email || "User";
  const avatarUrl = providerAvatar 
    ? providerAvatar
    : `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=transparent`;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full overflow-hidden bg-bg-muted dark:bg-bg-muted-dark hover:ring-2 hover:ring-primary/50 transition-all duration-200"
      >
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-full h-full object-cover"
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-text-primary dark:text-text-primary-dark truncate">
              {displayName}
            </p>
            <p className="text-xs text-text-secondary dark:text-text-secondary-dark truncate">
              {user.email}
            </p>
          </div>
          <Link
            to="/me"
            className="block px-4 py-2 text-sm text-text-primary dark:text-text-primary-dark hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setIsOpen(false)}
          >
            Profile
          </Link>
          <button
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}

interface NavbarProps {
  showCreateButton?: boolean;
  onCreateClick?: () => void;
}

export function Navbar({ showCreateButton, onCreateClick }: NavbarProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const { isDark, toggle } = useTheme();
  const currentPath = location.pathname;
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const openAuthModal = (mode: "login" | "register") => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const isActive = (path: string) => {
    if (path === "/graphs") {
      return currentPath === "/graphs" || currentPath.startsWith("/graphs/");
    }
    if (path === "/my-graphs") {
      return currentPath === "/my-graphs" || currentPath.startsWith("/my-graphs/");
    }
    return currentPath === path;
  };

  return (
    <div className="sticky top-4 z-50 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
      <header className="nav-header">
        <Link to="/" className="flex items-center gap-4">
        <div className="size-7 text-primary">
          <Logo />
        </div>
        <h2 className="text-lg font-bold leading-tight text-text-primary dark:text-text-primary-dark">
          KnowledgeGraph
        </h2>
      </Link>

      <div className="hidden md:flex flex-1 justify-center gap-8">
        <div className="flex items-center gap-9">
          <NavLink to="/" active={isActive("/")}>
            Home
          </NavLink>
          <NavLink to="/graphs" active={isActive("/graphs")}>
            Explore
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/my-graphs" active={isActive("/my-graphs")}>
                My Graphs
              </NavLink>
              <NavLink to="/notes" active={isActive("/notes")}>
                My Notes
              </NavLink>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          className="w-10 h-10 rounded-full flex items-center justify-center text-text-secondary dark:text-text-secondary-dark hover:bg-bg-muted dark:hover:bg-bg-muted-dark transition-colors"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
        {isLoading ? null : isAuthenticated ? (
          <>
            {showCreateButton && (
              <button onClick={onCreateClick} className="btn-primary btn-md">
                <span className="truncate">Create Graph</span>
              </button>
            )}
            <UserAvatarDropdown />
          </>
        ) : (
          <>
            <button onClick={() => openAuthModal("login")} className="btn-secondary btn-md">
              <span className="truncate">Log In</span>
            </button>
            <button onClick={() => openAuthModal("register")} className="btn-primary btn-md">
              <span className="truncate">Sign Up</span>
            </button>
          </>
        )}
      </div>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
}
