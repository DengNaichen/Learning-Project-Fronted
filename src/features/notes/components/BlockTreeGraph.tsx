import { useMemo, useRef, useEffect, useState } from 'react';
import type { BlockTree } from './TiptapEditor';

// Block 标题映射
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

// 计算树的布局
function calculateLayout(tree: BlockTree): LayoutNode[] {
  if (!tree || tree.nodes.size === 0) return [];

  const nodes: LayoutNode[] = [];
  const nodeWidth = 120;
  const nodeHeight = 40;
  const horizontalGap = 40;
  const verticalGap = 60;

  // 计算每个节点的子树宽度
  function getSubtreeWidth(nodeId: string): number {
    const node = tree.nodes.get(nodeId);
    if (!node || node.children.length === 0) return nodeWidth;

    const childrenWidth = node.children.reduce((sum, childId) => {
      return sum + getSubtreeWidth(childId) + horizontalGap;
    }, -horizontalGap);

    return Math.max(nodeWidth, childrenWidth);
  }

  // 递归布局节点
  function layoutNode(nodeId: string, x: number, y: number): number {
    const node = tree.nodes.get(nodeId);
    if (!node) return x;

    const subtreeWidth = getSubtreeWidth(nodeId);
    const nodeX = x + subtreeWidth / 2;

    // 从 node 中提取标题（这里用 id 的简化版作为临时标题）
    // 实际标题需要从编辑器内容中获取
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

    // 布局子节点
    let childX = x;
    for (const childId of node.children) {
      const childWidth = getSubtreeWidth(childId);
      layoutNode(childId, childX, y + nodeHeight + verticalGap);
      childX += childWidth + horizontalGap;
    }

    return x + subtreeWidth;
  }

  // 从根节点开始布局
  let startX = 0;
  for (const rootId of tree.rootIds) {
    const width = getSubtreeWidth(rootId);
    layoutNode(rootId, startX, 20);
    startX += width + horizontalGap * 2;
  }

  return nodes;
}

export function BlockTreeGraph({ tree, titles }: BlockTreeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // 监听容器大小变化
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // 计算布局
  const layoutNodes = useMemo(() => tree ? calculateLayout(tree) : [], [tree]);

  // 计算 SVG 视图范围
  const viewBox = useMemo(() => {
    if (layoutNodes.length === 0) return { minX: 0, minY: 0, width: 400, height: 300 };

    const padding = 40;
    const nodeWidth = 120;
    const nodeHeight = 40;

    const xs = layoutNodes.map(n => n.x);
    const ys = layoutNodes.map(n => n.y);

    const minX = Math.min(...xs) - nodeWidth / 2 - padding;
    const maxX = Math.max(...xs) + nodeWidth / 2 + padding;
    const minY = Math.min(...ys) - padding;
    const maxY = Math.max(...ys) + nodeHeight + padding;

    return {
      minX,
      minY,
      width: Math.max(maxX - minX, 200),
      height: Math.max(maxY - minY, 150),
    };
  }, [layoutNodes]);

  // 空状态
  if (!tree || tree.nodes.size === 0) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center">
        <div className="text-center p-8">
          <div className="flex items-center justify-center size-16 mx-auto mb-4 text-gray-400 dark:text-gray-600">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">知识图谱预览</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            按 <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">/</kbd> 创建 Block 开始构建
          </p>
        </div>
      </div>
    );
  }

  const nodeWidth = 120;
  const nodeHeight = 40;

  return (
    <div ref={containerRef} className="w-full h-full overflow-auto bg-gray-50 dark:bg-[#0a0e1a]">
      <svg
        width={Math.max(dimensions.width, viewBox.width)}
        height={Math.max(dimensions.height, viewBox.height)}
        viewBox={`${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`}
        className="block"
      >
        {/* 定义箭头 */}
        <defs>
          {/* 父子关系箭头 - 灰色 */}
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
          {/* Reference 箭头 - 紫色 */}
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

        {/* 绘制父子关系连接线 - 灰色实线 */}
        {layoutNodes.map((node) =>
          node.children.map((childId) => {
            const childNode = layoutNodes.find(n => n.id === childId);
            if (!childNode) return null;

            const startX = node.x;
            const startY = node.y + nodeHeight;
            const endX = childNode.x;
            const endY = childNode.y;

            // 使用贝塞尔曲线
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

        {/* 绘制 Reference 连接线 - 紫色虚线 */}
        {layoutNodes.map((node) =>
          node.references.map((refId) => {
            const refNode = layoutNodes.find(n => n.id === refId);
            if (!refNode) return null;

            const startX = node.x;
            const startY = node.y + nodeHeight / 2;
            const endX = refNode.x;
            const endY = refNode.y + nodeHeight / 2;

            // 使用贝塞尔曲线，稍微弯曲一点避免和父子连线重叠
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

        {/* 绘制节点 */}
        {layoutNodes.map((node) => {
          // 获取标题，截断过长的文本
          const rawTitle = titles[node.id] || '无标题';
          const displayTitle = rawTitle.length > 10 ? rawTitle.slice(0, 10) + '...' : rawTitle;

          return (
            <g key={node.id} transform={`translate(${node.x - nodeWidth / 2}, ${node.y})`}>
              {/* 节点背景 */}
              <rect
                width={nodeWidth}
                height={nodeHeight}
                rx={8}
                ry={8}
                fill="#ffffff"
                stroke="#3b82f6"
                strokeWidth={2}
                className="dark:fill-[#1e293b] dark:stroke-blue-500"
              />
              {/* 节点标题 */}
              <text
                x={nodeWidth / 2}
                y={nodeHeight / 2 + 5}
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
