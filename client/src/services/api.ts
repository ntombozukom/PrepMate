import axios, { AxiosError } from 'axios';
import type {
  AuthResponse,
  UserDto,
  CvDocumentDto,
  PrepSessionDetailDto,
  PrepSessionDto,
  CreatePrepSessionRequest,
  ConceptExplanationDto,
  JdAnalysisResult,
  CvMatchResultDto,
  CoverLetterDto,
  AtsOptimizationDto,
} from '../types/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

export const apiClient = axios.create({ baseURL: `${BASE_URL}/api/v1` });

// Attach JWT on every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    apiClient.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  googleLogin: (idToken: string) =>
    apiClient.post<AuthResponse>('/auth/google', { idToken }).then((r) => r.data),
};

// ─── CV ───────────────────────────────────────────────────────────────────────
export const cvApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient
      .post<CvDocumentDto>('/cv/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  getActive: () =>
    apiClient.get<CvDocumentDto>('/cv/active')
      .then((r) => r.data)
      .catch((e: AxiosError) => {
        if (e.response?.status === 404) return null;
        throw e;
      }),
};

// ─── JD Text Extraction & Analysis ───────────────────────────────────────────
export const jdApi = {
  extractText: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const res = await apiClient.post<{ text: string }>('/prep-sessions/extract-jd-text', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.text;
  },

  analyzeJd: (jobDescriptionText: string) =>
    apiClient
      .post<JdAnalysisResult>('/prep-sessions/analyze-jd', { jobDescriptionText })
      .then((r) => r.data),
};

// ─── Prep Sessions ────────────────────────────────────────────────────────────
export const prepSessionApi = {
  create: (data: CreatePrepSessionRequest) =>
    apiClient.post<PrepSessionDetailDto>('/prep-sessions', data).then((r) => r.data),

  getAll: () =>
    apiClient.get<PrepSessionDto[]>('/prep-sessions').then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<PrepSessionDetailDto>(`/prep-sessions/${id}`).then((r) => r.data),
};

// ─── Concepts ─────────────────────────────────────────────────────────────────
export const conceptsApi = {
  getBySession: (sessionId: string) =>
    apiClient
      .get<ConceptExplanationDto[]>(`/prep-sessions/${sessionId}/concepts`)
      .then((r) => r.data),
};

// ─── Profile ──────────────────────────────────────────────────────────────────
export const profileApi = {
  get: () =>
    apiClient.get<UserDto>('/profile').then((r) => r.data),

  update: (data: { firstName: string; lastName: string }) =>
    apiClient.put<UserDto>('/profile', data).then((r) => r.data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.post('/profile/change-password', data).then(() => undefined),
};

// ─── CV Tools ─────────────────────────────────────────────────────────────────
export const cvToolsApi = {
  analyzeMatch: (data: { cvDocumentId: string; jobDescriptionText: string; jobTitle: string }) =>
    apiClient.post<CvMatchResultDto>('/cvtools/match-analysis', data).then((r) => r.data),

  generateCoverLetter: (data: {
    cvDocumentId: string;
    jobDescriptionText?: string;
    jobTitle?: string;
    companyName?: string;
  }) => apiClient.post<CoverLetterDto>('/cvtools/cover-letter', data).then((r) => r.data),

  optimizeAts: (cvDocumentId: string) =>
    apiClient.post<AtsOptimizationDto>('/cvtools/ats-optimize', { cvDocumentId }).then((r) => r.data),
};

// Helper to extract readable error message
export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data;
    // Flatten field-level validation errors into a readable string
    if (data.errors && typeof data.errors === 'object') {
      const messages = Object.values(data.errors).flat() as string[];
      if (messages.length > 0) return messages.join(' ');
    }
    return data.title ?? 'An error occurred.';
  }
  return 'An unexpected error occurred.';
}
