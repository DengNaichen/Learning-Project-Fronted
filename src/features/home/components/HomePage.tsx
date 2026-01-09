import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useTheme } from "../../../hooks/useTheme";
import Header from "./Header";
import HeroSection from "./HeroSection";
import HowItWorksSection from "./HowItWorksSection";
import { AuthModal } from "../../auth/components/AuthModal";

export default function HomePage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isDark, toggle } = useTheme();
  const location = useLocation();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const openAuthModal = (mode: "login" | "register") => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const shouldLogin = location.state?.from || searchParams.get("login");
    const shouldRegister = searchParams.get("register");

    if ((shouldLogin || shouldRegister) && !isAuthenticated) {
      if (shouldRegister) {
        setAuthMode("register");
      } else {
        setAuthMode("login");
      }
      setIsAuthModalOpen(true);
      
      // Clear state/params
      if (location.state?.from) {
        window.history.replaceState({}, document.title);
      }
      if (searchParams.get("login") || searchParams.get("register")) {
        searchParams.delete("login");
        searchParams.delete("register");
        const newUrl = window.location.pathname + (searchParams.toString() ? "?" + searchParams.toString() : "");
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [location, isAuthenticated]);

  const providerAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email;
  const avatarUrl = providerAvatar 
    ? providerAvatar
    : displayName
    ? `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=transparent`
    : null;

  return (
    <div className="page-container">
      <div className="layout-container flex h-full grow flex-col">
        <div className="flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col w-full max-w-6xl flex-1 px-4 sm:px-6 lg:px-8">
            <Header
              isAuthenticated={isAuthenticated}
              isLoading={isLoading}
              user={user}
              avatarUrl={avatarUrl}
              isDark={isDark}
              onThemeToggle={toggle}
              onOpenAuthModal={openAuthModal}
            />

            <main className="mt-8 flex flex-col gap-12">
              <HeroSection 
                isAuthenticated={isAuthenticated} 
                onOpenAuthModal={openAuthModal}
              />
              <HowItWorksSection />
            </main>

            <AuthModal
              isOpen={isAuthModalOpen}
              onClose={() => setIsAuthModalOpen(false)}
              initialMode={authMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
