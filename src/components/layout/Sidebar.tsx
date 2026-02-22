'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { getDepartmentLabel, getDepartmentColor, getInitials, getAvatarColor, cn } from '@/lib/utils';
import { Department } from '@/types';
import {
  LayoutDashboard, CheckSquare, FolderKanban, Clock, BarChart3,
  Users, Settings, Bell, ChevronDown, ChevronRight, Building2,
  LogOut, Briefcase, Bot, Menu, X, Plus
} from 'lucide-react';

const departments: Department[] = ['hr', 'operations', 'call_center', 'finance', 'it'];

export default function Sidebar() {
  const pathname = usePathname();
  const { currentUser, projects, notifications, logout, sidebarOpen, toggleSidebar, setActiveDepartment, activeDepartment } = useAppStore();
  const [deptExpanded, setDeptExpanded] = useState(true);

  if (!currentUser) return null;

  const unreadCount = notifications.filter(n => n.userId === currentUser.id && !n.isRead).length;

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/tasks', icon: CheckSquare, label: 'My Tasks', roles: ['employee'] },
    { href: '/boards', icon: FolderKanban, label: 'Boards' },
    { href: '/time-tracking', icon: Clock, label: 'Time Tracking' },
    ...(currentUser.role !== 'employee' ? [
      { href: '/analytics', icon: BarChart3, label: 'Analytics' },
    ] : []),
    { href: '/ai-assistant', icon: Bot, label: 'AI Assistant' },
    ...(currentUser.role === 'admin' ? [
      { href: '/users', icon: Users, label: 'User Management' },
      { href: '/settings', icon: Settings, label: 'Settings' },
    ] : []),
  ];

  const userDepts = currentUser.role === 'employee'
    ? [currentUser.department as Department]
    : departments;

  const deptProjects = (dept: Department) =>
    projects.filter(p => p.department === dept && p.status === 'active');

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 h-full bg-slate-900 text-white z-30 flex flex-col transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-0 lg:w-16 overflow-hidden'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50 min-h-[64px]">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-bold text-white text-sm">Digitrench</span>
                <p className="text-xs text-slate-400">CRM Platform</p>
              </div>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors flex-shrink-0"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
                {sidebarOpen && item.href === '/notifications' && unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Departments Section */}
          {sidebarOpen && (
            <div className="pt-4">
              <button
                onClick={() => setDeptExpanded(!deptExpanded)}
                className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
              >
                <span>Departments</span>
                {deptExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>

              {deptExpanded && (
                <div className="mt-1 space-y-0.5">
                  {userDepts.map(dept => {
                    const color = getDepartmentColor(dept);
                    const deptProjCount = deptProjects(dept).length;
                    const isActive = activeDepartment === dept;

                    return (
                      <div key={dept}>
                        <button
                          onClick={() => setActiveDepartment(isActive ? null : dept)}
                          className={cn(
                            'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-all',
                            isActive ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                          )}
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="flex-1 text-left text-xs">{getDepartmentLabel(dept)}</span>
                          {deptProjCount > 0 && (
                            <span className="text-xs text-slate-500">{deptProjCount}</span>
                          )}
                        </button>

                        {isActive && deptProjects(dept).map(project => (
                          <Link
                            key={project.id}
                            href={`/boards/${project.id}`}
                            className={cn(
                              'flex items-center gap-2 pl-8 pr-3 py-1.5 text-xs rounded-lg transition-all',
                              pathname === `/boards/${project.id}`
                                ? 'text-white bg-slate-700'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                            )}
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: project.color }}
                            />
                            <span className="truncate">{project.name}</span>
                          </Link>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* User Profile */}
        <div className="border-t border-slate-700/50 p-3">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0',
                getAvatarColor(currentUser.name)
              )}>
                {getInitials(currentUser.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
                <p className="text-xs text-slate-400 capitalize">{currentUser.role}</p>
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={logout}
              className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
