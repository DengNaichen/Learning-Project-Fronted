import { useParams, useNavigate } from "react-router-dom";
import { Minimize2 } from "lucide-react";
import { useGetKnowledgeGraph } from "../hooks/useGraphs";
import KnowledgeGraph2D from "../components/KnowledgeGraph2D";
import { ROUTES } from "../../../router";

interface KnowledgeGraphPageProps {
  isMyGraph?: boolean;
}

export default function KnowledgeGraphPage({
  isMyGraph = false,
}: KnowledgeGraphPageProps) {
  const { graphId } = useParams<{ graphId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetKnowledgeGraph(graphId, isMyGraph);

  const handleBack = () => {
    if (isMyGraph) {
      navigate(ROUTES.MY_GRAPH_DETAIL(graphId!));
    } else {
      navigate(ROUTES.GRAPH_DETAIL(graphId!));
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
      {/* Exit Fullscreen Button */}
      <button
        onClick={handleBack}
        className="absolute top-5 right-5 z-20 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/80 backdrop-blur-sm text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors"
        title="Exit fullscreen"
      >
        <Minimize2 size={18} />
      </button>

      {/* Graph */}
      <div className="h-screen">
        <KnowledgeGraph2D data={data} />
      </div>
    </div>
  );
}
