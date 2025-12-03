import { Link } from "react-router-dom";

interface HeroSectionProps {
  isAuthenticated: boolean;
  onOpenAuthModal: (mode: "login" | "register") => void;
}

export default function HeroSection({ isAuthenticated, onOpenAuthModal }: HeroSectionProps) {
  return (
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
        {isAuthenticated ? (
          <Link to="/my-graphs" className="btn-primary btn-lg">
            <span className="truncate">Start Creating Your Graph</span>
          </Link>
        ) : (
          <button 
            onClick={() => onOpenAuthModal("register")} 
            className="btn-primary btn-lg"
          >
            <span className="truncate">Start Creating Your Graph</span>
          </button>
        )}
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
  );
}
