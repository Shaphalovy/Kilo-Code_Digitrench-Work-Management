'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Project, Task, Notification, ActivityLog, TaskStatus, Comment, TimeEntry, Attachment, Subtask, DepartmentConfig } from '@/types';
import { getInitialData } from './mockData';

interface AppState {
  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;

  // Data
  users: User[];
  projects: Project[];
  tasks: Task[];
  notifications: Notification[];
  activityLogs: ActivityLog[];
  departments: DepartmentConfig[];

  // UI State
  activeProjectId: string | null;
  activeDepartment: string | null;
  sidebarOpen: boolean;

  // Auth Actions
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;

  // User Actions
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // Project Actions
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Department Actions
  addDepartment: (dept: DepartmentConfig) => void;
  removeDepartment: (id: string) => void;

  // Task Actions
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  addComment: (taskId: string, comment: Comment) => void;
  addAttachment: (taskId: string, attachment: Attachment) => void;
  addTimeEntry: (taskId: string, entry: TimeEntry) => void;
  updateTimeEntry: (taskId: string, entryId: string, updates: Partial<TimeEntry>) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addSubtask: (taskId: string, subtask: Subtask) => void;

  // Notification Actions
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (userId: string) => void;
  addNotification: (notification: Notification) => void;

  // Activity Log Actions
  addActivityLog: (log: ActivityLog) => void;

  // UI Actions
  setActiveProject: (id: string | null) => void;
  setActiveDepartment: (dept: string | null) => void;
  toggleSidebar: () => void;

  // Computed helpers
  getTasksByProject: (projectId: string) => Task[];
  getTasksByAssignee: (userId: string) => Task[];
  getUserById: (id: string) => User | undefined;
  getProjectById: (id: string) => Project | undefined;
  getUnreadNotifications: (userId: string) => Notification[];
}

