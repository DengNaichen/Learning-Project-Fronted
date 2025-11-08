export interface Course {
  courseId: string;
  courseName: string;
  numOfKnowledgeNodes: number;
  isEnrolled: boolean;
  isPrimary: boolean;
}

export interface FetchCourseResponseDTO {
    course_id: string;
    course_name: string;
    course_description: string;
    is_enrolled: boolean;
    num_of_knowledge: number;
}

export interface EnrollmentRequestDTO {
    course_id: string;
}

export interface EnrollmentResponseDTO {
    id: string
    student_id: string // FIXME: change this to userid later
    course_id: string;
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
  source: string; // source node_id
  target: string; // target node_id
  type: "IS_PREREQUISITE_FOR" | "HAS_SUBTOPIC";
}

export interface KnowledgeGraphVisualization {
  nodes: GraphNode[];
  edges: GraphEdge[];
}