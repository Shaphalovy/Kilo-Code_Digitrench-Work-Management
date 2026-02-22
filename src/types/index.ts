// Core Types for Digitrench CRM

export type UserRole = 'admin' | 'management' | 'employee';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type Department = string;

export interface DepartmentConfig {
  id: string;
  name: string;
  color: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: Department;
  avatar?: string;
  position: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  department: Department;
  createdBy: string;
  members: string[];
  status: 'active' | 'completed' | 'archived' | 'on_hold';
  startDate: string;
  endDate?: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assigneeId: string;
  createdBy: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  startDate?: string;
  completedAt?: string;
  tags: string[];
  attachments: Attachment[];
  comments: Comment[];
  subtasks: Subtask[];
  timeEntries: TimeEntry[];
  estimatedHours?: number;
  actualHours?: number;
  dependencies?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  assigneeId?: string;
  dueDate?: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  mentions: string[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration?: number; // in minutes
  notes?: string;
  date: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'task_assigned' | 'task_updated' | 'comment_mention' | 'deadline_reminder' | 'status_change' | 'review_request';
  title: string;
  message: string;
  taskId?: string;
  projectId?: string;
  fromUserId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entityType: 'task' | 'project' | 'user' | 'comment';
  entityId: string;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface KPIMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;
  avgCompletionTime: number;
  totalHoursLogged: number;
  activeProjects: number;
}

export interface DepartmentMetrics {
  department: Department;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  activeMembers: number;
  avgTaskTime: number;
}

export interface EmployeePerformance {
  userId: string;
  totalAssigned: number;
  completed: number;
  inProgress: number;
  overdue: number;
  completionRate: number;
  totalHoursLogged: number;
  avgTaskCompletionTime: number;
}

export interface AIInsight {
  id: string;
  type: 'risk_alert' | 'performance_insight' | 'suggestion' | 'summary';
  title: string;
  description: string;
  severity?: 'low' | 'medium' | 'high';
  taskId?: string;
  userId?: string;
  createdAt: string;
}
