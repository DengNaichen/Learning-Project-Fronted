import { useRef, useMemo, useCallback, useEffect } from "react";
import ForceGraph2D from "react-force-graph-2d";
import type { KnowledgeGraphVisualization } from "../types/graph";

interface KnowledgeGraph2DProps {
  data: KnowledgeGraphVisualization;
}

interface GraphData {
  nodes: Array<{
    id: string;
    name: string;
    description: string;
    mastery: number;
    color: string;
  }>;
  links: Array<{
    source: string;
    target: string;
    type: string;
    color: string;
  }>;
}

const getMasteryColor = (masteryScore: number): string => {
  if (masteryScore < 0.33) {
    return "#ef4444"; // low - red
  } else if (masteryScore < 0.66) {
    return "#f59e0b"; // medium - amber
  } else {
    return "#22c55e"; // high - green
  }
};

const getEdgeColor = (type: string): string => {
  return type === "IS_PREREQUISITE_FOR" ? "#60a5fa" : "#a78bfa";
};

export default function KnowledgeGraph2D({ data }: KnowledgeGraph2DProps) {
  const graphRef = useRef<any>();

  const graphData: GraphData = useMemo(() => {
    const nodes = data.nodes.map((node) => ({
      id: node.id,
      name: node.name,
      description: node.description,
      mastery: node.mastery_score,
      color: getMasteryColor(node.mastery_score),
    }));

    // Create a set of valid node IDs for filtering edges
    const nodeIds = new Set(nodes.map((n) => n.id));

    // Debug: log the data to see what we're getting
    console.log("Raw data:", data);
    console.log("Node IDs:", Array.from(nodeIds));
    console.log("Edges:", data.edges);

    // Filter edges to only include those with valid source and target nodes
    const links = (data.edges || [])
      .filter((edge) => {
        const valid = nodeIds.has(edge.source_id) && nodeIds.has(edge.target_id);
        return valid;
      })
      .map((edge) => ({
        source: edge.source_id,
        target: edge.target_id,
        type: edge.type,
        color: getEdgeColor(edge.type),
      }));

    console.log("Final links:", links);
    return { nodes, links };
  }, [data]);

  // Configure force simulation for better layout
  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.d3Force("charge").strength(-300);
      graphRef.current.d3Force("link").distance(100);
    }
  }, []);

  // Custom node rendering for 2D canvas
  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      // Skip rendering if coordinates are not yet calculated
      if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) {
        return;
      }

      const radius = 20;

      // Draw outer glow
      const gradient = ctx.createRadialGradient(
        node.x, node.y, radius * 0.6,
        node.x, node.y, radius * 1.8
      );
      gradient.addColorStop(0, node.color);
      gradient.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius * 1.8, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw main circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();

      // Draw border
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = 2 / globalScale;
      ctx.stroke();
    },
    []
  );

  return (
    <div className="w-full h-full">
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeLabel={(node: any) => `
          <div style="
            background: rgba(15, 23, 42, 0.95);
            color: #f1f5f9;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            max-width: 220px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.1);
          ">
            <div style="font-weight: 600; margin-bottom: 6px; color: #fff;">${node.name}</div>
            <div style="font-size: 12px; color: #94a3b8; line-height: 1.4;">${node.description}</div>
            <div style="margin-top: 8px; font-size: 12px; display: flex; align-items: center; gap: 6px;">
              <span style="color: #64748b;">Mastery:</span>
              <span style="
                color: ${node.color};
                font-weight: 600;
              ">${(node.mastery * 100).toFixed(0)}%</span>
            </div>
          </div>
        `}
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
          ctx.beginPath();
          ctx.arc(node.x, node.y, 22, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        linkColor={(link: any) => link.color}
        linkWidth={2}
        linkDirectionalArrowLength={8}
        linkDirectionalArrowRelPos={0.9}
        linkCurvature={0.15}
        linkLineDash={[]}
        cooldownTicks={100}
        onEngineStop={() => graphRef.current?.zoomToFit(400, 50)}
        backgroundColor="transparent"
      />
    </div>
  );
}
