import React from "react";
import { useNavigate } from "react-router-dom";
import type { Graph } from "../../../domain/graph";

interface GraphCardProps {
  graph: Graph;
  basePath?: string;
}

// Flowing grainy gradient style
const gradientStyle = {
  backgroundColor: '#faf8ff',
  backgroundImage: `
    radial-gradient(ellipse 150% 100% at 0% 100%, rgba(147, 112, 219, 0.7) 0%, transparent 50%),
    radial-gradient(ellipse 120% 120% at 100% 0%, rgba(64, 196, 255, 0.6) 0%, transparent 45%),
    radial-gradient(ellipse 100% 80% at 80% 80%, rgba(255, 140, 180, 0.5) 0%, transparent 50%),
    radial-gradient(ellipse 80% 100% at 20% 20%, rgba(180, 220, 255, 0.6) 0%, transparent 55%),
    radial-gradient(ellipse 60% 60% at 50% 50%, rgba(230, 200, 255, 0.4) 0%, transparent 60%)
  `,
};

export const GraphCard: React.FC<GraphCardProps> = ({ graph, basePath = "/graphs" }) => {
  const navigate = useNavigate();

  const handleStartLearning = () => {
    navigate(`${basePath}/${graph.graphId}`);
  };

  return (
    <div className="card flex flex-col overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300">
      {/* Card Image - Flowing grainy gradient */}
      <div
        className="relative aspect-video overflow-hidden"
        role="img"
        aria-label={`Visualization for ${graph.graphName}`}
        style={gradientStyle}
      >
        {/* Grain texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.25] mix-blend-overlay"
          style={{
            backgroundImage: `url('data:image/svg+xml,%3Csvg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)"/%3E%3C/svg%3E')`,
          }}
        />

      </div>

      {/* Card Content */}
      <div className="p-5 flex flex-col flex-grow">
        <h4 className="font-bold text-lg mb-2 text-text-primary dark:text-text-primary-dark line-clamp-2">
          {graph.graphName}
        </h4>

        <p className="text-text-secondary dark:text-text-secondary-dark text-sm mb-4 grow">
          {graph.numOfKnowledgeNodes} knowledge nodes to explore
        </p>

        <div className="flex items-center justify-between text-xs text-text-tertiary dark:text-text-tertiary-dark mb-4">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {graph.isPrimary ? "Primary" : "Secondary"}
          </span>

          {graph.isEnrolled && (
            <span className="flex items-center gap-1 text-success">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Enrolled
            </span>
          )}
        </div>

        <button
          onClick={handleStartLearning}
          className={graph.isEnrolled ? "btn-secondary btn-md w-full" : "btn-primary btn-md w-full"}
        >
          <span className="truncate">
            {graph.isEnrolled ? "Continue Learning" : "Start Learning"}
          </span>
        </button>
      </div>
    </div>
  );
};
