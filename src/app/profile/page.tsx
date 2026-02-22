'use client';

import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAppStore } from '@/lib/store';
import { getDepartmentLabel, getInitials, getAvatarColor, formatDate, cn } from '@/lib/utils';
import { User, Mail, Building2, Briefcase, Calendar, Save, Check } from 'lucide-react';

export default function ProfilePage() {
  const { currentUser, updateUser } = useAppStore();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: currentUser?.name || '',
    position: currentUser?.position || '',
  });

  if (!currentUser) return null;

  const handleSave = () => {
    updateUser(currentUser.id, form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AppLayout title="Profile">
      <div className="max-w-2xl">
        {/* Profile Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold',
              getAvatarColor(currentUser.name)
            )}>
              {getInitials(currentUser.name)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{currentUser.name}</h2>
              <p className="text-gray-500">{currentUser.position}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full capitalize font-medium">
                  {currentUser.role}
                </span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {getDepartmentLabel(currentUser.department)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h3 className="font-semibold text-gray-900 mb-4">Profile Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <input
                type="text"
                value={form.position}
                onChange={e => setForm(prev => ({ ...prev, position: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            className={cn(
              'mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              saved
                ? 'bg-green-600 text-white'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            )}
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Account Information</h3>
          <div className="space-y-3">
            {[
              { icon: <Mail className="w-4 h-4" />, label: 'Email', value: currentUser.email },
              { icon: <Building2 className="w-4 h-4" />, label: 'Department', value: getDepartmentLabel(currentUser.department) },
              { icon: <Briefcase className="w-4 h-4" />, label: 'Role', value: currentUser.role, capitalize: true },
              { icon: <Calendar className="w-4 h-4" />, label: 'Member Since', value: formatDate(currentUser.createdAt) },
              { icon: <Calendar className="w-4 h-4" />, label: 'Last Login', value: currentUser.lastLogin ? formatDate(currentUser.lastLogin) : 'N/A' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="text-gray-400">{item.icon}</div>
                <span className="text-sm text-gray-500 w-28">{item.label}</span>
                <span className={cn('text-sm text-gray-900 font-medium', item.capitalize && 'capitalize')}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
