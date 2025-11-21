import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllGraph,
  getGraph,
  enrollInGraph,
  getKnowledgeGraph,
} from "../api/graphs";
import type {
  FetchGraphResponseDTO,
  EnrollmentResponseDTO,
  Graph,
  ApiError,
  KnowledgeGraphVisualization,
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

    onSuccess: (data, graphId) => {
      console.log("Enrollment successful for graph:", graphId, data);

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
