import { useMemo, useRef } from 'react';
import type { BlockTree } from '../types/note';

// Block title mapping
export interface BlockTitles {
  [blockId: string]: string;
}

interface BlockTreeGraphProps {
  tree: BlockTree | null;
  titles: BlockTitles;
}

interface LayoutNode {
  id: string;
  title: string;
  x: number;
  y: number;
  children: string[];
  parentId: string | null;
  references: string[];
}

// Layout constants
const NODE_WIDTH = 120;
const NODE_HEIGHT = 40;
const HORIZONTAL_GAP = 40;
const VERTICAL_GAP = 60;

/**
 * Calculate tree layout positions for all nodes
 */
function calculateLayout(tree: BlockTree): LayoutNode[] {
  if (!tree || tree.nodes.size === 0) return [];

  const nodes: LayoutNode[] = [];

  // Calculate subtree width for each node
  function getSubtreeWidth(nodeId: string): number {
    const node = tree.nodes.get(nodeId);
    if (!node || node.children.length === 0) return NODE_WIDTH;

    const childrenWidth = node.children.reduce((sum, childId) => {
      return sum + getSubtreeWidth(childId) + HORIZONTAL_GAP;
    }, -HORIZONTAL_GAP);

    return Math.max(NODE_WIDTH, childrenWidth);
  }

  // Recursively layout nodes
  function layoutNode(nodeId: string, x: number, y: number): number {
    const node = tree.nodes.get(nodeId);
    if (!node) return x;

    const subtreeWidth = getSubtreeWidth(nodeId);
    const nodeX = x + subtreeWidth / 2;

    // Use node index as temporary title
    const title = `Block ${nodes.length + 1}`;

    nodes.push({
      id: nodeId,
      title,
      x: nodeX,
      y,
      children: node.children,
      parentId: node.parentId,
      references: node.references || [],
    });

    // Layout child nodes
    let childX = x;
    for (const childId of node.children) {
      const childWidth = getSubtreeWidth(childId);
      layoutNode(childId, childX, y + NODE_HEIGHT + VERTICAL_GAP);
      childX += childWidth + HORIZONTAL_GAP;
    }

    return x + subtreeWidth;
  }

  // Start layout from root nodes
  let startX = 0;
  for (const rootId of tree.rootIds) {
    const width = getSubtreeWidth(rootId);
    layoutNode(rootId, startX, 20);
    startX += width + HORIZONTAL_GAP * 2;
  }

  return nodes;
}

export function BlockTreeGraph({ tree, titles }: BlockTreeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate layout
  const layoutNodes = useMemo(() => tree ? calculateLayout(tree) : [], [tree]);

  // Calculate SVG viewBox
  const viewBox = useMemo(() => {
    if (layoutNodes.length === 0) return { minX: 0, minY: 0, width: 400, height: 300 };

    const padding = 40;

    const xs = layoutNodes.map(n => n.x);
    const ys = layoutNodes.map(n => n.y);

    const minX = Math.min(...xs) - NODE_WIDTH / 2 - padding;
    const maxX = Math.max(...xs) + NODE_WIDTH / 2 + padding;
    const minY = Math.min(...ys) - padding;
    const maxY = Math.max(...ys) + NODE_HEIGHT + padding;

    return {
      minX,
      minY,
      width: Math.max(maxX - minX, 200),
      height: Math.max(maxY - minY, 150),
    };
  }, [layoutNodes]);

  // Empty state
  if (!tree || tree.nodes.size === 0) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center">
        <div className="text-center p-8">
          <div className="flex items-center justify-center size-16 mx-auto mb-4 text-gray-400 dark:text-gray-600">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Knowledge Graph Preview</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">/</kbd> to create a Block and start building
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full overflow-auto bg-gray-50 dark:bg-[#0a0e1a]">
      <svg
        width="100%"
        height="100%"
        viewBox={`${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`}
        preserveAspectRatio="xMidYMid meet"
        className="block min-w-full min-h-full"
        style={{ minWidth: viewBox.width, minHeight: viewBox.height }}
      >
        {/* Arrow definitions */}
        <defs>
          {/* Parent-child relationship arrow - gray */}
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#9ca3af"
              className="dark:fill-gray-500"
            />
          </marker>
          {/* Reference arrow - purple */}
          <marker
            id="arrowhead-reference"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#8b5cf6"
            />
          </marker>
        </defs>

        {/* Draw parent-child connection lines - gray solid */}
        {layoutNodes.map((node) =>
          node.children.map((childId) => {
            const childNode = layoutNodes.find(n => n.id === childId);
            if (!childNode) return null;

            const startX = node.x;
            const startY = node.y + NODE_HEIGHT;
            const endX = childNode.x;
            const endY = childNode.y;

            // Use bezier curve
            const midY = (startY + endY) / 2;
            const path = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;

            return (
              <path
                key={`parent-${node.id}-${childId}`}
                d={path}
                fill="none"
                stroke="#d1d5db"
                strokeWidth={2}
                className="dark:stroke-gray-600"
                markerEnd="url(#arrowhead)"
              />
            );
          })
        )}

        {/* Draw reference connection lines - purple dashed */}
        {layoutNodes.map((node) =>
          node.references.map((refId) => {
            const refNode = layoutNodes.find(n => n.id === refId);
            if (!refNode) return null;

            const startX = node.x;
            const startY = node.y + NODE_HEIGHT / 2;
            const endX = refNode.x;
            const endY = refNode.y + NODE_HEIGHT / 2;

            // Use bezier curve, slightly curved to avoid overlapping with parent-child lines
            const controlOffset = 50;
            const midX = (startX + endX) / 2;
            const midY = Math.min(startY, endY) - controlOffset;
            const path = `M ${startX} ${startY} Q ${midX} ${midY}, ${endX} ${endY}`;

            return (
              <path
                key={`ref-${node.id}-${refId}`}
                d={path}
                fill="none"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="6 3"
                markerEnd="url(#arrowhead-reference)"
                opacity={0.8}
              />
            );
          })
        )}

        {/* Draw nodes */}
        {layoutNodes.map((node) => {
          // Get title, truncate if too long
          const rawTitle = titles[node.id] || 'Untitled';
          const displayTitle = rawTitle.length > 10 ? rawTitle.slice(0, 10) + '...' : rawTitle;

          return (
            <g key={node.id} transform={`translate(${node.x - NODE_WIDTH / 2}, ${node.y})`}>
              {/* Node background */}
              <rect
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                rx={8}
                ry={8}
                fill="#ffffff"
                stroke="#3b82f6"
                strokeWidth={2}
                className="dark:fill-[#1e293b] dark:stroke-blue-500"
              />
              {/* Node title */}
              <text
                x={NODE_WIDTH / 2}
                y={NODE_HEIGHT / 2 + 5}
                textAnchor="middle"
                fontSize={12}
                fontWeight={500}
                fill="#374151"
                className="dark:fill-gray-200"
              >
                {displayTitle}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
