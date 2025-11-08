import { useParams, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useGetKnowledgeGraph } from "../hooks/useCourses";
import KnowledgeGraph3D from "./KnowledgeGraph3D";

export default function KnowledgeGraphPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetKnowledgeGraph(courseId);

  const handleBack = () => {
    navigate(`/courses/${courseId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-amber-800">Loading knowledge graph...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Failed to load knowledge graph</div>
          <p className="text-amber-800 mb-4">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <p className="text-amber-800">No data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <div className="bg-amber-100 border-b border-amber-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-amber-700 hover:text-amber-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Course</span>
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-amber-900">
              Knowledge Graph
            </h1>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-4 bg-amber-100 border-b border-amber-200">
        <div className="flex gap-8 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-amber-800">
              Mastery Levels:
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#fceae3' }}></div>
              <span className="text-sm text-amber-700">Low (&lt;33%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#acd8c2' }}></div>
              <span className="text-sm text-amber-700">Medium (33-66%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ec757b' }}></div>
              <span className="text-sm text-amber-700">High (&gt;66%)</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-amber-800">
              Relationships:
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-blue-400"></div>
              <span className="text-sm text-amber-700">Prerequisite</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-purple-400"></div>
              <span className="text-sm text-amber-700">Subtopic</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3D Graph */}
      <div className="h-[calc(100vh-200px)]">
        <KnowledgeGraph3D data={data} />
      </div>
    </div>
  );
}
