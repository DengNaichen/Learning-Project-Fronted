import { useRef, useMemo } from "react";
import ForceGraph3D from "react-force-graph-3d";
import * as THREE from "three";
import type { KnowledgeGraphVisualization } from "../types/course";

interface KnowledgeGraph3DProps {
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
    return "#fceae3"; // low - light peachy
  } else if (masteryScore < 0.66) {
    return "#acd8c2"; // medium - light green
  } else {
    return "#ec757b"; // high - coral red
  }
};

const getEdgeColor = (type: string): string => {
  return type === "IS_PREREQUISITE_FOR" ? "#60a5fa" : "#a78bfa"; // blue-400 or purple-400 (brighter)
};

export default function KnowledgeGraph3D({ data }: KnowledgeGraph3DProps) {
  const graphRef = useRef();

  const graphData: GraphData = useMemo(() => {
    return {
      nodes: data.nodes.map((node) => ({
        id: node.id,
        name: node.name,
        description: node.description,
        mastery: node.mastery_score,
        color: getMasteryColor(node.mastery_score),
      })),
      links: data.edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
        type: edge.type,
        color: getEdgeColor(edge.type),
      })),
    };
  }, [data]);

  // Custom node object to make spheres smoother and opaque
  const nodeThreeObject = useMemo(() => {
    return (node: any) => {
      const geometry = new THREE.SphereGeometry(8, 32, 32); // increased radius from 5 to 8

      // Simple opaque material with the custom colors
      const material = new THREE.MeshBasicMaterial({
        color: node.color,
        transparent: false,
        opacity: 1,
      });

      return new THREE.Mesh(geometry, material);
    };
  }, []);

  return (
    <div className="w-full h-full">
      <ForceGraph3D
        ref={graphRef}
        graphData={graphData}
        nodeLabel={(node: any) => `
          <div style="
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 14px;
            max-width: 200px;
          ">
            <div style="font-weight: bold; margin-bottom: 4px;">${node.name}</div>
            <div style="font-size: 12px; color: #aaa;">${node.description}</div>
            <div style="margin-top: 4px; font-size: 12px;">
              Mastery: ${(node.mastery * 100).toFixed(0)}%
            </div>
          </div>
        `}
        nodeThreeObject={nodeThreeObject}
        linkColor={(link: any) => link.color}
        linkWidth={3}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        linkCurvature={0.1}
        linkDirectionalParticles={0}
        backgroundColor="#000000"
      />
    </div>
  );
}
