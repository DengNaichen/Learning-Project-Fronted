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
  id: string;
  student_id: string;
  graph_id: string;
  enrollment_date: string;
}

export interface ApiError {
  message: string;
}

// Create Graph Types
export interface CreateGraphRequestDTO {
  name: string;
  description: string;
  tags: string[];
  is_public: boolean;
}

export interface CreateGraphResponseDTO {
  id: string;
  name: string;
  slug: string;
  description: string;
  tags: string[];
  is_public: boolean;
  is_template: boolean;
  owner_id: string;
  created_at: string;
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

// Graph Content Types (for /me/graphs/{graph_id}/content)
export interface GraphContentNode {
  id: string;
  node_id_str?: string;
  node_name: string;
  description?: string;
  level: number;
  dependents_count: number;
}

export interface GraphContentPrerequisite {
  from_node_id: string;
  to_node_id: string;
  weight: number;
}

export interface GraphContentSubtopic {
  parent_node_id: string;
  child_node_id: string;
  weight: number;
}

export interface GraphContentResponse {
  graph: FetchGraphResponseDTO;
  nodes: GraphContentNode[];
  prerequisites: GraphContentPrerequisite[];
  subtopics: GraphContentSubtopic[];
}
