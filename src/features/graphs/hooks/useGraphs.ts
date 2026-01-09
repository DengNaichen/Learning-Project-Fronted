import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createGraph,
  enrollInTemplateGraph,
  getGraphVisualization,
  getMyGraph,
  getMyGraphContent,
  getMyGraphVisualization,
  getMyGraphs,
  getPublicGraphContent,
  getTemplateGraph,
  getTemplateGraphs,
} from "../../../api/backend";
import {
  mapKnowledgeGraphToGraph,
  type CreateGraphRequestDTO,
  type CreateGraphResponseDTO,
  type EnrollmentResponseDTO,
  type FetchGraphResponseDTO,
  type Graph,
  type GraphContentResponse,
  type KnowledgeGraphVisualization,
} from "../../../domain/graph";

export function useGetAllGraph() {
  return useQuery<FetchGraphResponseDTO[], Error, Graph[]>({
    queryKey: ["graphs"],
    queryFn: getTemplateGraphs,
    select: (data) =>
      Array.isArray(data) ? data.map(mapKnowledgeGraphToGraph) : [],
  });
}

export function useGetGraph(graphId: string | undefined) {
  return useQuery<FetchGraphResponseDTO, Error, Graph>({
    queryKey: ["graphs", graphId],
    queryFn: () => getTemplateGraph(graphId!),
    select: mapKnowledgeGraphToGraph,
    enabled: !!graphId,
  });
}

export function useEnrollInGraph() {
  const queryClient = useQueryClient();
  return useMutation<EnrollmentResponseDTO, Error, string>({
    mutationFn: (graphId) => enrollInTemplateGraph(graphId),

    onSuccess: (_data, graphId) => {
      // Update cache immediately for optimistic UI
      queryClient.setQueryData<Graph[]>(["graphs"], (oldData) => {
        if (!oldData) return [];
        return oldData.map((graph) =>
          graph.graphId === graphId ? { ...graph, isEnrolled: true } : graph
        );
      });

      queryClient.setQueryData<Graph>(["graphs", graphId], (oldData) => {
        if (!oldData) return undefined;
        return { ...oldData, isEnrolled: true };
      });

      // Invalidate queries to refetch and ensure UI is in sync
      queryClient.invalidateQueries({ queryKey: ["graphs"] });
      queryClient.invalidateQueries({ queryKey: ["graphs", graphId] });
    },

    onError: (error: Error, graphId) => {
      console.error(`Failed to enroll in graph ${graphId}:`, error.message);
    },
  });
}

export function useGetKnowledgeGraph(
  graphId: string | undefined,
  isOwner: boolean = false
) {
  return useQuery<KnowledgeGraphVisualization, Error>({
    queryKey: ["knowledgeGraph", graphId, isOwner],
    queryFn: () =>
      isOwner ? getMyGraphVisualization(graphId!) : getGraphVisualization(graphId!),
    enabled: !!graphId,
  });
}

export function useCreateGraph() {
  const queryClient = useQueryClient();
  return useMutation<CreateGraphResponseDTO, Error, CreateGraphRequestDTO>({
    mutationFn: (data) => createGraph(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["graphs"] });
      queryClient.invalidateQueries({ queryKey: ["myGraphs"] });
    },
    onError: (error: Error) => {
      console.error("Failed to create graph:", error.message);
    },
  });
}

export function useGetMyGraphs() {
  return useQuery<FetchGraphResponseDTO[], Error, Graph[]>({
    queryKey: ["myGraphs"],
    queryFn: getMyGraphs,
    select: (data) =>
      Array.isArray(data) ? data.map(mapKnowledgeGraphToGraph) : [],
  });
}

export function useGetMyGraph(graphId: string | undefined) {
  return useQuery<FetchGraphResponseDTO, Error, Graph>({
    queryKey: ["myGraphs", graphId],
    queryFn: () => getMyGraph(graphId!),
    select: mapKnowledgeGraphToGraph,
    enabled: !!graphId,
  });
}

export function useGetMyGraphContent(graphId: string | undefined) {
  return useQuery<GraphContentResponse, Error>({
    queryKey: ["myGraphContent", graphId],
    queryFn: () => getMyGraphContent(graphId!),
    enabled: !!graphId,
  });
}

export function useGetGraphContent(graphId: string | undefined) {
  return useQuery<GraphContentResponse, Error>({
    queryKey: ["graphContent", graphId],
    queryFn: () => getPublicGraphContent(graphId!),
    enabled: !!graphId,
  });
}
