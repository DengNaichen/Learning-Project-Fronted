import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useGetCourse, useEnrollInCourse } from "../hooks/useCourses";
import { QuizPage } from "../../quiz";

export const CourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [showQuiz, setShowQuiz] = useState(false);

  const {
    data: course,
    isLoading,
    isError: isCourseError,
    error: courseError,
  } = useGetCourse(courseId);

  const {
    mutate: enroll,
    isPending: isEnrolling,
    isError: isEnrollError,
    error: enrollError,
  } = useEnrollInCourse();

  const handleEnrollClick = () => {
    if (courseId) {
      enroll(courseId);
    }
  };

  const handleStartQuiz = () => {
    setShowQuiz(true);
  };

  const handleBackToCourse = () => {
    setShowQuiz(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-4 text-gray-500">Loading course details...</div>
      </div>
    );
  }

  if (isCourseError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Course
          </h2>
          <p className="text-gray-600 mb-6">{(courseError as Error).message}</p>
          <Link
            to="/courses"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Course List
          </Link>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Course not found
          </h2>
          <p className="text-gray-600 mb-6">
            The course with ID "{courseId}" does not exist.
          </p>
          <Link
            to="/courses"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Course List
          </Link>
        </div>
      </div>
    );
  }

  // Show Quiz Page if quiz is started
  if (showQuiz && courseId) {
    return (
      <div>
        <div className="max-w-4xl mx-auto p-6 mb-4">
          <button
            onClick={handleBackToCourse}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Back to Course Details
          </button>
        </div>
        <QuizPage courseId={courseId} questionNum={5} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-4">
        <Link
          to="/courses"
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          ← Back to Course List
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {course.courseName}
          </h1>
          <p className="text-gray-600 text-lg">Course ID: {course.courseId}</p>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-500 text-sm">Knowledge Nodes:</span>
              <p className="font-semibold text-gray-800">
                {course.numOfKnowledgeNodes}
              </p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Status:</span>
              <p
                className={`font-semibold ${
                  course.isEnrolled ? "text-green-600" : "text-orange-600"
                }`}
              >
                {course.isEnrolled ? "✓ Enrolled" : "Not Enrolled"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={handleEnrollClick}
            disabled={isEnrolling || course.isEnrolled}
            className="
              px-6 py-3 text-base font-medium text-white
              rounded-lg shadow-sm transition-colors
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              disabled:bg-gray-400 disabled:cursor-not-allowed
              bg-blue-600 hover:bg-blue-700
            "
          >
            {isEnrolling
              ? "Enrolling..."
              : course.isEnrolled
              ? "Enrolled"
              : `Enroll in ${course.courseName}`}
          </button>

          {course.isEnrolled && (
            <>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">
                  You are enrolled in this course!
                </p>
                <p className="text-green-700 text-sm mt-1">
                  You can now access all {course.numOfKnowledgeNodes} knowledge
                  nodes.
                </p>
              </div>

              <button
                onClick={handleStartQuiz}
                className="
                  px-6 py-3 text-base font-medium text-white
                  rounded-lg shadow-sm transition-colors
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                  bg-green-600 hover:bg-green-700
                "
              >
                🎯 Start Quiz
              </button>
            </>
          )}

          {isEnrollError && (
            <div className="p-4 rounded-md bg-red-50 border border-red-200">
              <h3 className="text-sm font-medium text-red-800">
                Enrollment Failed
              </h3>
              <p className="mt-2 text-sm text-red-700">
                {(enrollError as Error).message}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
