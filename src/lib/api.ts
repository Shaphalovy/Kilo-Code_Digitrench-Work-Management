// API Base URL - Change this to your backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Helper function for API calls
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// ==================== AUTH API ====================

export const authAPI = {
  login: (email: string, password: string) =>
    fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};

// ==================== USERS API ====================

export const usersAPI = {
  getAll: () => fetchAPI('/users'),
  
  getById: (id: string) => fetchAPI(`/users/${id}`),
  
  create: (userData: {
    name: string;
    email: string;
    password: string;
    role: string;
    department: string;
    position: string;
  }) =>
    fetchAPI('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  
  update: (id: string, userData: {
    name?: string;
    email?: string;
    role?: string;
    department?: string;
    position?: string;
    isActive?: boolean;
  }) =>
    fetchAPI(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),
  
  delete: (id: string) =>
    fetchAPI(`/users/${id}`, { method: 'DELETE' }),
  
  activate: (id: string) =>
    fetchAPI(`/users/${id}/activate`, { method: 'PATCH' }),
  
  deactivate: (id: string) =>
    fetchAPI(`/users/${id}/deactivate`, { method: 'PATCH' }),
};

// ==================== DEPARTMENTS API ====================

export const departmentsAPI = {
  getAll: () => fetchAPI('/departments'),
  
  create: (data: { id: string; name: string; color: string }) =>
    fetchAPI('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: { name?: string; color?: string }) =>
    fetchAPI(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    fetchAPI(`/departments/${id}`, { method: 'DELETE' }),
};

// ==================== PROJECTS API ====================

export const projectsAPI = {
  getAll: () => fetchAPI('/projects'),
  
  getById: (id: string) => fetchAPI(`/projects/${id}`),
  
  create: (projectData: {
    name: string;
    description: string;
    department: string;
    createdBy: string;
    members: string[];
    status: string;
    startDate: string;
    endDate?: string;
    color: string;
  }) =>
    fetchAPI('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    }),
  
  update: (id: string, projectData: Partial<{
    name: string;
    description: string;
    department: string;
    members: string[];
    status: string;
    startDate: string;
    endDate: string;
    color: string;
  }>) =>
    fetchAPI(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    }),
  
  delete: (id: string) =>
    fetchAPI(`/projects/${id}`, { method: 'DELETE' }),
};

// ==================== TASKS API ====================

export const tasksAPI = {
  getAll: () => fetchAPI('/tasks'),
  
  getById: (id: string) => fetchAPI(`/tasks/${id}`),
  
  create: (taskData: {
    title: string;
    description: string;
    projectId: string;
    assigneeId: string;
    createdBy: string;
    status: string;
    priority: string;
    dueDate: string;
    startDate?: string;
    tags: string[];
    estimatedHours?: number;
  }) =>
    fetchAPI('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    }),
  
  update: (id: string, taskData: Partial<{
    title: string;
    description: string;
    assigneeId: string;
    status: string;
    priority: string;
    dueDate: string;
    startDate: string;
    completedAt: string;
    tags: string[];
    subtasks: Array<{ id: string; title: string; completed: boolean }>;
    estimatedHours: number;
    actualHours: number;
  }>) =>
    fetchAPI(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    }),
  
  delete: (id: string) =>
    fetchAPI(`/tasks/${id}`, { method: 'DELETE' }),
};

// ==================== COMMENTS API ====================

export const commentsAPI = {
  getByTaskId: (taskId: string) => fetchAPI(`/tasks/${taskId}/comments`),
  
  create: (data: {
    taskId: string;
    userId: string;
    content: string;
    mentions: string[];
  }) =>
    fetchAPI('/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    fetchAPI(`/comments/${id}`, { method: 'DELETE' }),
};

// ==================== TIME ENTRIES API ====================

export const timeEntriesAPI = {
  getAll: (filters?: { userId?: string; taskId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.taskId) params.append('taskId', filters.taskId);
    const query = params.toString();
    return fetchAPI(`/time-entries${query ? `?${query}` : ''}`);
  },
  
  create: (data: {
    taskId: string;
    userId: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    notes?: string;
    date: string;
  }) =>
    fetchAPI('/time-entries', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: {
    endTime?: string;
    duration?: number;
    notes?: string;
  }) =>
    fetchAPI(`/time-entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    fetchAPI(`/time-entries/${id}`, { method: 'DELETE' }),
};

// ==================== NOTIFICATIONS API ====================

export const notificationsAPI = {
  getByUserId: (userId: string) => fetchAPI(`/notifications/${userId}`),
  
  markAsRead: (id: string) =>
    fetchAPI(`/notifications/${id}/read`, { method: 'PATCH' }),
};

// ==================== SEED API ====================

export const seedAPI = {
  seed: () => fetchAPI('/seed', { method: 'POST' }),
};
