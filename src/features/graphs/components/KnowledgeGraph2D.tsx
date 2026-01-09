import { useRef, useMemo, useCallback, useEffect, useState } from "react";
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";
import type { KnowledgeGraphVisualization } from "../../../domain/graph";

interface KnowledgeGraph2DProps {
  data: KnowledgeGraphVisualization;
}

interface GraphNode {
  id: string;
  name: string;
  description?: string | null;
  mastery: number;
  color: string;
  val: number;
  isHub: boolean;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
  color: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// Sci-fi color palette
const COLORS = {
  hub: "#a882ff", // Obsidian purple
  secondary: "#53dfdd", // Cyan accent
  high: "#50fa7b", // Green - fully mastered
  medium: "#fbbf24", // Amber/Yellow - in progress
  low: "#4a4a4a", // Gray - inactive/not mastered
  normal: "#666",
  highlight: "#ddd",
  link: "#3f3f3f",
  bg: "#111111",
  // Edge types
  prerequisite: "#f472b6", // Pink - needs to learn first
};

const getMasteryColor = (masteryScore: number, isHub: boolean): string => {
  if (isHub) return COLORS.hub;
  if (masteryScore < 0.33) return COLORS.low;
  if (masteryScore < 0.66) return COLORS.medium;
  return COLORS.high;
};

const getNodeSize = (mastery: number, linkCount: number): number => {
  const baseSize = 6 + mastery * 8;
  const linkBonus = Math.min(linkCount * 1.5, 10);
  return baseSize + linkBonus;
};

export default function KnowledgeGraph2D({ data }: KnowledgeGraph2DProps) {
  const graphRef = useRef<ForceGraphMethods<GraphNode, GraphLink> | undefined>(
    undefined
  );
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
  const [showLabels, setShowLabels] = useState(true);

  const graphData: GraphData = useMemo(() => {
    // Count links per node to determine hub status
    const linkCounts: Record<string, number> = {};
    (data.edges || []).forEach((edge) => {
      linkCounts[edge.source_id] = (linkCounts[edge.source_id] || 0) + 1;
      linkCounts[edge.target_id] = (linkCounts[edge.target_id] || 0) + 1;
    });

    const maxLinks = Math.max(...Object.values(linkCounts), 1);

    const nodes: GraphNode[] = data.nodes.map((node) => {
      const linkCount = linkCounts[node.id] || 0;
      const isHub = linkCount > maxLinks * 0.5;
      return {
        id: node.id,
        name: node.name,
        description: node.description,
        mastery: node.mastery_score,
        color: getMasteryColor(node.mastery_score, isHub),
        val: getNodeSize(node.mastery_score, linkCount),
        isHub,
      };
    });

    const nodeIds = new Set(nodes.map((n) => n.id));

    const links: GraphLink[] = (data.edges || [])
      .filter(
        (edge) => nodeIds.has(edge.source_id) && nodeIds.has(edge.target_id)
      )
      .map((edge) => ({
        source: edge.source_id,
        target: edge.target_id,
        type: "IS_PREREQUISITE_FOR",
        color: COLORS.prerequisite,
      }));

    return { nodes, links };
  }, [data]);

  // Get neighbors of a node
  const getNeighbors = useCallback(
    (node: GraphNode): Set<string> => {
      const neighbors = new Set<string>();
      graphData.links.forEach((link) => {
        const sourceId =
          typeof link.source === "string" ? link.source : link.source.id;
        const targetId =
          typeof link.target === "string" ? link.target : link.target.id;
        if (sourceId === node.id) neighbors.add(targetId);
        if (targetId === node.id) neighbors.add(sourceId);
      });
      return neighbors;
    },
    [graphData.links]
  );

  // Configure force simulation based on graph density
  useEffect(() => {
    if (graphRef.current) {
      const nodeCount = graphData.nodes.length;
      const linkCount = graphData.links.length;
      const density = nodeCount > 0 ? linkCount / nodeCount : 1;

      const chargeStrength = density < 1.5 ? -50 : -150;
      const linkDistance = density < 1.5 ? 30 : 60;

      graphRef.current.d3Force("charge")?.strength(chargeStrength);
      graphRef.current.d3Force("link")?.distance(linkDistance);
      graphRef.current.d3Force("collide", null);
    }
  }, [graphData]);

  // Custom node rendering - Obsidian style
  const nodeCanvasObject = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return;

      const neighbors = hoverNode ? getNeighbors(hoverNode) : new Set<string>();
      const isHover = hoverNode?.id === node.id;
      const isNeighbor = hoverNode ? neighbors.has(node.id) : false;

      // Determine opacity and color based on hover state
      let alpha = 1;
      let fillColor = node.color;

      if (hoverNode) {
        if (isHover || isNeighbor) {
          alpha = 1;
        } else {
          alpha = 0.15;
          fillColor = "#555";
        }
      }

      ctx.globalAlpha = alpha;

      const radius = node.val;

      // Draw glow effect for hubs and hovered nodes
      if ((isHover || node.isHub) && alpha === 1) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = node.color;
      }

