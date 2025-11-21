import React from "react";
import { useNavigate } from "react-router-dom";
import { useGetAllGraph } from "../hooks/useGraphs";
import { GraphCard } from "./GraphCard";

export const GraphList: React.FC = () => {
  const navigate = useNavigate();
  const { data: graphs, isLoading, isError, error } = useGetAllGraph();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    navigate("/login", { replace: true });
  };

  return (
    <div className="page-container">
      {/* TopNavBar */}
      <header className="nav-header sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="size-6 text-primary">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.8261 17.4264C16.7203 18.1174 20.2244 18.5217 24 18.5217C27.7756 18.5217 31.2797 18.1174 34.1739 17.4264C36.9144 16.7722 39.9967 15.2331 41.3563 14.1648L24.8486 40.6391C24.4571 41.267 23.5429 41.267 23.1514 40.6391L6.64374 14.1648C8.00331 15.2331 11.0856 16.7722 13.8261 17.4264Z" fill="currentColor"></path>
              <path clipRule="evenodd" d="M39.998 12.236C39.9944 12.2537 39.9875 12.2845 39.9748 12.3294C39.9436 12.4399 39.8949 12.5741 39.8346 12.7175C39.8168 12.7597 39.7989 12.8007 39.7813 12.8398C38.5103 13.7113 35.9788 14.9393 33.7095 15.4811C30.9875 16.131 27.6413 16.5217 24 16.5217C20.3587 16.5217 17.0125 16.131 14.2905 15.4811C12.0012 14.9346 9.44505 13.6897 8.18538 12.8168C8.17384 12.7925 8.16216 12.767 8.15052 12.7408C8.09919 12.6249 8.05721 12.5114 8.02977 12.411C8.00356 12.3152 8.00039 12.2667 8.00004 12.2612C8.00004 12.261 8 12.2607 8.00004 12.2612C8.00004 12.2359 8.0104 11.9233 8.68485 11.3686C9.34546 10.8254 10.4222 10.2469 11.9291 9.72276C14.9242 8.68098 19.1919 8 24 8C28.8081 8 33.0758 8.68098 36.0709 9.72276C37.5778 10.2469 38.6545 10.8254 39.3151 11.3686C39.9006 11.8501 39.9857 12.1489 39.998 12.236ZM4.95178 15.2312L21.4543 41.6973C22.6288 43.5809 25.3712 43.5809 26.5457 41.6973L43.0534 15.223C43.0709 15.1948 43.0878 15.1662 43.104 15.1371L41.3563 14.1648C43.104 15.1371 43.1038 15.1374 43.104 15.1371L43.1051 15.135L43.1065 15.1325L43.1101 15.1261L43.1199 15.1082C43.1276 15.094 43.1377 15.0754 43.1497 15.0527C43.1738 15.0075 43.2062 14.9455 43.244 14.8701C43.319 14.7208 43.4196 14.511 43.5217 14.2683C43.6901 13.8679 44 13.0689 44 12.2609C44 10.5573 43.003 9.22254 41.8558 8.2791C40.6947 7.32427 39.1354 6.55361 37.385 5.94477C33.8654 4.72057 29.133 4 24 4C18.867 4 14.1346 4.72057 10.615 5.94478C8.86463 6.55361 7.30529 7.32428 6.14419 8.27911C4.99695 9.22255 3.99999 10.5573 3.99999 12.2609C3.99999 13.1275 4.29264 13.9078 4.49321 14.3607C4.60375 14.6102 4.71348 14.8196 4.79687 14.9689C4.83898 15.0444 4.87547 15.1065 4.9035 15.1529C4.91754 15.1762 4.92954 15.1957 4.93916 15.2111L4.94662 15.223L4.95178 15.2312ZM35.9868 18.996L24 38.22L12.0131 18.996C12.4661 19.1391 12.9179 19.2658 13.3617 19.3718C16.4281 20.1039 20.0901 20.5217 24 20.5217C27.9099 20.5217 31.5719 20.1039 34.6383 19.3718C35.082 19.2658 35.5339 19.1391 35.9868 18.996Z" fill="currentColor" fillRule="evenodd"></path>
            </svg>
          </div>
          <h2 className="text-lg font-bold leading-tight text-text-primary dark:text-text-primary-dark">KnowledgeGraph</h2>
        </div>
        <div className="hidden md:flex flex-1 justify-center gap-8">
          <div className="flex items-center gap-9">
            <button onClick={() => navigate("/")} className="nav-link">
              Home
            </button>
            <button className="nav-link-active">
              Explore
            </button>
            <button onClick={() => navigate("/notes")} className="nav-link">
              My Notes
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="btn-primary btn-md"
          >
            <span className="truncate">Logout</span>
          </button>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Page Heading and Search */}
            <div className="mb-6">
              <p className="text-4xl font-black leading-tight tracking-tight text-text-primary dark:text-text-primary-dark">Explore Knowledge Graphs</p>
            </div>

            <div className="mb-8">
              <label className="flex flex-col min-w-40 h-14 w-full">
                <div className="flex w-full flex-1 items-stretch rounded-xl h-full">
                  <div className="text-text-tertiary dark:text-text-tertiary-dark flex bg-bg-elevated dark:bg-bg-elevated-dark items-center justify-center pl-4 rounded-l-xl border-y border-l border-border dark:border-border-dark">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-xl text-text-primary dark:text-text-primary-dark focus:outline-0 focus:ring-2 focus:ring-primary focus:ring-inset border border-border dark:border-border-dark bg-bg-elevated dark:bg-bg-elevated-dark h-full placeholder:text-text-tertiary dark:placeholder:text-text-tertiary-dark px-4 text-base font-normal leading-normal"
                    placeholder="Search for a topic or graph..."
                  />
                </div>
              </label>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center items-center py-12">
                <div className="text-text-secondary dark:text-text-secondary-dark">Loading graphs...</div>
              </div>
            )}

            {/* Error State */}
            {isError && (
              <div className="mt-4 rounded-md bg-error/10 p-4">
                <h3 className="text-sm font-medium text-error">Failed to Load Graphs</h3>
                <p className="mt-2 text-sm text-error/80">{(error as Error).message}</p>
              </div>
            )}

            {/* Graph Cards Grid */}
            {!isLoading && !isError && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {graphs?.map((graph) => (
                  <GraphCard key={graph.graphId} graph={graph} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !isError && graphs?.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-text-tertiary dark:text-text-tertiary-dark mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-text-primary dark:text-text-primary-dark mb-2">No Graphs Available</h3>
                <p className="text-text-secondary dark:text-text-secondary-dark">Start exploring by creating your first knowledge graph!</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
