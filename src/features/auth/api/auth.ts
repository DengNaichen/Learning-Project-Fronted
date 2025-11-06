import apiClient from "../../../api/client";
import type {
  RegistrationRequest,
  LoginRequest,
  RegistrationResponse,
  LoginResponse,
} from "../types/auth";

export const registerUser = async (data: RegistrationRequest) => {
  const response = await apiClient.post<RegistrationResponse>(
    "/users/register",
    data
  );
  return response.data;
};

export const loginUser = async (data: LoginRequest) => {
  const formData = new URLSearchParams();
  formData.append("username", data.email);
  formData.append("password", data.password);

  const response = await apiClient.post<LoginResponse>(
    "/users/login",
    formData
  );
  return response.data;
};