const initialData = getInitialData();

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      currentUser: null,
      isAuthenticated: false,
      users: initialData.users,
      projects: initialData.projects,
      tasks: initialData.tasks,
      notifications: initialData.notifications,
      activityLogs: initialData.activityLogs,
      departments: [
        { id: 'hr', name: 'Human Resources', color: '#ec4899' },
        { id: 'operations', name: 'Operations', color: '#10b981' },
        { id: 'call_center', name: 'Call Center', color: '#f59e0b' },
        { id: 'finance', name: 'Finance', color: '#3b82f6' },
        { id: 'it', name: 'IT', color: '#8b5cf6' },
        { id: 'management', name: 'Management', color: '#6366f1' },
      ],
      activeProjectId: null,
      activeDepartment: null,
      sidebarOpen: true,

      // Auth Actions
      login: (email: string, password: string) => {
        const { users } = get();
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
          if (!user.isActive) {
            return { success: false, error: 'Account is deactivated. Please contact admin.' };
          }
          const updatedUser = { ...user, lastLogin: new Date().toISOString() };
          set(state => ({
            currentUser: updatedUser,
            isAuthenticated: true,
            users: state.users.map(u => u.id === user.id ? updatedUser : u),
          }));
          return { success: true };
        }
        return { success: false, error: 'Invalid email or password.' };
      },

      logout: () => {
        set({ currentUser: null, isAuthenticated: false, activeProjectId: null, activeDepartment: null });
      },

      // User Actions
      addUser: (user) => set(state => ({ users: [...state.users, user] })),
      updateUser: (id, updates) => set(state => ({
        users: state.users.map(u => u.id === id ? { ...u, ...updates } : u),
        currentUser: state.currentUser?.id === id ? { ...state.currentUser, ...updates } : state.currentUser,
      })),
      deleteUser: (id) => set(state => ({ 
        users: state.users.filter(u => u.id !== id),
        tasks: state.tasks.filter(t => t.assigneeId !== id),
      })),

      // Project Actions
      addProject: (project) => set(state => ({ projects: [...state.projects, project] })),
      updateProject: (id, updates) => set(state => ({
        projects: state.projects.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p),
      })),
      deleteProject: (id) => set(state => ({
        projects: state.projects.filter(p => p.id !== id),
        tasks: state.tasks.filter(t => t.projectId !== id),
      })),

      // Department Actions
      addDepartment: (dept) => set(state => ({ 
        departments: [...state.departments.filter(d => d.id !== dept.id), dept] 
      })),
      removeDepartment: (id) => set(state => ({ 
        departments: state.departments.filter(d => d.id !== id) 
      })),

      // Task Actions
      addTask: (task) => set(state => ({ tasks: [...state.tasks, task] })),
      updateTask: (id, updates) => set(state => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t),
      })),
      deleteTask: (id) => set(state => ({ tasks: state.tasks.filter(t => t.id !== id) })),
      updateTaskStatus: (id, status) => {
        const now = new Date().toISOString();
        set(state => ({
          tasks: state.tasks.map(t => t.id === id ? {
            ...t,
            status,
            updatedAt: now,
            completedAt: status === 'done' ? now : t.completedAt,
          } : t),
        }));
        const { currentUser, tasks } = get();
        const task = tasks.find(t => t.id === id);
        if (currentUser && task) {
          get().addActivityLog({
            id: `log-${Date.now()}`,
            userId: currentUser.id,
            action: `Updated task status to ${status}`,
            entityType: 'task',
            entityId: id,
            details: { from: task.status, to: status },
            createdAt: now,
          });
        }
      },
      addComment: (taskId, comment) => set(state => ({
        tasks: state.tasks.map(t => t.id === taskId ? {
          ...t,
          comments: [...t.comments, comment],
          updatedAt: new Date().toISOString(),
        } : t),
      })),
      addAttachment: (taskId, attachment) => set(state => ({
        tasks: state.tasks.map(t => t.id === taskId ? {
          ...t,
          attachments: [...t.attachments, attachment],
          updatedAt: new Date().toISOString(),
        } : t),
      })),
      addTimeEntry: (taskId, entry) => set(state => ({
        tasks: state.tasks.map(t => t.id === taskId ? {
          ...t,
          timeEntries: [...t.timeEntries, entry],
          actualHours: (t.actualHours || 0) + (entry.duration ? entry.duration / 60 : 0),
          updatedAt: new Date().toISOString(),
        } : t),
      })),
      updateTimeEntry: (taskId, entryId, updates) => set(state => ({
        tasks: state.tasks.map(t => t.id === taskId ? {
          ...t,
          timeEntries: t.timeEntries.map(e => e.id === entryId ? { ...e, ...updates } : e),
        } : t),
      })),
      toggleSubtask: (taskId, subtaskId) => set(state => ({
        tasks: state.tasks.map(t => t.id === taskId ? {
          ...t,
          subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s),
          updatedAt: new Date().toISOString(),
        } : t),
      })),
      addSubtask: (taskId, subtask) => set(state => ({
        tasks: state.tasks.map(t => t.id === taskId ? {
          ...t,
          subtasks: [...t.subtasks, subtask],
          updatedAt: new Date().toISOString(),
        } : t),
      })),

      // Notification Actions
      markNotificationRead: (id) => set(state => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
      })),
      markAllNotificationsRead: (userId) => set(state => ({
        notifications: state.notifications.map(n => n.userId === userId ? { ...n, isRead: true } : n),
      })),
      addNotification: (notification) => set(state => ({
        notifications: [notification, ...state.notifications],
      })),

      // Activity Log Actions
      addActivityLog: (log) => set(state => ({
        activityLogs: [log, ...state.activityLogs],
      })),

      // UI Actions
      setActiveProject: (id) => set({ activeProjectId: id }),
      setActiveDepartment: (dept) => set({ activeDepartment: dept }),
      toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),

      // Computed helpers
      getTasksByProject: (projectId) => get().tasks.filter(t => t.projectId === projectId),
      getTasksByAssignee: (userId) => get().tasks.filter(t => t.assigneeId === userId),
      getUserById: (id) => get().users.find(u => u.id === id),
      getProjectById: (id) => get().projects.find(p => p.id === id),
      getUnreadNotifications: (userId) => get().notifications.filter(n => n.userId === userId && !n.isRead),
    }),
    {
      name: 'digitrench-crm-storage',
      partialize: (state) => ({
        users: state.users,
        projects: state.projects,
        tasks: state.tasks,
        notifications: state.notifications,
        activityLogs: state.activityLogs,
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        departments: state.departments,
      }),
    }
  )
);
