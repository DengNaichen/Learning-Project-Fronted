import { Link } from "react-router-dom";

interface HeaderProps {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any; // Using any to avoid complex type imports for now, or import User type
  avatarUrl: string | null;
  isDark: boolean;
  onThemeToggle: () => void;
  onOpenAuthModal: (mode: "login" | "register") => void;
}

export default function Header({ 
  isAuthenticated, 
  isLoading, 
  user, 
  avatarUrl, 
  isDark, 
  onThemeToggle, 
  onOpenAuthModal 
}: HeaderProps) {
  // Internal state removed, controlled by parent

  return (
    <>
      <header className="flex items-center justify-between whitespace-nowrap border-b border-border dark:border-border-dark bg-bg-elevated/80 dark:bg-bg-elevated-dark/80 backdrop-blur-sm sticky top-4 z-10 rounded-lg px-6 py-3">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3 text-text-primary dark:text-text-primary-dark hover:opacity-80 transition-opacity">
            <div className="text-primary size-7">
              <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.219 22c0 0-3.182-5.048.813-10-2.822-5.528.98-10 .98-10l-17.709.01S2.52 7.058-2.094 12.01C-6.052 16.952.135 22 .135 22l21.084-.001z"></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold tracking-[-0.015em]">KnowledgeHub</h2>
          </Link>
          <div className="hidden md:flex items-center gap-9">
            <a className="nav-link" href="#how-it-works">
              How It Works
            </a>
            <Link to="/graphs" className="nav-link">
              Explore
            </Link>
          </div>
        </div>
        <div className="flex flex-1 justify-end gap-3 items-center">
          <button
            onClick={onThemeToggle}
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
          {isLoading ? (
            <div className="w-10 h-10 rounded-full bg-bg-muted dark:bg-bg-muted-dark animate-pulse" />
          ) : isAuthenticated ? (
            <Link
              to="/me"
              className="w-10 h-10 rounded-full overflow-hidden bg-bg-muted dark:bg-bg-muted-dark hover:ring-2 hover:ring-primary/50 transition-all duration-200"
            >
              <img
                src={avatarUrl || ""}
                alt={user?.email || "User"}
                className="w-full h-full object-cover"
              />
            </Link>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={() => onOpenAuthModal("login")} 
                className="btn-secondary btn-md"
              >
                Sign In
              </button>
              <button 
                onClick={() => onOpenAuthModal("register")} 
                className="btn-primary btn-md"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
