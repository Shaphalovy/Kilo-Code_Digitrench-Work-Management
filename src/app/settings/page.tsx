'use client';

import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAppStore } from '@/lib/store';
import { Settings, Shield, Database, Bell, Palette, Plus, Trash2, Building2 } from 'lucide-react';
import { DepartmentConfig } from '@/types';

export default function SettingsPage() {
  const { currentUser, departments, addDepartment, removeDepartment } = useAppStore();
  const [showAddDept, setShowAddDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptColor, setNewDeptColor] = useState('#6366f1');

  if (!currentUser) return null;

  if (currentUser.role !== 'admin') {
    return (
      <AppLayout title="Settings">
        <div className="text-center py-16">
          <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900">Access Restricted</h3>
          <p className="text-gray-500 text-sm mt-1">Settings are only available for administrators</p>
        </div>
      </AppLayout>
    );
  }

  const handleAddDepartment = () => {
    if (!newDeptName.trim()) return;
    const deptId = newDeptName.toLowerCase().replace(/\s+/g, '_');
    addDepartment({ id: deptId, name: newDeptName, color: newDeptColor });
    setNewDeptName('');
    setShowAddDept(false);
  };

  const handleRemoveDepartment = (deptId: string) => {
    if (window.confirm('Are you sure you want to remove this department?')) {
      removeDepartment(deptId);
    }
  };

  return (
    <AppLayout title="Settings">
      <div className="max-w-2xl">
        <div className="space-y-4">
          {[
            {
              icon: <Database className="w-5 h-5 text-indigo-600" />,
              title: 'Data Management',
              description: 'Manage system data, backups, and exports',
              badge: 'Admin Only',
            },
            {
              icon: <Bell className="w-5 h-5 text-amber-600" />,
              title: 'Notification Settings',
              description: 'Configure system-wide notification preferences',
              badge: null,
            },
            {
              icon: <Shield className="w-5 h-5 text-green-600" />,
              title: 'Security & Access',
              description: 'Manage authentication settings and access controls',
              badge: 'Admin Only',
            },
            {
              icon: <Palette className="w-5 h-5 text-purple-600" />,
              title: 'Appearance',
              description: 'Customize the platform appearance and branding',
              badge: null,
            },
          ].map(item => (
            <div key={item.title} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between hover:border-indigo-300 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                  {item.icon}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              </div>
              {item.badge && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                  {item.badge}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Department Management */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Department Management</h3>
            <button
              onClick={() => setShowAddDept(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Department
            </button>
          </div>

          {/* Add Department Form */}
          {showAddDept && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-3">Add New Department</h4>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">Department Name</label>
                  <input
                    type="text"
                    value={newDeptName}
                    onChange={e => setNewDeptName(e.target.value)}
                    placeholder="e.g., Marketing"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Color</label>
                  <input
                    type="color"
                    value={newDeptColor}
                    onChange={e => setNewDeptColor(e.target.value)}
                    className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                </div>
                <button
                  onClick={handleAddDepartment}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddDept(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Department List */}
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {departments.map(dept => (
              <div key={dept.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: dept.color }}
                  />
                  <span className="font-medium text-gray-900">{dept.name}</span>
                </div>
                <button
                  onClick={() => handleRemoveDepartment(dept.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove department"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-xl p-5">
          <h3 className="font-semibold text-indigo-900 mb-1">System Information</h3>
          <div className="space-y-1 text-sm text-indigo-700">
            <p>Platform: Digitrench CRM v1.0.0</p>
            <p>Environment: Production</p>
            <p>Last Updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
