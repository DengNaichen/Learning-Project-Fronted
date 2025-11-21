import apiClient from "../../../api/client";
import type {
  FetchGraphResponseDTO,
  EnrollmentRequestDTO,
  EnrollmentResponseDTO,
  KnowledgeGraphVisualization,
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
    `/graphs/${graphId}/enrollments/`,
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
