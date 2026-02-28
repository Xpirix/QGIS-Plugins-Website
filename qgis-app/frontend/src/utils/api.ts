/**
 * API client utilities – all calls go through /api/v1/
 * Authentication uses JWT access tokens stored in localStorage.
 */

const API_BASE = "/api/v1";

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Plugin {
  id: number;
  package_name: string;
  name: string;
  description: string;
  about: string | null;
  author: string;
  email: string;
  icon_url: string | null;
  created_on: string;
  created_by: UserBrief;
  repository: string | null;
  tracker: string | null;
  homepage: string | null;
  deprecated: boolean;
  approved: boolean;
  featured: boolean;
  downloads: number;
  tags: string[];
  latest_version: PluginVersionBrief | null;
  absolute_url: string;
  rating_score: number;
  rating_votes: number;
}

export interface PluginDetail extends Plugin {
  versions: PluginVersion[];
  owners: UserBrief[];
  can_edit: boolean;
  can_approve: boolean;
}

export interface PluginVersionBrief {
  id: number;
  version: string;
  min_qg_version: string;
  max_qg_version: string;
  created_on: string;
  experimental: boolean;
  supports_qt6: boolean;
}

export interface PluginVersion extends PluginVersionBrief {
  created_by: UserBrief | null;
  approved: boolean;
  changelog: string | null;
  download_url: string;
  downloads: number;
}

export interface UserBrief {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

export interface UserProfile extends UserBrief {
  email: string;
  is_staff: boolean;
  is_trusted: boolean;
  plugins_count: number;
  date_joined: string;
}

export interface AppConfig {
  csrf_token: string;
  user: {
    is_authenticated: boolean;
    username: string;
    is_staff: boolean;
    first_name: string;
    last_name: string;
  };
  navigation: NavigationItem[];
}

export interface NavigationItem {
  label: string;
  url: string;
  children?: NavigationItem[];
}

export interface Tag {
  name: string;
  slug: string;
  num_times: number;
}

// ─── Token storage ────────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
}

export function clearTokens(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

// ─── Base fetch wrapper ───────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // For multipart form uploads, let the browser set Content-Type with boundary
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return { status: response.status };
    }

    let data: T | undefined;
    let error: string | undefined;

    try {
      const json = await response.json();
      if (response.ok) {
        data = json as T;
      } else {
        error =
          json.detail ||
          json.error ||
          JSON.stringify(json) ||
          response.statusText;
      }
    } catch {
      if (!response.ok) {
        error = response.statusText;
      }
    }

    return { data, error, status: response.status };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Network error",
      status: 0,
    };
  }
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export async function apiLogin(
  username: string,
  password: string
): Promise<ApiResponse<{ access: string; refresh: string }>> {
  return apiFetch("/auth/token/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function apiRefreshToken(
  refresh: string
): Promise<ApiResponse<{ access: string }>> {
  return apiFetch("/auth/token/refresh/", {
    method: "POST",
    body: JSON.stringify({ refresh }),
  });
}

export async function apiGetCurrentUser(): Promise<
  ApiResponse<UserProfile>
> {
  return apiFetch("/user/me/");
}

export async function apiLogout(): Promise<ApiResponse<void>> {
  clearTokens();
  return { status: 200 };
}

// ─── Config API ───────────────────────────────────────────────────────────────

export async function apiGetConfig(): Promise<ApiResponse<AppConfig>> {
  return apiFetch("/config/");
}

// ─── Plugin API ───────────────────────────────────────────────────────────────

export interface PluginListParams {
  search?: string;
  tag?: string;
  sort?: string;
  order?: string;
  page?: number;
  page_size?: number;
  filter?: string; // 'fresh' | 'latest' | 'popular' | 'stable' | 'experimental' | etc.
  username?: string;
  author?: string;
}

export async function apiGetPlugins(
  params: PluginListParams = {}
): Promise<ApiResponse<PaginatedResponse<Plugin>>> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      qs.set(k, String(v));
    }
  });
  return apiFetch(`/plugins/?${qs.toString()}`);
}

export async function apiGetPlugin(
  packageName: string
): Promise<ApiResponse<PluginDetail>> {
  return apiFetch(`/plugins/${packageName}/`);
}

export async function apiUploadPlugin(
  formData: FormData
): Promise<ApiResponse<Plugin>> {
  return apiFetch("/plugins/upload/", {
    method: "POST",
    body: formData,
  });
}

export async function apiUpdatePlugin(
  packageName: string,
  data: Partial<Plugin>
): Promise<ApiResponse<Plugin>> {
  return apiFetch(`/plugins/${packageName}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function apiDeletePlugin(
  packageName: string
): Promise<ApiResponse<void>> {
  return apiFetch(`/plugins/${packageName}/delete/`, {
    method: "POST",
  });
}

export async function apiGetTags(): Promise<ApiResponse<Tag[]>> {
  return apiFetch("/tags/");
}

// ─── Plugin Version API ───────────────────────────────────────────────────────

export async function apiGetVersion(
  packageName: string,
  version: string
): Promise<ApiResponse<PluginVersion>> {
  return apiFetch(`/plugins/${packageName}/versions/${version}/`);
}

export async function apiApproveVersion(
  packageName: string,
  version: string
): Promise<ApiResponse<PluginVersion>> {
  return apiFetch(`/plugins/${packageName}/versions/${version}/approve/`, {
    method: "POST",
  });
}

export async function apiUnapproveVersion(
  packageName: string,
  version: string
): Promise<ApiResponse<PluginVersion>> {
  return apiFetch(`/plugins/${packageName}/versions/${version}/unapprove/`, {
    method: "POST",
  });
}

export async function apiDeleteVersion(
  packageName: string,
  version: string
): Promise<ApiResponse<void>> {
  return apiFetch(`/plugins/${packageName}/versions/${version}/`, {
    method: "DELETE",
  });
}

// ─── User API ─────────────────────────────────────────────────────────────────

export async function apiGetUser(
  username: string
): Promise<ApiResponse<UserProfile>> {
  return apiFetch(`/user/${username}/`);
}

export async function apiTrustUser(
  username: string
): Promise<ApiResponse<UserProfile>> {
  return apiFetch(`/user/${username}/trust/`, { method: "POST" });
}

export async function apiUntrustUser(
  username: string
): Promise<ApiResponse<UserProfile>> {
  return apiFetch(`/user/${username}/untrust/`, { method: "POST" });
}

export async function apiBlockUser(
  username: string
): Promise<ApiResponse<UserProfile>> {
  return apiFetch(`/user/${username}/block/`, { method: "POST" });
}

export async function apiUnblockUser(
  username: string
): Promise<ApiResponse<UserProfile>> {
  return apiFetch(`/user/${username}/unblock/`, { method: "POST" });
}
