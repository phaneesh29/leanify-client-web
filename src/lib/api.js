const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function handleResponse(response) {
  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = isJson && data.message ? data.message : "Something went wrong";
    throw new ApiError(message, response.status, data);
  }

  return data;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  if (options.body && typeof options.body === "object") {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    return await handleResponse(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error.message === "Failed to fetch"
        ? "Unable to connect to server. Please check your internet connection."
        : error.message,
      0
    );
  }
}

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: "GET" }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: "POST", body }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: "PUT", body }),
  patch: (endpoint, body, options = {}) => request(endpoint, { ...options, method: "PATCH", body }),
  delete: (endpoint, body, options = {}) =>
    request(endpoint, { ...options, method: "DELETE", ...(body ? { body } : {}) }),
};

// ── Auth API ──────────────────────────────────────────────────────────────────

export const authApi = {
  // Student
  studentRegister: (data) => api.post("/auth/student/register", data),
  studentLogin: (data) => api.post("/auth/student/login", data),
  studentLogout: () => api.get("/auth/student/logout"),
  studentProfile: () => api.get("/auth/student/profile"),
  studentUpdateProfile: (data) => api.patch("/auth/student/profile", data),
  studentVerify: (token) => api.post("/auth/student/verify", { token }),
  studentResendEmail: (email) => api.post("/auth/student/resend-email", { email }),
  studentForgotPassword: (email) => api.post("/auth/student/forgot-password", { email }),
  studentResetPassword: (data) => api.post("/auth/student/reset-password", data),

  // Instructor
  instructorRegister: (data) => api.post("/auth/instructor/register", data),
  instructorLogin: (data) => api.post("/auth/instructor/login", data),
  instructorLogout: () => api.get("/auth/instructor/logout"),
  instructorProfile: () => api.get("/auth/instructor/profile"),
  instructorUpdateProfile: (data) => api.patch("/auth/instructor/profile", data),
  instructorVerify: (token) => api.post("/auth/instructor/verify", { token }),
  instructorResendEmail: (email) => api.post("/auth/instructor/resend-email", { email }),
  instructorForgotPassword: (email) => api.post("/auth/instructor/forgot-password", { email }),
  instructorResetPassword: (data) => api.post("/auth/instructor/reset-password", data),

  // Admin
  adminLogin: (data) => api.post("/auth/admin/login", data),
  adminRegister: (data) => api.post("/auth/admin/register", data),
  adminLogout: () => api.get("/auth/admin/logout"),
  adminProfile: () => api.get("/auth/admin/profile"),
  adminChangePassword: (data) => api.post("/auth/admin/change-password", data),
};

// ── Admin Management API ──────────────────────────────────────────────────────

export const adminApi = {
  getInstructors: () => api.get("/admin/get/instructors"),
  getStudents: () => api.get("/admin/get/students"),
  getDeletedUsers: () => api.get("/admin/get/deleted-users"),
  approveInstructor: (id) => api.patch(`/admin/approve/instructor/${id}`),
  deleteUser: (id) => api.delete(`/admin/delete/user/${id}`),
  assignInstructor: (courseId, instructorId) =>
    api.post(`/admin/assign/course/${courseId}/instructor/${instructorId}`),
  unassignInstructor: (courseId, instructorId) =>
    api.delete(`/admin/unassign/course/${courseId}/instructor/${instructorId}`),

  // Course Sections
  addSection: (courseId, data) => api.post(`/admin/course/${courseId}/section`, data),
  updateSection: (sectionId, data) => api.put(`/admin/section/${sectionId}`, data),
  deleteSection: (sectionId) => api.delete(`/admin/section/${sectionId}`),

  // Lessons
  addLesson: (sectionId, data) => api.post(`/admin/section/${sectionId}/lesson`, data),
  updateLesson: (lessonId, data) => api.put(`/admin/lesson/${lessonId}`, data),
  deleteLesson: (lessonId) => api.delete(`/admin/lesson/${lessonId}`),
};

// ── Instructor API ────────────────────────────────────────────────────────────

export const instructorApi = {
  myCourses: () => api.get("/instructor/my-courses"),
  addSkills: (skills) => api.post("/instructor/add-skill", { skills }),
  removeSkill: (skill) => api.delete("/instructor/remove-skill", { skill }),
};

// ── Course API ────────────────────────────────────────────────────────────────

export const courseApi = {
  // Admin only
  createCourse: (data) => api.post("/courses/create", data),
  toggleVisibility: (courseId) => api.patch(`/courses/visibility/${courseId}`),
  updateCourse: (courseId, data) => api.put(`/courses/update/${courseId}`, data),
  deleteCourse: (courseId) => api.delete(`/courses/delete/${courseId}`),
  adminViewAllCourses: () => api.get("/courses/admin/view"),

  // Public
  viewAllCourses: () => api.get("/courses/view"),
  viewCourseById: (courseId) => api.get(`/courses/view/${courseId}`),
  searchCourses: (query) => api.post("/courses/search", { query }),
};

// ── Health API ────────────────────────────────────────────────────────────────

export const healthApi = {
  check: () => api.get("/health"),
};

export { ApiError };
