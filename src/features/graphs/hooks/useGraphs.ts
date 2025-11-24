import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllGraph,
  getGraph,
  enrollInGraph,
  getKnowledgeGraph,
  createGraph,
  getMyGraphs,
  getMyGraph,
  getMyGraphContent,
  getGraphContent,
} from "../api/graphs";
import type {
  FetchGraphResponseDTO,
  EnrollmentResponseDTO,
  Graph,
  ApiError,
  KnowledgeGraphVisualization,
  CreateGraphRequestDTO,
  CreateGraphResponseDTO,
  GraphContentResponse,
} from "../types/graph";

function convertDtoToGraph(dto: FetchGraphResponseDTO): Graph {
  return {
    graphId: dto.id,
    graphName: dto.name,
    numOfKnowledgeNodes: dto.node_count,
    isEnrolled: dto.is_enrolled ?? false,
    isPrimary: dto.is_template ?? false,
  };
}

export function useGetAllGraph() {
  return useQuery<FetchGraphResponseDTO[], Error, Graph[]>({
    queryKey: ["graphs"],
    queryFn: getAllGraph,
    select: (data) => data.map(convertDtoToGraph),
  });
}

export function useGetGraph(graphId: string | undefined) {
  return useQuery<FetchGraphResponseDTO, Error, Graph>({
    queryKey: ["graphs", graphId],
    queryFn: () => getGraph(graphId!),
    select: convertDtoToGraph,
    enabled: !!graphId,
  });
}

export function useEnrollInGraph() {
  const queryClient = useQueryClient();
  return useMutation<EnrollmentResponseDTO, Error, string>({
    mutationFn: enrollInGraph,

    onSuccess: (_data, graphId) => {
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
    },

    onError: (error: ApiError, graphId) => {
      console.error(`Failed to enroll in graph ${graphId}:`, error.message);
    },
  });
}

export function useGetKnowledgeGraph(graphId: string | undefined) {
  return useQuery<KnowledgeGraphVisualization, Error>({
    queryKey: ["knowledgeGraph", graphId],
    queryFn: () => getKnowledgeGraph(graphId!),
    enabled: !!graphId,
  });
}

export function useCreateGraph() {
  const queryClient = useQueryClient();
  return useMutation<CreateGraphResponseDTO, Error, CreateGraphRequestDTO>({
    mutationFn: createGraph,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["graphs"] });
      queryClient.invalidateQueries({ queryKey: ["myGraphs"] });
    },
    onError: (error: ApiError) => {
      console.error("Failed to create graph:", error.message);
    },
  });
}

export function useGetMyGraphs() {
  return useQuery<FetchGraphResponseDTO[], Error, Graph[]>({
    queryKey: ["myGraphs"],
    queryFn: getMyGraphs,
    select: (data) => data.map(convertDtoToGraph),
  });
}

export function useGetMyGraph(graphId: string | undefined) {
  return useQuery<FetchGraphResponseDTO, Error, Graph>({
    queryKey: ["myGraphs", graphId],
    queryFn: () => getMyGraph(graphId!),
    select: convertDtoToGraph,
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
    queryFn: () => getGraphContent(graphId!),
    enabled: !!graphId,
  });
}
