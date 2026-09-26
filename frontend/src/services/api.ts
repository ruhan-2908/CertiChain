import type {
  AuthResponse,
  CurrentUser,
  LoginRequest,
  RegisterRequest,
} from "../types/auth";

import type {
  Certificate,
  CreateCertificateRequest,
  RevokeCertificateResponse,
  VerifyCertificateResponse,
  VerifyUploadResponse,
} from "../types/certificate";

const API_BASE_URL = "http://localhost:8080";

function getToken(): string | null {
  return localStorage.getItem("certichain_token");
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const headers = new Headers(options.headers);

  if (
    options.body &&
    !(options.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`,
    );
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers,
    },
  );

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorBody = await response.json();

      if (errorBody.message) {
        message = errorBody.message;
      }
    } catch {
      // Response may not contain JSON.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/* =========================
   AUTH
========================= */

export async function login(
  data: LoginRequest,
): Promise<AuthResponse> {
  return request<AuthResponse>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export async function register(
  data: RegisterRequest,
): Promise<AuthResponse> {
  return request<AuthResponse>(
    "/api/auth/register",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return request<CurrentUser>(
    "/api/auth/me",
  );
}

/* =========================
   CERTIFICATES
========================= */

export async function createCertificate(
  data: CreateCertificateRequest,
): Promise<Certificate> {
  return request<Certificate>(
    "/api/certificates",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export async function getCertificates(): Promise<Certificate[]> {
  return request<Certificate[]>(
    "/api/certificates",
  );
}

export async function getCertificate(
  certificateId: string,
): Promise<Certificate> {
  return request<Certificate>(
    `/api/certificates/${encodeURIComponent(certificateId)}`,
  );
}

export async function getMyCertificates(): Promise<Certificate[]> {
  return request<Certificate[]>(
    "/api/certificates/my",
  );
}

export async function revokeCertificate(
  certificateId: string,
): Promise<RevokeCertificateResponse> {
  return request<RevokeCertificateResponse>(
    `/api/certificates/${encodeURIComponent(certificateId)}/revoke`,
    {
      method: "PATCH",
    },
  );
}

/* =========================
   PUBLIC VERIFICATION
========================= */

export async function verifyCertificate(
  certificateId: string,
): Promise<VerifyCertificateResponse> {
  return request<VerifyCertificateResponse>(
    `/api/verify/${encodeURIComponent(certificateId)}`,
  );
}

export async function verifyCertificateFile(
  certificateId: string,
  file: File,
): Promise<VerifyUploadResponse> {
  const formData = new FormData();

  formData.append("file", file);

  return request<VerifyUploadResponse>(
    `/api/verify/${encodeURIComponent(certificateId)}/upload`,
    {
      method: "POST",
      body: formData,
    },
  );
}