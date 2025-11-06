import React from "react";
import type { Course } from "../types/course";

interface CourseRowProps {
  course: Course;
}

export const CourseRow: React.FC<CourseRowProps> = ({ course }) => {
  return (
    <div className="flex items-center justify-between gap-4 py-3 px-2 border-b border-gray-200 transition-colors hover:bg-gray-50">
      <div className="flex flex-col gap-1">
        <span className="text-base font-semibold text-gray-900">
          {course.courseName}
        </span>

        <span className="text-sm text-gray-500">
          {course.numOfKnowledgeNodes} nodes
        </span>
      </div>

      <span className="text-gray-300">&gt;</span>
    </div>
  );
};
