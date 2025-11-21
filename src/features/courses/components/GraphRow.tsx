import React from "react";
import type { Graph } from "../types/graph";

interface GraphRowProps {
  graph: Graph;
}

export const GraphRow: React.FC<GraphRowProps> = ({ graph }) => {
  return (
    <div className="flex items-center justify-between gap-4 py-3 px-2 border-b border-gray-200 transition-colors hover:bg-gray-50">
      <div className="flex flex-col gap-1">
        <span className="text-base font-semibold text-gray-900">
          {graph.graphName}
        </span>

        <span className="text-sm text-gray-500">
          {graph.numOfKnowledgeNodes} nodes
        </span>
      </div>

      <span className="text-gray-300">&gt;</span>
    </div>
  );
};