      // Draw main circle
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, radius, 0, 2 * Math.PI);
      ctx.fillStyle = fillColor;
      ctx.fill();

      // Reset shadow
      ctx.shadowBlur = 0;

      // Draw subtle border
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Draw labels
      if (showLabels) {
        const shouldShowLabel =
          globalScale > 1.2 || isHover || node.isHub || isNeighbor;
        if (shouldShowLabel && alpha === 1) {
          ctx.globalAlpha = 1;
          ctx.fillStyle = "#fff";
          ctx.font = node.isHub
            ? "600 10px -apple-system, sans-serif"
            : "8px -apple-system, sans-serif";
          ctx.fillText(node.name, node.x! + radius + 4, node.y! + 3);
        }
      }

      ctx.globalAlpha = 1;
    },
    [hoverNode, showLabels, getNeighbors]
  );

  // Custom link rendering
  const linkCanvasObject = useCallback(
    (link: GraphLink, ctx: CanvasRenderingContext2D) => {
      const source = link.source as GraphNode;
      const target = link.target as GraphNode;

      if (
        !Number.isFinite(source.x) ||
        !Number.isFinite(source.y) ||
        !Number.isFinite(target.x) ||
        !Number.isFinite(target.y)
      )
        return;

      const isConnectedToHover =
        hoverNode && (source.id === hoverNode.id || target.id === hoverNode.id);

      // Calculate line style
      let strokeColor: string;
      let alpha: number;
      let lineWidth: number;

      if (hoverNode) {
        if (isConnectedToHover) {
          strokeColor = link.color;
          alpha = 1;
          lineWidth = 2;
        } else {
          strokeColor = "#333";
          alpha = 0.1;
          lineWidth = 0.5;
        }
      } else {
        strokeColor = link.color;
        alpha = 0.6;
        lineWidth = 1;
      }

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;

      // Draw line
      ctx.beginPath();
      ctx.moveTo(source.x!, source.y!);
      ctx.lineTo(target.x!, target.y!);
      ctx.stroke();

      // Draw arrow
      const arrowLength = 6;
      const dx = target.x! - source.x!;
      const dy = target.y! - source.y!;
      const angle = Math.atan2(dy, dx);

      // Position arrow at edge of target node
      const targetRadius = target.val || 6;
      const arrowX = target.x! - Math.cos(angle) * (targetRadius + 2);
      const arrowY = target.y! - Math.sin(angle) * (targetRadius + 2);

      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - arrowLength * Math.cos(angle - Math.PI / 6),
        arrowY - arrowLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - arrowLength * Math.cos(angle + Math.PI / 6),
        arrowY - arrowLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();

      ctx.globalAlpha = 1;
    },
    [hoverNode]
  );

  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoverNode(node);
  }, []);

  const handleResetZoom = useCallback(() => {
    graphRef.current?.zoomToFit(400, 50);
  }, []);

  return (
    <div className="relative w-full h-full" style={{ background: COLORS.bg }}>
      {/* Control Panel */}
      <div
        className="absolute top-5 left-5 z-10 p-5 rounded-xl"
        style={{
          background: "rgba(30, 30, 30, 0.8)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          minWidth: "200px",
        }}
      >
        <h2 className="text-white text-lg font-semibold mb-3">
          Knowledge Graph
        </h2>

        <div className="text-xs text-gray-400 space-y-1 mb-4">
          <div className="flex justify-between">
            <span>Nodes</span>
            <span className="text-gray-300">{graphData.nodes.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Links</span>
            <span className="text-gray-300">{graphData.links.length}</span>
          </div>
        </div>

        {/* Legend - Nodes */}
        <div className="flex flex-wrap gap-2 mb-3">
          <div className="flex items-center text-xs text-gray-400">
            <div
              className="w-2 h-2 rounded-full mr-1"
              style={{ background: COLORS.hub }}
            />
            Hub
          </div>
          <div className="flex items-center text-xs text-gray-400">
            <div
              className="w-2 h-2 rounded-full mr-1"
              style={{ background: COLORS.high }}
            />
            High
          </div>
          <div className="flex items-center text-xs text-gray-400">
            <div
              className="w-2 h-2 rounded-full mr-1"
              style={{ background: COLORS.medium }}
            />
            Medium
          </div>
          <div className="flex items-center text-xs text-gray-400">
            <div
              className="w-2 h-2 rounded-full mr-1"
              style={{ background: COLORS.low }}
            />
            Low
          </div>
        </div>

        {/* Legend - Edges */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center text-xs text-gray-400">
            <div
              className="w-4 h-0.5 mr-1"
              style={{ background: COLORS.prerequisite }}
            />
            Prerequisite
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2 pt-3 border-t border-white/10">
          <button
            onClick={handleResetZoom}
            className="px-3 py-1.5 text-xs text-white rounded-md transition-colors"
            style={{ background: "rgba(255, 255, 255, 0.1)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)")
            }
          >
            Reset View
          </button>
          <button
            onClick={() => setShowLabels(!showLabels)}
            className="px-3 py-1.5 text-xs text-white rounded-md transition-colors"
            style={{ background: "rgba(255, 255, 255, 0.1)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)")
            }
          >
            {showLabels ? "Hide Labels" : "Show Labels"}
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="absolute bottom-5 right-5 text-xs text-gray-600 pointer-events-none">
        Scroll to zoom • Drag to pan • Hover to focus
      </div>

      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeLabel={(node: GraphNode) => `
          <div style="
            background: rgba(30, 30, 30, 0.95);
            color: #dcddde;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 13px;
            max-width: 240px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            border: 1px solid rgba(255,255,255,0.08);
            backdrop-filter: blur(10px);
          ">
            <div style="font-weight: 600; margin-bottom: 6px; color: #fff;">${
              node.name
            }</div>
            <div style="font-size: 11px; color: #888; line-height: 1.5;">${
              node.description ?? ""
            }</div>
            <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 11px; display: flex; align-items: center; gap: 8px;">
              <span style="color: #666;">Mastery:</span>
              <span style="
                color: ${node.color};
                font-weight: 600;
              ">${(node.mastery * 100).toFixed(0)}%</span>
            </div>
          </div>
        `}
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={(
          node: GraphNode,
          color: string,
          ctx: CanvasRenderingContext2D
        ) => {
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, node.val + 5, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        linkCanvasObject={linkCanvasObject}
        onNodeHover={handleNodeHover}
        cooldownTicks={100}
        onEngineStop={() => graphRef.current?.zoomToFit(400, 50)}
        backgroundColor="transparent"
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />
    </div>
  );
}
