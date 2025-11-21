import { useParams, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useGetKnowledgeGraph } from "../hooks/useGraphs";
import KnowledgeGraph2D from "./KnowledgeGraph3D";

export default function KnowledgeGraphPage() {
  const { graphId } = useParams<{ graphId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetKnowledgeGraph(graphId);

  const handleBack = () => {
    navigate(`/graphs/${graphId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading knowledge graph...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">
            Failed to load knowledge graph
          </div>
          <p className="text-slate-400 mb-4">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Graph
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-slate-400">No data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-white">
              Knowledge Graph
            </h1>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-3 bg-slate-800/30 border-b border-slate-700/50">
        <div className="flex gap-8 flex-wrap items-center">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Mastery
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-slate-300">Low</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-sm text-slate-300">Medium</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-slate-300">High</span>
              </div>
            </div>
          </div>
          <div className="h-4 w-px bg-slate-600"></div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Relations
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-0.5 bg-blue-400 rounded"></div>
                <span className="text-sm text-slate-300">Prerequisite</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-0.5 bg-purple-400 rounded"></div>
                <span className="text-sm text-slate-300">Subtopic</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Graph */}
      <div className="h-[calc(100vh-130px)]">
        <KnowledgeGraph2D data={data} />
      </div>
    </div>
  );
}
