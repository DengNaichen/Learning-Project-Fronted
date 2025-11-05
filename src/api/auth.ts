import apiClient from "./client";

export interface RegistrationRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegistrationResponse {
  id: string;
  name: string;
  email: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

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
