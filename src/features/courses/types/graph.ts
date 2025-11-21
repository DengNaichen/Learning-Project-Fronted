export interface Graph {
  graphId: string;
  graphName: string;
  numOfKnowledgeNodes: number;
  isEnrolled: boolean;
  isPrimary: boolean;
}

export interface FetchGraphResponseDTO {
    id: string;
    name: string;
    slug: string;
    description: string;
    tags: string[];
    is_public: boolean;
    is_template: boolean;
    owner_id: string;
    enrollment_count: number;
    node_count: number;
    is_enrolled?: boolean;
    created_at: string;
}

export interface EnrollmentRequestDTO {
    graph_id: string;
}

export interface EnrollmentResponseDTO {
    id: string
    student_id: string // FIXME: change this to userid later
    graph_id: string;
    enrollment_date: string
}

export interface ApiError { // FIXME: change this! use a better way to do it.
    message: string;
}

// Knowledge Graph Types
export interface GraphNode {
  id: string;
  name: string;
  description: string;
  mastery_score: number; // 0.0 to 1.0, default 0.2 if no relationship exists
}

export interface GraphEdge {
  source_id: string; // source node_id
  target_id: string; // target node_id
  type: "IS_PREREQUISITE_FOR" | "HAS_SUBTOPIC";
}

export interface KnowledgeGraphVisualization {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
