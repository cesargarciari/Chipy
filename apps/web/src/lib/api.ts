import type { CareerResponse, CreateCareerRequest, LeaderboardResponse } from '@chipy/shared';
import { API_URL } from './config.js';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new ApiError(0, 'network error - is the API running?');
  }

  const text = await res.text();
  const body = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    throw new ApiError(res.status, body?.message ?? res.statusText);
  }
  return body as T;
}

export const api = {
  createCareer: (input: CreateCareerRequest) =>
    request<CareerResponse>('/api/careers', { method: 'POST', body: JSON.stringify(input) }),

  getCareer: (id: string) => request<CareerResponse>(`/api/careers/${id}`),

  leaderboard: (params: { month?: string; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.month) qs.set('month', params.month);
    if (params.limit) qs.set('limit', String(params.limit));
    const suffix = qs.toString() ? `?${qs}` : '';
    return request<LeaderboardResponse>(`/api/leaderboard${suffix}`);
  },
};
