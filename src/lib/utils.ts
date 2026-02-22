import { Task, TaskStatus, TaskPriority, Department, User, Project } from '@/types';
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from 'date-fns';

// Date formatting
export const formatDate = (date: string) => format(new Date(date), 'MMM dd, yyyy');
export const formatDateTime = (date: string) => format(new Date(date), 'MMM dd, yyyy HH:mm');
export const formatRelative = (date: string) => formatDistanceToNow(new Date(date), { addSuffix: true });
export const formatTime = (date: string) => format(new Date(date), 'HH:mm');

// Status helpers
export const getStatusColor = (status: TaskStatus): string => {
  const colors: Record<TaskStatus, string> = {
    todo: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    review: 'bg-yellow-100 text-yellow-700',
    done: 'bg-green-100 text-green-700',
    blocked: 'bg-red-100 text-red-700',
  };
  return colors[status];
};

export const getStatusBadgeColor = (status: TaskStatus): string => {
  const colors: Record<TaskStatus, string> = {
    todo: 'bg-gray-200 text-gray-800',
    in_progress: 'bg-blue-200 text-blue-800',
    review: 'bg-amber-200 text-amber-800',
    done: 'bg-green-200 text-green-800',
    blocked: 'bg-red-200 text-red-800',
  };
  return colors[status];
};

export const getStatusLabel = (status: TaskStatus): string => {
  const labels: Record<TaskStatus, string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    review: 'In Review',
    done: 'Done',
    blocked: 'Blocked',
  };
  return labels[status];
};

export const getPriorityColor = (priority: TaskPriority): string => {
  const colors: Record<TaskPriority, string> = {
    low: 'text-gray-500',
    medium: 'text-blue-500',
    high: 'text-orange-500',
    urgent: 'text-red-500',
  };
  return colors[priority];
};

export const getPriorityBgColor = (priority: TaskPriority): string => {
  const colors: Record<TaskPriority, string> = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  };
  return colors[priority];
};

export const getPriorityLabel = (priority: TaskPriority): string => {
  const labels: Record<TaskPriority, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
  };
  return labels[priority];
};

export const getDepartmentLabel = (dept: Department): string => {
  const labels: Record<Department, string> = {
    hr: 'Human Resources',
    operations: 'Operations',
    call_center: 'Call Center',
    finance: 'Finance',
    it: 'IT',
    management: 'Management',
  };
  return labels[dept];
};

export const getDepartmentColor = (dept: Department): string => {
  const colors: Record<Department, string> = {
    hr: '#ec4899',
    operations: '#10b981',
    call_center: '#f59e0b',
    finance: '#3b82f6',
    it: '#8b5cf6',
    management: '#6366f1',
  };
  return colors[dept];
};

// Task helpers
export const isTaskOverdue = (task: Task): boolean => {
  if (task.status === 'done') return false;
  return isBefore(new Date(task.dueDate), new Date());
};

export const isTaskDueSoon = (task: Task, days = 3): boolean => {
  if (task.status === 'done') return false;
  const dueDate = new Date(task.dueDate);
  const now = new Date();
  return isAfter(dueDate, now) && isBefore(dueDate, addDays(now, days));
};

export const getTaskRiskScore = (task: Task): number => {
  let score = 0;
  if (isTaskOverdue(task)) score += 50;
  else if (isTaskDueSoon(task, 1)) score += 40;
  else if (isTaskDueSoon(task, 3)) score += 25;
  else if (isTaskDueSoon(task, 7)) score += 10;

  if (task.priority === 'urgent') score += 30;
  else if (task.priority === 'high') score += 20;
  else if (task.priority === 'medium') score += 10;

  if (task.status === 'blocked') score += 20;

  const completionRate = task.subtasks.length > 0
    ? task.subtasks.filter(s => s.completed).length / task.subtasks.length
    : 0;
  if (completionRate < 0.25 && task.status === 'in_progress') score += 15;

  return Math.min(score, 100);
};

// Duration formatting
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

// Avatar helpers
export const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const getAvatarColor = (name: string): string => {
  const colors = [
    'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
    'bg-red-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

// ID generation
export const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Metrics calculations
export const calculateCompletionRate = (tasks: Task[]): number => {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter(t => t.status === 'done').length;
  return Math.round((completed / tasks.length) * 100);
};

export const calculateTotalHours = (tasks: Task[]): number => {
  return tasks.reduce((total, task) => {
    const taskHours = task.timeEntries.reduce((sum, entry) => {
      return sum + (entry.duration ? entry.duration / 60 : 0);
    }, 0);
    return total + taskHours;
  }, 0);
};

export const getOverdueTasks = (tasks: Task[]): Task[] => {
  return tasks.filter(isTaskOverdue);
};

export const getAtRiskTasks = (tasks: Task[]): Task[] => {
  return tasks
    .filter(t => t.status !== 'done')
    .map(t => ({ task: t, score: getTaskRiskScore(t) }))
    .filter(({ score }) => score >= 30)
    .sort((a, b) => b.score - a.score)
    .map(({ task }) => task);
};

// Permission helpers
export const canManageTasks = (user: User): boolean => {
  return user.role === 'admin' || user.role === 'management';
};

export const canDeleteTasks = (user: User): boolean => {
  return user.role === 'admin' || user.role === 'management';
};

export const canManageUsers = (user: User): boolean => {
  return user.role === 'admin';
};

export const canInviteUsers = (user: User): boolean => {
  return user.role === 'admin' || user.role === 'management';
};

export const canViewAllTasks = (user: User): boolean => {
  return user.role === 'admin' || user.role === 'management';
};

export const canViewAnalytics = (user: User): boolean => {
  return user.role === 'admin' || user.role === 'management';
};

// Filter helpers
export const filterTasksByDepartment = (tasks: Task[], projects: Project[], department: string): Task[] => {
  const deptProjects = projects.filter(p => p.department === department).map(p => p.id);
  return tasks.filter(t => deptProjects.includes(t.projectId));
};

// Class name helper
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};
