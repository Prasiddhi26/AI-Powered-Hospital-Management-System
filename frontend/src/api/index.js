import axios from "axios";

// Base URL from env, fallback to localhost
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// Request interceptor — attach JWT token from localStorage
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("mediflow_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("mediflow_token");
      localStorage.removeItem("mediflow_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => API.post("/auth/register", data),
  login: (data) => API.post("/auth/login", data),
  getMe: () => API.get("/auth/me"),
};

// ─── Doctors ─────────────────────────────────────────────────────────────────
export const doctorAPI = {
  getAll: (params) => API.get("/doctors", { params }),
  getById: (id) => API.get(`/doctors/${id}`),
  getSpecializations: () => API.get("/doctors/specializations"),
  updateProfile: (data) => API.put("/doctors/profile", data),
  addReview: (id, data) => API.post(`/doctors/${id}/reviews`, data),
};

// ─── Appointments ────────────────────────────────────────────────────────────
export const appointmentAPI = {
  book: (data) => API.post("/appointments", data),
  getAll: (params) => API.get("/appointments", { params }),
  getById: (id) => API.get(`/appointments/${id}`),
  updateStatus: (id, data) => API.put(`/appointments/${id}/status`, data),
  cancel: (id, data) => API.put(`/appointments/${id}/cancel`, data),
  reschedule: (id, data) => API.put(`/appointments/${id}/reschedule`, data),
  addPrescription: (id, data) => API.put(`/appointments/${id}/prescription`, data),
};

// ─── AI ──────────────────────────────────────────────────────────────────────
export const aiAPI = {
  checkSymptoms: (data) => API.post("/ai/symptom-check", data),
  suggestSpecialty: (data) => API.post("/ai/suggest-specialty", data),
};

// ─── Reports ─────────────────────────────────────────────────────────────────
export const reportAPI = {
  upload: (formData) =>
    API.post("/reports/upload", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  getMyReports: (params) => API.get("/reports", { params }),
  getPatientReports: (patientId) => API.get(`/reports/patient/${patientId}`),
  delete: (id) => API.delete(`/reports/${id}`),
  share: (id, data) => API.put(`/reports/${id}/share`, data),
};

// ─── Notifications ───────────────────────────────────────────────────────────
export const notificationAPI = {
  getAll: (params) => API.get("/notifications", { params }),
  markAsRead: (data) => API.put("/notifications/read", data),
  delete: (id) => API.delete(`/notifications/${id}`),
};

// ─── User ────────────────────────────────────────────────────────────────────
export const userAPI = {
  updateProfile: (data) => API.put("/users/profile", data),
  changePassword: (data) => API.put("/users/change-password", data),
  updateAvatar: (formData) =>
    API.put("/users/avatar", formData, { headers: { "Content-Type": "multipart/form-data" } }),
};

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats: () => API.get("/admin/stats"),
  getUsers: (params) => API.get("/admin/users", { params }),
  getPendingDoctors: () => API.get("/admin/doctors/pending"),
  verifyDoctor: (id, data) => API.put(`/admin/doctors/${id}/verify`, data),
  toggleUser: (id) => API.put(`/admin/users/${id}/toggle`),
};

export default API;