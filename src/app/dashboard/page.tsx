'use client';

import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAppStore } from '@/lib/store';
import TaskCard from '@/components/ui/TaskCard';
import TaskDetailModal from '@/components/ui/TaskDetailModal';
import { Task } from '@/types';
import {
  calculateCompletionRate, getOverdueTasks, getAtRiskTasks, formatDate,
  getDepartmentLabel, getDepartmentColor, getInitials, getAvatarColor,
  formatDuration, calculateTotalHours, cn
} from '@/lib/utils';
import {
  CheckCircle2, Clock, AlertTriangle, TrendingUp, FolderKanban,
  Users, Activity, ArrowRight, BarChart3, Target, Zap
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import Link from 'next/link';

export default function DashboardPage() {
  const { currentUser, tasks, projects, users, activityLogs } = useAppStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  if (!currentUser) return null;

  const isEmployee = currentUser.role === 'employee';
  const isManagement = currentUser.role === 'management' || currentUser.role === 'admin';

  // Employee-specific data
  const myTasks = tasks.filter(t => t.assigneeId === currentUser.id);
  const myOverdue = getOverdueTasks(myTasks);
  const myCompletionRate = calculateCompletionRate(myTasks);
  const myTotalHours = calculateTotalHours(myTasks);

  // Management-specific data
  const allActiveTasks = tasks.filter(t => t.status !== 'done');
  const allOverdue = getOverdueTasks(tasks);
  const atRiskTasks = getAtRiskTasks(tasks);
  const overallCompletionRate = calculateCompletionRate(tasks);
  const activeProjects = projects.filter(p => p.status === 'active');
  const totalHoursLogged = calculateTotalHours(tasks);

  // Chart data
  const statusData = [
    { name: 'To Do', value: tasks.filter(t => t.status === 'todo').length, color: '#94a3b8' },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, color: '#3b82f6' },
    { name: 'Review', value: tasks.filter(t => t.status === 'review').length, color: '#f59e0b' },
    { name: 'Done', value: tasks.filter(t => t.status === 'done').length, color: '#10b981' },
    { name: 'Blocked', value: tasks.filter(t => t.status === 'blocked').length, color: '#ef4444' },
  ];

  const deptData = ['hr', 'operations', 'call_center', 'finance'].map(dept => {
    const deptProjects = projects.filter(p => p.department === dept);
    const deptTasks = tasks.filter(t => deptProjects.some(p => p.id === t.projectId));
    return {
      name: getDepartmentLabel(dept as any).split(' ')[0],
      total: deptTasks.length,
      done: deptTasks.filter(t => t.status === 'done').length,
      rate: calculateCompletionRate(deptTasks),
    };
  });

  const recentActivity = activityLogs.slice(0, 5);

  return (
    <AppLayout title="Dashboard">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Good morning, {currentUser.name.split(' ')[0]}! 👋</h2>
            <p className="text-indigo-200 mt-1">
              {isEmployee
                ? `You have ${myTasks.filter(t => t.status !== 'done').length} active tasks`
                : `${allActiveTasks.length} active tasks across ${activeProjects.length} projects`
              }
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold">{isEmployee ? myCompletionRate : overallCompletionRate}%</p>
              <p className="text-indigo-200 text-sm">Completion Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isEmployee ? (
          <>
            <KPICard
              title="My Tasks"
              value={myTasks.length}
              subtitle={`${myTasks.filter(t => t.status === 'in_progress').length} in progress`}
              icon={<CheckCircle2 className="w-5 h-5" />}
              color="indigo"
            />
            <KPICard
              title="Completed"
              value={myTasks.filter(t => t.status === 'done').length}
              subtitle={`${myCompletionRate}% completion rate`}
              icon={<Target className="w-5 h-5" />}
              color="green"
            />
            <KPICard
              title="Overdue"
              value={myOverdue.length}
              subtitle="Need immediate attention"
              icon={<AlertTriangle className="w-5 h-5" />}
              color={myOverdue.length > 0 ? 'red' : 'gray'}
            />
            <KPICard
              title="Hours Logged"
              value={`${myTotalHours.toFixed(1)}h`}
              subtitle="Total time tracked"
              icon={<Clock className="w-5 h-5" />}
              color="blue"
            />
          </>
        ) : (
          <>
            <KPICard
              title="Active Projects"
              value={activeProjects.length}
              subtitle={`${projects.filter(p => p.status === 'completed').length} completed`}
              icon={<FolderKanban className="w-5 h-5" />}
              color="indigo"
            />
            <KPICard
              title="Total Tasks"
              value={tasks.length}
              subtitle={`${overallCompletionRate}% completion rate`}
              icon={<CheckCircle2 className="w-5 h-5" />}
              color="green"
            />
            <KPICard
              title="Overdue Tasks"
              value={allOverdue.length}
              subtitle="Require attention"
              icon={<AlertTriangle className="w-5 h-5" />}
              color={allOverdue.length > 0 ? 'red' : 'gray'}
            />
            <KPICard
              title="Hours Logged"
              value={`${totalHoursLogged.toFixed(1)}h`}
              subtitle="Across all tasks"
              icon={<Clock className="w-5 h-5" />}
              color="blue"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Task Status Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Task Status Overview</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusData.filter(d => d.value > 0)}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {statusData.filter(d => d.value > 0).map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {statusData.filter(d => d.value > 0).map(item => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}: {item.value}
              </div>
            ))}
          </div>
        </div>

        {/* Department Performance (Management only) */}
        {isManagement && (
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Department Performance</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deptData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="total" fill="#e0e7ff" name="Total" radius={[4, 4, 0, 0]} />
                <Bar dataKey="done" fill="#6366f1" name="Done" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* My Task Summary (Employee) */}
        {isEmployee && (
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">My Task Breakdown</h3>
            <div className="space-y-3">
              {[
                { label: 'To Do', count: myTasks.filter(t => t.status === 'todo').length, color: 'bg-gray-400' },
                { label: 'In Progress', count: myTasks.filter(t => t.status === 'in_progress').length, color: 'bg-blue-500' },
                { label: 'In Review', count: myTasks.filter(t => t.status === 'review').length, color: 'bg-amber-500' },
                { label: 'Done', count: myTasks.filter(t => t.status === 'done').length, color: 'bg-green-500' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-24">{item.label}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', item.color)}
                      style={{ width: myTasks.length > 0 ? `${(item.count / myTasks.length) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-6 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Tasks */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              {isEmployee ? 'My Priority Tasks' : 'At-Risk Tasks'}
            </h3>
            <Link href="/tasks" className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {(isEmployee ? myTasks.filter(t => t.status !== 'done').slice(0, 4) : atRiskTasks.slice(0, 4)).map(task => {
              const assignee = useAppStore.getState().getUserById(task.assigneeId);
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  assignee={assignee}
                  onClick={() => setSelectedTask(task)}
                  compact
                />
              );
            })}
            {(isEmployee ? myTasks.filter(t => t.status !== 'done') : atRiskTasks).length === 0 && (
              <div className="text-center py-6 text-gray-400">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <p className="text-sm">All caught up! 🎉</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity / Active Projects */}
        {isManagement ? (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Active Projects</h3>
              <Link href="/boards" className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {activeProjects.slice(0, 5).map(project => {
                const projectTasks = tasks.filter(t => t.projectId === project.id);
                const completionRate = calculateCompletionRate(projectTasks);
                return (
                  <Link key={project.id} href={`/boards/${project.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-gray-100">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${completionRate}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{completionRate}%</span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{projectTasks.length} tasks</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Recent Activity</h3>
            </div>
            <div className="space-y-3">
              {recentActivity.filter(log => log.userId === currentUser.id).slice(0, 5).map(log => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-700">{log.action}</p>
                    <p className="text-xs text-gray-400">{formatDate(log.createdAt)}</p>
                  </div>
                </div>
              ))}
              {recentActivity.filter(log => log.userId === currentUser.id).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Team Overview (Management only) */}
      {isManagement && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Team Overview</h3>
            <Link href="/analytics" className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              Full Analytics <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {users.filter(u => u.role === 'employee' && u.isActive).map(emp => {
              const empTasks = tasks.filter(t => t.assigneeId === emp.id);
              const empRate = calculateCompletionRate(empTasks);
              const empOverdue = getOverdueTasks(empTasks).length;
              return (
                <div key={emp.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold', getAvatarColor(emp.name))}>
                      {getInitials(emp.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{emp.name.split(' ')[0]}</p>
                      <p className="text-xs text-gray-500 truncate">{emp.position}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Tasks</span>
                      <span className="font-medium">{empTasks.length}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Rate</span>
                      <span className={cn('font-medium', empRate >= 70 ? 'text-green-600' : empRate >= 40 ? 'text-amber-600' : 'text-red-600')}>
                        {empRate}%
                      </span>
                    </div>
                    {empOverdue > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Overdue</span>
                        <span className="font-medium text-red-600">{empOverdue}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </AppLayout>
  );
}

function KPICard({ title, value, subtitle, icon, color }: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: 'indigo' | 'green' | 'red' | 'blue' | 'gray';
}) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
    gray: 'bg-gray-50 text-gray-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        <div className={cn('p-2 rounded-lg', colorMap[color])}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}
