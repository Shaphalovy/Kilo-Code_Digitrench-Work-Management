'use client';

import AppLayout from '@/components/layout/AppLayout';
import { useAppStore } from '@/lib/store';
import { Settings, Shield, Database, Bell, Palette } from 'lucide-react';

export default function SettingsPage() {
  const { currentUser } = useAppStore();

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
