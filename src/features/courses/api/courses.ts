import apiClient from "../../../api/client";
import type {
  FetchCourseResponseDTO,
  EnrollmentRequestDTO,
  EnrollmentResponseDTO,
} from "../types/course"

export const getAllCourses = async (): Promise<FetchCourseResponseDTO[]> => {
  const response = await apiClient.get<FetchCourseResponseDTO[]>("/courses/");
  return response.data;
};

export const getCourse = async (
  courseId: string
): Promise<FetchCourseResponseDTO> => {
  const response = await apiClient.get<FetchCourseResponseDTO>(`/courses/${courseId}/`);
  return response.data;
};

export const enrollInCourse = async (
  courseId: string
): Promise<EnrollmentResponseDTO> => {
  const requestBody: EnrollmentRequestDTO = {
    course_id: courseId,
  };
  const response = await apiClient.post<EnrollmentResponseDTO>(
    `/courses/${courseId}/enrollments/`,
    requestBody
  );
  return response.data;
};
