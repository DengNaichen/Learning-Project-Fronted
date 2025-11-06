import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllCourses, getCourse, enrollInCourse } from "../api/courses";
import type {
  FetchCourseResponseDTO,
  EnrollmentResponseDTO,
  Course,
  ApiError,
} from "../types/course";

function convertDtoToCourse(dto: FetchCourseResponseDTO): Course {
  return {
    courseId: dto.course_id,
    courseName: dto.course_name,
    numOfKnowledgeNodes: dto.num_of_knowledge,
    isEnrolled: dto.is_enrolled,
    isPrimary: false,
  };
}

export function useGetAllCourses() {
  return useQuery<FetchCourseResponseDTO[], Error, Course[]>({
    queryKey: ["courses"],
    queryFn: getAllCourses,
    select: (data) => data.map(convertDtoToCourse),
  });
}

export function useGetCourse(courseId: string | undefined) {
  return useQuery<FetchCourseResponseDTO, Error, Course>({
    queryKey: ["courses", courseId],
    queryFn: () => getCourse(courseId!),
    select: convertDtoToCourse,
    enabled: !!courseId,
  });
}

export function useEnrollInCourse() {
  const queryClient = useQueryClient();
  return useMutation<EnrollmentResponseDTO, Error, string>({
    mutationFn: enrollInCourse,

    onSuccess: (data, courseId) => {
      console.log("Enrollment successful for course:", courseId, data);

      queryClient.setQueryData<Course[]>(["courses"], (oldData) => {
        if (!oldData) return [];
        return oldData.map((course) =>
          course.courseId === courseId
            ? { ...course, isEnrolled: true }
            : course
        );
      });

      queryClient.setQueryData<Course>(["courses", courseId], (oldData) => {
        if (!oldData) return undefined;
        return { ...oldData, isEnrolled: true };
      });
    },

    onError: (error: ApiError, courseId) => {
      console.error(`Failed to enroll in course ${courseId}:`, error.message);
    },
  });
}
