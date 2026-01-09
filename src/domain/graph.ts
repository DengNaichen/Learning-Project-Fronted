import type {
  GraphContentNode as ApiGraphContentNode,
  GraphContentPrerequisite as ApiGraphContentPrerequisite,
  GraphContentResponse as ApiGraphContentResponse,
  GraphEdgeVisualization,
  GraphEnrollmentResponse,
  GraphNodeVisualization,
  GraphVisualization,
  KnowledgeGraphCreate,
  KnowledgeGraphResponse,
} from "../api/generated/model";

export interface Graph {
  graphId: string;
  graphName: string;
  numOfKnowledgeNodes: number;
  isEnrolled: boolean;
  isPrimary: boolean;
}

export type FetchGraphResponseDTO = KnowledgeGraphResponse;
export type EnrollmentResponseDTO = GraphEnrollmentResponse;
export type CreateGraphRequestDTO = KnowledgeGraphCreate;
export type CreateGraphResponseDTO = KnowledgeGraphResponse;

export type GraphNode = GraphNodeVisualization;
export type GraphEdge = GraphEdgeVisualization;
export type KnowledgeGraphVisualization = GraphVisualization;

export type GraphContentNode = ApiGraphContentNode;
export type GraphContentPrerequisite = ApiGraphContentPrerequisite;
export type GraphContentResponse = ApiGraphContentResponse;

export function mapKnowledgeGraphToGraph(dto: KnowledgeGraphResponse): Graph {
  return {
    graphId: dto.id,
    graphName: dto.name,
    numOfKnowledgeNodes: dto.node_count ?? 0,
    isEnrolled: dto.is_enrolled ?? false,
    isPrimary: dto.is_template ?? false,
  };
}
