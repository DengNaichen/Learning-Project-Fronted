import apiClient from "../../../api/client";
import type {
  FetchGraphResponseDTO,
  EnrollmentRequestDTO,
  EnrollmentResponseDTO,
  KnowledgeGraphVisualization,
  CreateGraphRequestDTO,
  CreateGraphResponseDTO,
  GraphContentResponse,
} from "../types/graph";

export const getAllGraph = async (): Promise<FetchGraphResponseDTO[]> => {
  const response = await apiClient.get<FetchGraphResponseDTO[]>(
    "/graphs/templates"
  );
  return response.data;
};

export const getGraph = async (
  graphId: string
): Promise<FetchGraphResponseDTO> => {
  const response = await apiClient.get<FetchGraphResponseDTO>(
    `/graphs/${graphId}/`
  );
  return response.data;
};

export const enrollInGraph = async (
  graphId: string
): Promise<EnrollmentResponseDTO> => {
  const requestBody: EnrollmentRequestDTO = {
    graph_id: graphId,
  };
  const response = await apiClient.post<EnrollmentResponseDTO>(
    `/graphs/${graphId}/enrollments`,
    requestBody
  );
  return response.data;
};

export const getKnowledgeGraph = async (
  graphId: string
): Promise<KnowledgeGraphVisualization> => {
  const response = await apiClient.get<KnowledgeGraphVisualization>(
    `/graphs/${graphId}/visualization`
  );
  return response.data;
};

export const createGraph = async (
  data: CreateGraphRequestDTO
): Promise<CreateGraphResponseDTO> => {
  console.log("createGraph API called with:", data);
  const response = await apiClient.post<CreateGraphResponseDTO>(
    "/me/graphs",
    data
  );
  console.log("createGraph API response:", response.data);
  return response.data;
};

export const getMyGraphs = async (): Promise<FetchGraphResponseDTO[]> => {
  const response = await apiClient.get<FetchGraphResponseDTO[]>("/me/graphs");
  return response.data;
};

export const getMyGraph = async (
  graphId: string
): Promise<FetchGraphResponseDTO> => {
  const response = await apiClient.get<FetchGraphResponseDTO>(
    `/me/graphs/${graphId}`
  );
  return response.data;
};

export const getMyGraphContent = async (
  graphId: string
): Promise<GraphContentResponse> => {
  const response = await apiClient.get<GraphContentResponse>(
    `/me/graphs/${graphId}/content`
  );
  return response.data;
};

export const getGraphContent = async (
  graphId: string
): Promise<GraphContentResponse> => {
  const response = await apiClient.get<GraphContentResponse>(
    `/graphs/${graphId}/content`
  );
  return response.data;
};
