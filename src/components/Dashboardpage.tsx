import React from "react";

export default function DashboardPage() {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    return (
      <div>
        <h1>Access Denied</h1>
        <p>You must be logged in to view this page.</p>
      </div>
    );
  }

  return (
    <div className="text-center">
        <h1 className="">
            
        </h1>
    </div>
  )
}
