'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Project, Department } from '@/types';
import { getDepartmentLabel, generateId, cn } from '@/lib/utils';
import { X, FolderKanban } from 'lucide-react';

const projectColors = ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'];

interface CreateProjectModalProps {
  onClose: () => void;
}

export default function CreateProjectModal({ onClose }: CreateProjectModalProps) {
  const { currentUser, users, addProject, departments } = useAppStore();
  const [form, setForm] = useState({
    name: '',
    description: '',
    department: 'hr' as Department,
    endDate: '',
    color: projectColors[0],
    members: [] as string[],
  });

  if (!currentUser) return null;

  const employees = users.filter(u => u.role === 'employee' && u.isActive);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const project: Project = {
      id: generateId('proj'),
      name: form.name,
      description: form.description,
      department: form.department,
      createdBy: currentUser.id,
      members: [currentUser.id, ...form.members],
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      color: form.color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addProject(project);
    onClose();
  };

  const toggleMember = (userId: string) => {
    setForm(prev => ({
      ...prev,
      members: prev.members.includes(userId)
        ? prev.members.filter(id => id !== userId)
        : [...prev.members, userId],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Create New Project</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Q1 HR Compliance Review"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the project goals and scope..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <select
                value={form.department}
                onChange={e => setForm(prev => ({ ...prev, department: e.target.value as Department }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={e => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project Color</label>
            <div className="flex gap-2 flex-wrap">
              {projectColors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, color }))}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-all',
                    form.color === color ? 'border-gray-900 scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Members */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Add Team Members</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {employees.map(emp => (
                <label key={emp.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.members.includes(emp.id)}
                    onChange={() => toggleMember(emp.id)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                    <p className="text-xs text-gray-500">{emp.position} · {getDepartmentLabel(emp.department)}</p>
                  </div>
                </label>
              ))}
            </div>
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
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
