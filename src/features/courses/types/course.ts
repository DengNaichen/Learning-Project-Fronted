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