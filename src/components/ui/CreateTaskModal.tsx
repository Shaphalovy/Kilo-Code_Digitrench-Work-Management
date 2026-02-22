'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Task, TaskPriority } from '@/types';
import { generateId, getDepartmentLabel, cn } from '@/lib/utils';
import { X, CheckSquare } from 'lucide-react';

interface CreateTaskModalProps {
  projectId: string;
  onClose: () => void;
}

export default function CreateTaskModal({ projectId, onClose }: CreateTaskModalProps) {
  const { currentUser, users, addTask, addNotification, getProjectById } = useAppStore();
  const project = getProjectById(projectId);

  const [form, setForm] = useState({
    title: '',
    description: '',
    assigneeId: '',
    priority: 'medium' as TaskPriority,
    dueDate: '',
    estimatedHours: '',
    tags: '',
  });

  if (!currentUser || !project) return null;

  // Only show members of this project as potential assignees
  const projectMembers = users.filter(u =>
    project.members.includes(u.id) && u.role === 'employee' && u.isActive
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.assigneeId || !form.dueDate) return;

    const task: Task = {
      id: generateId('task'),
      title: form.title,
      description: form.description,
      projectId,
      assigneeId: form.assigneeId,
      createdBy: currentUser.id,
      status: 'todo',
      priority: form.priority,
      dueDate: new Date(form.dueDate).toISOString(),
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      attachments: [],
      comments: [],
      subtasks: [],
      timeEntries: [],
      estimatedHours: form.estimatedHours ? parseFloat(form.estimatedHours) : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addTask(task);

    // Notify assignee
    addNotification({
      id: generateId('notif'),
      userId: form.assigneeId,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `You have been assigned "${form.title}" in ${project.name}`,
      taskId: task.id,
      projectId,
      fromUserId: currentUser.id,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Create New Task</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Update employee handbook section 4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what needs to be done..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign To *</label>
              <select
                value={form.assigneeId}
                onChange={e => setForm(prev => ({ ...prev, assigneeId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                required
              >
                <option value="">Select employee...</option>
                {projectMembers.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
              <select
                value={form.priority}
                onChange={e => setForm(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => setForm(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
              <input
                type="number"
                value={form.estimatedHours}
                onChange={e => setForm(prev => ({ ...prev, estimatedHours: e.target.value }))}
                placeholder="e.g., 8"
                min="0"
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <input
              type="text"
              value={form.tags}
              onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="e.g., documentation, compliance, hr (comma separated)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
