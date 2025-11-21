import React from "react";
import { useNavigate } from "react-router-dom";
import type { Graph } from "../types/graph";

interface GraphCardProps {
  graph: Graph;
}

export const GraphCard: React.FC<GraphCardProps> = ({ graph }) => {
  const navigate = useNavigate();

  const handleStartLearning = () => {
    navigate(`/graphs/${graph.graphId}`);
  };

  return (
    <div className="card flex flex-col overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300">
      {/* Card Image - Placeholder gradient */}
      <div
        className="bg-gradient-to-br from-primary via-purple-500 to-pink-500 aspect-video"
        role="img"
        aria-label={`Visualization for ${graph.graphName}`}
      >
        <div className="w-full h-full flex items-center justify-center bg-black/10">
          <svg className="w-16 h-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
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
