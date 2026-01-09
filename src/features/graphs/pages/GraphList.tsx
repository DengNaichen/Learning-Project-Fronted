import React, { useState } from "react";
import { useGetAllGraph, useCreateGraph } from "../hooks/useGraphs";
import { GraphCard } from "../components/GraphCard";
import { Navbar } from "../../../components/layout/Navbar";
import type { CreateGraphRequestDTO } from "../../../domain/graph";

export const GraphList: React.FC = () => {
  const { data: graphs, isLoading, isError, error } = useGetAllGraph();
  const {
    mutate: createGraph,
    isPending: isCreating,
    error: createError,
  } = useCreateGraph();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateGraphRequestDTO>({
    name: "",
    description: "",
    tags: [],
    is_public: false,
  });
  const [tagInput, setTagInput] = useState("");
  const tags = formData.tags ?? [];
  const description = formData.description ?? "";

  const handleCreateGraph = (e: React.FormEvent) => {
    e.preventDefault();
    createGraph(formData, {
      onSuccess: () => {
        setIsModalOpen(false);
        setFormData({ name: "", description: "", tags: [], is_public: false });
        setTagInput("");
      },
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: tags.filter((tag) => tag !== tagToRemove),
    });
  };

  return (
    <div className="page-container">
      <Navbar
        showCreateButton
        onCreateClick={() => setIsModalOpen(true)}
      />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="mb-6">
              <p className="text-4xl font-black leading-tight tracking-tight text-text-primary dark:text-text-primary-dark">
                Explore Knowledge Graphs
              </p>
            </div>

            <div className="mb-8">
              <label className="flex flex-col min-w-40 h-14 w-full">
                <div className="flex w-full flex-1 items-stretch rounded-xl h-full">
                  <div className="text-text-tertiary dark:text-text-tertiary-dark flex bg-bg-elevated dark:bg-bg-elevated-dark items-center justify-center pl-4 rounded-l-xl border-y border-l border-border dark:border-border-dark">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-xl text-text-primary dark:text-text-primary-dark focus:outline-0 focus:ring-2 focus:ring-primary focus:ring-inset border border-border dark:border-border-dark bg-bg-elevated dark:bg-bg-elevated-dark h-full placeholder:text-text-tertiary dark:placeholder:text-text-tertiary-dark px-4 text-base font-normal leading-normal"
                    placeholder="Search for a topic or graph..."
                  />
                </div>
              </label>
            </div>

            {isLoading && (
              <div className="flex justify-center items-center py-12">
                <div className="text-text-secondary dark:text-text-secondary-dark">
                  Loading graphs...
                </div>
              </div>
            )}

            {isError && (
              <div className="mt-4 rounded-md bg-error/10 p-4">
                <h3 className="text-sm font-medium text-error">
                  Failed to Load Graphs
                </h3>
                <p className="mt-2 text-sm text-error/80">
                  {(error as Error).message}
                </p>
              </div>
            )}

            {!isLoading && !isError && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {graphs?.map((graph) => (
                  <GraphCard key={graph.graphId} graph={graph} />
                ))}
              </div>
            )}

            {!isLoading && !isError && graphs?.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-text-tertiary dark:text-text-tertiary-dark mb-4">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-text-primary dark:text-text-primary-dark mb-2">
                  No Graphs Available
                </h3>
                <p className="text-text-secondary dark:text-text-secondary-dark">
                  Start exploring by creating your first knowledge graph!
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-bold text-text-primary dark:text-text-primary-dark mb-4">
              Create New Graph
            </h2>
            <form onSubmit={handleCreateGraph} className="space-y-4">
              {createError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                  {createError.message || "Failed to create graph"}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-border dark:border-border-dark bg-bg-elevated dark:bg-bg-elevated-dark text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="My Python Course"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-border dark:border-border-dark bg-bg-elevated dark:bg-bg-elevated-dark text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Learn Python from scratch"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                  Tags
                </label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-primary/70"
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-lg border border-border dark:border-border-dark bg-bg-elevated dark:bg-bg-elevated-dark text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Add a tag..."
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-2 rounded-lg border border-border dark:border-border-dark hover:bg-bg-elevated dark:hover:bg-bg-elevated-dark"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={formData.is_public}
                  onChange={(e) =>
                    setFormData({ ...formData, is_public: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-border dark:border-border-dark"
                />
                <label
                  htmlFor="is_public"
                  className="text-sm text-text-secondary dark:text-text-secondary-dark"
                >
                  Make this graph public
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-border dark:border-border-dark text-text-primary dark:text-text-primary-dark hover:bg-bg-elevated dark:hover:bg-bg-elevated-dark"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 btn-primary btn-md"
                >
                  {isCreating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
