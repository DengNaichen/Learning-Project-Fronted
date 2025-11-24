/**
 * GraphNotesPage - Display graph content as a BlockNote document
 *
 * This page fetches graph content from the API and converts it
 * to a hierarchical block structure for visualization and editing.
 */

import { useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Block } from "@blocknote/core";
import { ArrowLeft, BookOpen } from "lucide-react";
import { BlockNoteEditor } from "../../notes/components/BlockNoteEditor";
import { BlockTreeGraph } from "../../notes/components/BlockTreeGraph";
import { customSchema } from "../../notes/lib/customBlocks";
import { graphContentToBlocks, getGraphTitle } from "../../notes/lib/graphToBlocks";
import { useGetGraphContent, useGetMyGraphContent } from "../hooks/useGraphs";
import type { BlockTree } from "../../notes/types/note";
import { ROUTES } from "../../../router";

type CustomBlock = Block<
  typeof customSchema.blockSchema,
  typeof customSchema.inlineContentSchema,
  typeof customSchema.styleSchema
>;

interface GraphNotesPageProps {
  isMyGraph?: boolean;
}

export function GraphNotesPage({ isMyGraph = false }: GraphNotesPageProps) {
  const { graphId } = useParams<{ graphId: string }>();
  const navigate = useNavigate();
  const [blockTree, setBlockTree] = useState<BlockTree | null>(null);

  // Fetch graph content
  const {
    data: graphContent,
    isLoading,
    isError,
    error,
  } = isMyGraph
    ? useGetMyGraphContent(graphId)
    : useGetGraphContent(graphId);

  // Convert graph content to blocks
  const blocks = useMemo(() => {
    if (!graphContent) return [];
    return graphContentToBlocks(graphContent) as unknown as CustomBlock[];
  }, [graphContent]);

  // Get graph title
  const graphTitle = useMemo(() => {
    if (!graphContent) return "Loading...";
    return getGraphTitle(graphContent);
  }, [graphContent]);

  // Build titles map for graph visualization
  const blockTitles = useMemo(() => {
    const titles: Record<string, string> = {};
    if (blockTree) {
      blockTree.nodes.forEach((node, id) => {
        titles[id] = node.title;
      });
    }
    return titles;
  }, [blockTree]);

  // Handle tree changes from editor
  const handleTreeChange = useCallback((tree: BlockTree) => {
    setBlockTree(tree);
  }, []);

  // Handle blocks change (read-only for now, but could be used for future editing)
  const handleBlocksChange = useCallback((_blocks: CustomBlock[]) => {
    // Currently read-only - graph content is not editable
  }, []);

  // Handle back navigation
  const handleBack = () => {
    if (isMyGraph) {
      navigate(ROUTES.MY_GRAPH_DETAIL(graphId!));
    } else {
      navigate(ROUTES.GRAPH_DETAIL(graphId!));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mb-4 mx-auto"></div>
          <p className="text-text-secondary-light dark:text-text-secondary-dark text-lg">
            Loading graph content...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-text-error-light dark:text-text-error-dark mb-4">
            Error Loading Graph
          </h2>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
            {(error as Error).message}
          </p>
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Graph
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-bg-default dark:bg-bg-dark">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border dark:border-border-dark bg-bg-elevated dark:bg-bg-elevated-dark">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="h-6 w-px bg-border dark:bg-border-dark" />
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark truncate max-w-md">
                {graphTitle}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-tertiary-light dark:text-text-tertiary-dark">
              {graphContent?.nodes.length || 0} nodes
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Pane: Editor */}
        <div className="flex-2 flex flex-col p-6 min-w-0 overflow-hidden">
          <div className="flex-grow flex flex-col card overflow-hidden">
            <div className="p-4 border-b border-border dark:border-border-dark">
              <h2 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">
                {graphTitle}
              </h2>
              <p className="text-sm text-text-tertiary dark:text-text-tertiary-dark mt-1">
                {graphContent?.graph.description || "Knowledge graph content"}
              </p>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-hidden min-h-0">
              {blocks.length > 0 ? (
                <BlockNoteEditor
                  key={graphId}
                  initialContent={blocks}
                  onChange={handleBlocksChange}
                  onTreeChange={handleTreeChange}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-text-tertiary dark:text-text-tertiary-dark">
                  <div className="text-center">
                    <p className="mb-4">No content available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Status Bar */}
            <div className="flex border-t border-border dark:border-border-dark items-center px-4 py-2">
              <p className="text-text-tertiary dark:text-text-tertiary-dark text-sm">
                Read-only view
              </p>
              {blockTree && (
                <p className="ml-4 text-text-tertiary dark:text-text-tertiary-dark text-sm">
                  Blocks: {blockTree.nodes.size} | Root nodes: {blockTree.rootIds.length}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Pane: Graph Viewer */}
        <div className="flex-1 flex flex-col relative bg-bg-muted dark:bg-bg-dark border-l border-border dark:border-border-dark min-h-0 min-w-0 overflow-hidden">
          <BlockTreeGraph tree={blockTree} titles={blockTitles} />
        </div>
      </main>
    </div>
  );
}
