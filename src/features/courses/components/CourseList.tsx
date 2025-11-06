import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGetAllCourses } from "../hooks/useCourses";
import { CourseRow } from "./CourseRow";

export const CourseList: React.FC = () => {
  const navigate = useNavigate();
  const { data: courses, isLoading, isError, error } = useGetAllCourses();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    navigate("/login", { replace: true });
  };

  if (isLoading) {
    return <div className="p-4 text-gray-500">Loading courses...</div>;
  }

  if (isError) {
    return (
      <div className="mt-4 rounded-md bg-red-50 p-4">
        <h3 className="text-sm font-medium text-red-800">
          Fetch Course Failed
        </h3>
        <p className="mt-2 text-sm text-red-700">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">My Courses</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors duration-200"
        >
          Logout
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {courses?.map((course) => (
          <Link
            key={course.courseId}
            to={`/courses/${course.courseId}`}
            className="no-underline text-current block"
          >
            <CourseRow course={course} />
          </Link>
        ))}
      </div>
    </div>
  );
};
