import axios from 'axios';

// ✅ ALWAYS use deployed backend URL
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://appforge-wo9d.onrender.com"; // fallback

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ================= REQUEST INTERCEPTOR =================
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("af_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ================= RESPONSE INTERCEPTOR =================
api.interceptors.response.use(
  (res) => res,
  (error) => {
    console.error("API ERROR:", error?.response || error.message);

    if (error.response?.status === 401 && typeof window !== "undefined") {
      const isAuthRoute = window.location.pathname.startsWith("/auth");

      if (!isAuthRoute) {
        localStorage.removeItem("af_token");
        localStorage.removeItem("af_user");
        window.location.href = "/auth/login";
      }
    }

    return Promise.reject(error);
  }
);

// ================= AUTH =================
export const authApi = {
  register: (data: { email: string; password: string; name?: string }) =>
    api.post("/auth/register", data),

  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),

  me: () => api.get("/auth/me"),

  update: (data: { name?: string; locale?: string }) =>
    api.patch("/auth/me", data),
};

// ================= APPS =================
export const appsApi = {
  list: () => api.get("/apps"),
  create: (config: object) => api.post("/apps", config),
  get: (id: string) => api.get(`/apps/${id}`),
  getBySlug: (slug: string) => api.get(`/apps/slug/${slug}`),
  update: (id: string, config: object) => api.put(`/apps/${id}`, config),
  publish: (id: string, published: boolean) =>
    api.patch(`/apps/${id}/publish`, { published }),
  delete: (id: string) => api.delete(`/apps/${id}`),
};

// ================= DYNAMIC =================
export const dynamicApi = {
  list: (appId: string, collection: string, params?: Record<string, unknown>) =>
    api.get(`/dynamic/${appId}/${collection}`, { params }),

  get: (appId: string, collection: string, id: string) =>
    api.get(`/dynamic/${appId}/${collection}/${id}`),

  create: (appId: string, collection: string, data: object) =>
    api.post(`/dynamic/${appId}/${collection}`, data),

  update: (appId: string, collection: string, id: string, data: object) =>
    api.put(`/dynamic/${appId}/${collection}/${id}`, data),

  patch: (appId: string, collection: string, id: string, data: object) =>
    api.patch(`/dynamic/${appId}/${collection}/${id}`, data),

  delete: (appId: string, collection: string, id: string) =>
    api.delete(`/dynamic/${appId}/${collection}/${id}`),
};

// ================= CSV =================
export const csvApi = {
  preview: (appId: string, collection: string, file: File) => {
    const form = new FormData();
    form.append("file", file);

    return api.post(`/csv/${appId}/${collection}/preview`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  import: (
    appId: string,
    collection: string,
    file: File,
    mapping: Record<string, string>
  ) => {
    const form = new FormData();
    form.append("file", file);
    form.append("mapping", JSON.stringify(mapping));

    return api.post(`/csv/${appId}/${collection}/import`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  imports: (appId: string) => api.get(`/csv/${appId}/imports`),
};

// ================= NOTIFICATIONS =================
export const notificationsApi = {
  list: (params?: { appId?: string; unreadOnly?: boolean }) =>
    api.get("/notifications", { params }),

  unreadCount: () => api.get("/notifications/unread-count"),

  markRead: (id: string) =>
    api.patch(`/notifications/${id}/read`),

  markAllRead: () =>
    api.post("/notifications/read-all"),
};