import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../../../hooks/useTheme";

export default function HomePage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isDark, toggle } = useTheme();

  // Generate a cat avatar using DiceBear API based on user name
  const avatarUrl = user?.name
    ? `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=transparent`
    : null;

  return (
    <div className="page-container">
      <div className="layout-container flex h-full grow flex-col">
        <div className="flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col w-full max-w-6xl flex-1 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-border dark:border-border-dark bg-bg-elevated/80 dark:bg-bg-elevated-dark/80 backdrop-blur-sm sticky top-4 z-10 rounded-lg px-6 py-3">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3 text-text-primary dark:text-text-primary-dark">
                  <div className="text-primary size-7">
                    <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21.219 22c0 0-3.182-5.048.813-10-2.822-5.528.98-10 .98-10l-17.709.01S2.52 7.058-2.094 12.01C-6.052 16.952.135 22 .135 22l21.084-.001z"></path>
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold tracking-[-0.015em]">KnowledgeHub</h2>
                </div>
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
                  <Link
                    to="/me"
                    className="w-10 h-10 rounded-full overflow-hidden bg-bg-muted dark:bg-bg-muted-dark hover:ring-2 hover:ring-primary/50 transition-all duration-200"
                  >
                    <img
                      src={avatarUrl || ""}
                      alt={user?.name || "User"}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="btn-secondary btn-md">
                      Log In
                    </Link>
                    <Link to="/register" className="btn-primary btn-md">
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </header>

            {/* Main Content */}
            <main className="mt-8 flex flex-col gap-12">
              {/* Hero Section */}
              <section className="flex flex-col gap-8 text-center items-center py-16 md:py-24">
                <div className="flex flex-col gap-4 items-center">
                  <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] md:text-6xl max-w-3xl text-text-primary dark:text-text-primary-dark">
                    Unlock Knowledge, Visually.
                  </h1>
                  <p className="text-lg font-normal leading-normal text-text-secondary dark:text-text-secondary-dark max-w-2xl">
                    Transform learning into an adventure. Build, explore, and conquer interconnected knowledge graphs in a gamified experience like no other.
                  </p>
                </div>
                <div className="flex-wrap gap-4 flex justify-center">
                  <Link to={isAuthenticated ? "/my-graphs" : "/register"} className="btn-primary btn-lg">
                    <span className="truncate">Start Creating Your Graph</span>
                  </Link>
                  <Link
                    to="/graphs"
                    className="btn-secondary btn-lg border border-border dark:border-border-dark"
                  >
                    <span className="truncate">Explore Sample Graphs</span>
                  </Link>
                </div>
                <img
                  src="/Knowledge-Graph.webp"
                  alt="An abstract visualization of a colorful, interconnected knowledge graph"
                  className="w-full max-w-2xl mt-8"
                />
              </section>

              {/* How It Works Section */}
              <section id="how-it-works" className="py-16 md:py-24 space-y-12">
                <div className="flex flex-col gap-4 text-center items-center">
                  <h2 className="text-3xl font-bold leading-tight tracking-[-0.015em] md:text-4xl text-text-primary dark:text-text-primary-dark">
                    How It Works
                  </h2>
                  <p className="text-lg font-normal leading-normal text-text-secondary dark:text-text-secondary-dark max-w-2xl">
                    Your journey from novice to master in three simple steps.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="card flex flex-col items-center text-center gap-4 p-6">
                    <div className="flex items-center justify-center size-12 rounded-full bg-primary/10 dark:bg-primary/20 text-primary">
                      <span className="material-symbols-outlined text-3xl">edit_square</span>
                    </div>
                    <h3 className="text-xl font-bold text-text-primary dark:text-text-primary-dark">1. Create Your Graph</h3>
                    <p className="text-text-secondary dark:text-text-secondary-dark">
                      Start with a single idea. Our intuitive editor makes it easy to add concepts, connect nodes, and build a visual map of your knowledge.
                    </p>
                  </div>
                  <div className="card flex flex-col items-center text-center gap-4 p-6">
                    <div className="flex items-center justify-center size-12 rounded-full bg-primary/10 dark:bg-primary/20 text-primary">
                      <span className="material-symbols-outlined text-3xl">explore</span>
                    </div>
                    <h3 className="text-xl font-bold text-text-primary dark:text-text-primary-dark">2. Explore &amp; Conquer</h3>
                    <p className="text-text-secondary dark:text-text-secondary-dark">
                      Navigate your graph like a world map. Unlock new areas as you master topics, coloring the map with your progress and revealing the bigger picture.
                    </p>
                  </div>
                  <div className="card flex flex-col items-center text-center gap-4 p-6">
                    <div className="flex items-center justify-center size-12 rounded-full bg-primary/10 dark:bg-primary/20 text-primary">
                      <span className="material-symbols-outlined text-3xl">share</span>
                    </div>
                    <h3 className="text-xl font-bold text-text-primary dark:text-text-primary-dark">3. Share &amp; Collaborate</h3>
                    <p className="text-text-secondary dark:text-text-secondary-dark">
                      Ready to share your creation? Invite others to view your graph or collaborate, building a shared library of knowledge together. (Coming Soon)
                    </p>
                  </div>
                </div>
              </section>

            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
