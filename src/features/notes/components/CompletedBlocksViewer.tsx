import { useEffect, useState } from 'react';
import { getAllCompletedBlocks, type CompletedBlock } from '../db/indexedDB';
import { CheckCircle2, Calendar, Hash } from 'lucide-react';

export function CompletedBlocksViewer() {
  const [blocks, setBlocks] = useState<CompletedBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlocks();
  }, []);

  const loadBlocks = async () => {
    try {
      const allBlocks = await getAllCompletedBlocks();
      // Sort by completion time in descending order
      allBlocks.sort((a, b) => b.completedAt - a.completedAt);
      setBlocks(allBlocks);
    } catch (error) {
      console.error('Failed to load completed blocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p>No completed blocks yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <CheckCircle2 className="w-6 h-6 text-green-600" />
        Completed Blocks ({blocks.length})
      </h2>

      <div className="space-y-3">
        {blocks.map((block) => (
          <div
            key={block.id}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-800 flex-1">
                {block.title || 'Untitled'}
              </h3>
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
            </div>

            {/* Content Preview */}
            {block.textContent && block.textContent !== block.title && (
              <div className="text-sm text-gray-600 mb-3 line-clamp-3">
                {block.textContent.replace(block.title, '').trim()}
              </div>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(block.completedAt)}
              </div>

              {block.noteId && (
                <div className="flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  {block.noteId.substring(0, 12)}...
                </div>
              )}

              {block.metadata?.hasCode && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                  Contains Code
                </span>
              )}

              {block.metadata?.wordCount && block.metadata.wordCount > 0 && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                  {block.metadata.wordCount} chars
                </span>
              )}

              {block.isLeaf && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
                  Leaf
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
