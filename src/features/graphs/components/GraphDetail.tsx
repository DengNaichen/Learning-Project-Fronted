import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useGetGraph, useEnrollInGraph, useGetKnowledgeGraph } from "../hooks/useGraphs";
import { QuestionPage } from "../../questions";
import { ROUTES } from "../../../router";
import KnowledgeGraph2D from "./KnowledgeGraph3D";

export const GraphDetail: React.FC = () => {
  const { graphId } = useParams<{ graphId: string }>();
  const navigate = useNavigate();
  const [showQuiz, setShowQuiz] = useState(false);
  const [activeTab, setActiveTab] = useState<"quiz" | "reviews">("quiz");

  const {
    data: graph,
    isLoading,
    isError: isGraphError,
    error: graphError,
  } = useGetGraph(graphId);

  const {
    mutate: enroll,
    isPending: isEnrolling,
    isError: isEnrollError,
    error: enrollError,
  } = useEnrollInGraph();

  const { data: knowledgeGraphData, isLoading: isGraphDataLoading } =
    useGetKnowledgeGraph(graphId);


  const handleEnrollClick = () => {
    if (graphId) {
      enroll(graphId);
    }
  };

  const handleStartQuiz = () => {
    setShowQuiz(true);
  };

  const handleBackToCourse = () => {
    setShowQuiz(false);
  };

  const handleViewKnowledgeGraph = () => {
    navigate(ROUTES.GRAPH_3D(graphId!));
  };

  const handleViewNotes = () => {
    navigate(ROUTES.GRAPH_NOTES(graphId!));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mb-4 mx-auto"></div>
              <p className="text-text-secondary-light dark:text-text-secondary-dark text-lg">
                Loading graph details...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isGraphError) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-8 text-center shadow-lg">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-text-error-light dark:text-text-error-dark mb-4">
                Error Loading Graph
              </h2>
              <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
                {(graphError as Error).message}
              </p>
              <Link
                to="/graphs"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                Back to Graph List
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!graph) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-8 text-center shadow-lg">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
                Graph not found
              </h2>
              <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
                The graph with ID "{graphId}" does not exist.
              </p>
              <Link
                to="/graphs"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                Back to Graph List
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show Question Page if started
  if (showQuiz && graphId) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <div className="container mx-auto px-4 py-6">
          <button
            onClick={handleBackToCourse}
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium mb-4"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Graph Details
          </button>
        </div>
        <QuestionPage graphId={graphId} />
      </div>
    );
  }

  // Calculate mock progress (you can replace this with real data later)
  const mockProgress = graph.isEnrolled ? 0 : 0;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-300 dark:border-gray-700 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 text-text-primary-light dark:text-text-primary-dark">
              <div className="size-6 text-primary">
                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.8261 17.4264C16.7203 18.1174 20.2244 18.5217 24 18.5217C27.7756 18.5217 31.2797 18.1174 34.1739 17.4264C36.9144 16.7722 39.9967 15.2331 41.3563 14.1648L24.8486 40.6391C24.4571 41.267 23.5429 41.267 23.1514 40.6391L6.64374 14.1648C8.00331 15.2331 11.0856 16.7722 13.8261 17.4264Z" fill="currentColor"></path>
                  <path clipRule="evenodd" d="M39.998 12.236C39.9944 12.2537 39.9875 12.2845 39.9748 12.3294C39.9436 12.4399 39.8949 12.5741 39.8346 12.7175C39.8168 12.7597 39.7989 12.8007 39.7813 12.8398C38.5103 13.7113 35.9788 14.9393 33.7095 15.4811C30.9875 16.131 27.6413 16.5217 24 16.5217C20.3587 16.5217 17.0125 16.131 14.2905 15.4811C12.0012 14.9346 9.44505 13.6897 8.18538 12.8168C8.17384 12.7925 8.16216 12.767 8.15052 12.7408C8.09919 12.6249 8.05721 12.5114 8.02977 12.411C8.00356 12.3152 8.00039 12.2667 8.00004 12.2612C8.00004 12.261 8 12.2607 8.00004 12.2612C8.00004 12.2359 8.0104 11.9233 8.68485 11.3686C9.34546 10.8254 10.4222 10.2469 11.9291 9.72276C14.9242 8.68098 19.1919 8 24 8C28.8081 8 33.0758 8.68098 36.0709 9.72276C37.5778 10.2469 38.6545 10.8254 39.3151 11.3686C39.9006 11.8501 39.9857 12.1489 39.998 12.236ZM4.95178 15.2312L21.4543 41.6973C22.6288 43.5809 25.3712 43.5809 26.5457 41.6973L43.0534 15.223C43.0709 15.1948 43.0878 15.1662 43.104 15.1371L41.3563 14.1648C43.104 15.1371 43.1038 15.1374 43.104 15.1371L43.1051 15.135L43.1065 15.1325L43.1101 15.1261L43.1199 15.1082C43.1276 15.094 43.1377 15.0754 43.1497 15.0527C43.1738 15.0075 43.2062 14.9455 43.244 14.8701C43.319 14.7208 43.4196 14.511 43.5217 14.2683C43.6901 13.8679 44 13.0689 44 12.2609C44 10.5573 43.003 9.22254 41.8558 8.2791C40.6947 7.32427 39.1354 6.55361 37.385 5.94477C33.8654 4.72057 29.133 4 24 4C18.867 4 14.1346 4.72057 10.615 5.94478C8.86463 6.55361 7.30529 7.32428 6.14419 8.27911C4.99695 9.22255 3.99999 10.5573 3.99999 12.2609C3.99999 13.1275 4.29264 13.9078 4.49321 14.3607C4.60375 14.6102 4.71348 14.8196 4.79687 14.9689C4.83898 15.0444 4.87547 15.1065 4.9035 15.1529C4.91754 15.1762 4.92954 15.1957 4.93916 15.2111L4.94662 15.223L4.95178 15.2312ZM35.9868 18.996L24 38.22L12.0131 18.996C12.4661 19.1391 12.9179 19.2658 13.3617 19.3718C16.4281 20.1039 20.0901 20.5217 24 20.5217C27.9099 20.5217 31.5719 20.1039 34.6383 19.3718C35.082 19.2658 35.5339 19.1391 35.9868 18.996Z" fill="currentColor" fillRule="evenodd"></path>
                </svg>
              </div>
              <h2 className="text-lg font-bold">KnowledgeGraph</h2>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="hidden md:block text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark text-sm font-medium transition-colors">
              Home
            </Link>
            <Link to="/graphs" className="text-text-primary-light dark:text-text-primary-dark text-sm font-medium">
              Browse
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Link to="/" className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-medium hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors">
            Home
          </Link>
          <span className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-medium">/</span>
          <Link to="/graphs" className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-medium hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors">
            Graphs
          </Link>
          <span className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-medium">/</span>
          <span className="text-text-primary-light dark:text-text-primary-dark text-sm font-medium">
            {graph.graphName}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Information Pane */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h1 className="text-text-primary-light dark:text-text-primary-dark text-4xl font-black leading-tight tracking-tight">
                {graph.graphName}
              </h1>
              <p className="text-text-secondary-light dark:text-text-secondary-dark text-base leading-normal">
                Explore the knowledge graph with {graph.numOfKnowledgeNodes} interconnected concepts.
              </p>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="flex flex-col gap-2 rounded-xl p-4 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700">
                <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-medium">
                  Nodes
                </p>
                <p className="text-text-primary-light dark:text-text-primary-dark text-2xl font-bold">
                  {graph.numOfKnowledgeNodes}
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl p-4 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700">
                <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-medium">
                  Status
                </p>
                <p className={`text-2xl font-bold ${graph.isEnrolled ? "text-green-600" : "text-orange-600"}`}>
                  {graph.isEnrolled ? "✓" : "○"}
                </p>
              </div>
            </div>

            {/* Progress Section - Only show if enrolled */}
            {graph.isEnrolled && (
              <div className="flex flex-col gap-3 p-4 rounded-xl bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <p className="text-text-primary-light dark:text-text-primary-dark font-medium">
                    Your Progress
                  </p>
                  <p className="text-primary font-bold">{mockProgress}%</p>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${mockProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Description */}
            <p className="text-text-secondary-light dark:text-text-secondary-dark text-base leading-relaxed p-4 rounded-xl bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700">
              This graph provides a comprehensive understanding of the topic through interconnected knowledge nodes.
              Navigate through concepts, test your understanding with quizzes, and visualize relationships in 3D.
            </p>

            {/* Action Button */}
            {!graph.isEnrolled ? (
              <button
                onClick={handleEnrollClick}
                disabled={isEnrolling}
                className="w-full flex items-center justify-center gap-2 h-14 px-6 text-lg font-bold text-white bg-primary rounded-xl hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEnrolling ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    Enrolling...
                  </>
                ) : (
                  <>
                    Start Learning
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleViewKnowledgeGraph}
                  className="w-full flex items-center justify-center gap-2 h-14 px-6 text-lg font-bold text-white bg-purple-600 rounded-xl hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-600/30 transition-colors"
                >
                  <span className="material-symbols-outlined">account_tree</span>
                  View 3D Graph
                </button>
                <button
                  onClick={handleStartQuiz}
                  className="w-full flex items-center justify-center gap-2 h-14 px-6 text-lg font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-600/30 transition-colors"
                >
                  <span className="material-symbols-outlined">quiz</span>
                  Start Quiz
                </button>
              </div>
            )}

            {/* View Notes Button */}
            <button
              onClick={handleViewNotes}
              className="w-full flex items-center justify-center gap-2 h-14 px-6 text-lg font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-600/30 transition-colors"
            >
              <span className="material-symbols-outlined">description</span>
              View as Notes
            </button>

            {/* Error Messages */}
            {isEnrollError && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-400 mb-1">
                  Enrollment Failed
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {(enrollError as Error).message}
                </p>
              </div>
            )}

          </div>

          {/* Right Column: Interaction Pane */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Knowledge Graph Preview */}
            <div className="relative w-full aspect-4/3 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              {isGraphDataLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4 mx-auto"></div>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark">
                      Loading graph...
                    </p>
                  </div>
                </div>
              ) : knowledgeGraphData ? (
                <>
                  <KnowledgeGraph2D data={knowledgeGraphData} />
                  <button
                    onClick={handleViewKnowledgeGraph}
                    className="absolute top-4 right-4 z-20 inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-colors font-medium text-sm border border-white/20"
                  >
                    <span className="material-symbols-outlined text-lg">open_in_full</span>
                    Fullscreen
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🌐</div>
                    <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
                      Interactive Knowledge Graph
                    </h3>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
                      Visualize {graph.numOfKnowledgeNodes} interconnected concepts
                    </p>
                    {graph.isEnrolled ? (
                      <button
                        onClick={handleViewKnowledgeGraph}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium"
                      >
                        <span className="material-symbols-outlined">open_in_full</span>
                        Open Full Graph
                      </button>
                    ) : (
                      <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
                        Enroll to access the interactive graph
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Tabs Section */}
            <div className="flex flex-col">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex gap-6">
                  <button
                    onClick={() => setActiveTab("quiz")}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === "quiz"
                        ? "text-primary border-primary"
                        : "text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:border-gray-300 dark:hover:border-gray-500 border-transparent"
                    }`}
                  >
                    Q&A / Practice
                  </button>
                  <button
                    onClick={() => setActiveTab("reviews")}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === "reviews"
                        ? "text-primary border-primary"
                        : "text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:border-gray-300 dark:hover:border-gray-500 border-transparent"
                    }`}
                  >
                    About
                  </button>
                </nav>
              </div>

              <div className="py-6 space-y-4">
                {activeTab === "quiz" && graph.isEnrolled ? (
                  <>
                    <div className="flex items-center justify-between gap-4 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 p-4 rounded-xl hover:border-primary/50 transition-colors cursor-pointer" onClick={handleStartQuiz}>
                      <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-primary text-2xl">quiz</span>
                        <p className="text-text-primary-light dark:text-text-primary-dark text-base font-normal flex-1">
                          Practice Questions
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-text-secondary-light dark:text-text-secondary-dark">
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 p-4 rounded-xl hover:border-primary/50 transition-colors cursor-pointer" onClick={handleViewKnowledgeGraph}>
                      <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-primary text-2xl">account_tree</span>
                        <p className="text-text-primary-light dark:text-text-primary-dark text-base font-normal flex-1">
                          Explore Knowledge Graph
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-text-secondary-light dark:text-text-secondary-dark">
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                      </div>
                    </div>
                  </>
                ) : activeTab === "quiz" && !graph.isEnrolled ? (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-6xl text-text-secondary-light dark:text-text-secondary-dark mb-4">lock</span>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark">
                      Enroll in this graph to access practice questions
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl">
                      <h3 className="text-text-primary-light dark:text-text-primary-dark font-medium mb-2">
                        About This Graph
                      </h3>
                      <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
                        This knowledge graph contains {graph.numOfKnowledgeNodes} interconnected nodes representing key concepts and their relationships.
                        {graph.isEnrolled ? " You're enrolled and can access all features." : " Enroll to start your learning journey."}
                      </p>
                    </div>
                    <div className="p-4 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl">
                      <h3 className="text-text-primary-light dark:text-text-primary-dark font-medium mb-2">
                        Features
                      </h3>
                      <ul className="text-text-secondary-light dark:text-text-secondary-dark text-sm space-y-2">
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-green-600 text-base">check_circle</span>
                          Interactive 3D visualization
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-green-600 text-base">check_circle</span>
                          Adaptive practice questions
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-green-600 text-base">check_circle</span>
                          Progress tracking
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
