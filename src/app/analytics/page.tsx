'use client';

import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAppStore } from '@/lib/store';
import {
  calculateCompletionRate, getOverdueTasks, calculateTotalHours,
  getDepartmentLabel, getDepartmentColor, getInitials, getAvatarColor,
  formatDate, formatDuration, cn
} from '@/lib/utils';
import {
  BarChart3, TrendingUp, Users, Clock, Download, Filter,
  CheckCircle2, AlertTriangle, Target, Activity
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';

export default function AnalyticsPage() {
  const { currentUser, tasks, projects, users, activityLogs } = useAppStore();
  const [filterDept, setFilterDept] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');

  if (!currentUser) return null;

  if (currentUser.role === 'employee') {
    return (
      <AppLayout title="Analytics">
        <div className="text-center py-16">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900">Access Restricted</h3>
          <p className="text-gray-500 text-sm mt-1">Analytics are available for management only</p>
        </div>
      </AppLayout>
    );
  }

  // Department performance
  const departments = ['hr', 'operations', 'call_center', 'finance'];
  const deptPerformance = departments.map(dept => {
    const deptProjects = projects.filter(p => p.department === dept);
    const deptTasks = tasks.filter(t => deptProjects.some(p => p.id === t.projectId));
    const overdue = getOverdueTasks(deptTasks).length;
    const hours = calculateTotalHours(deptTasks);
    return {
      name: getDepartmentLabel(dept as any).split(' ')[0],
      fullName: getDepartmentLabel(dept as any),
      total: deptTasks.length,
      done: deptTasks.filter(t => t.status === 'done').length,
      inProgress: deptTasks.filter(t => t.status === 'in_progress').length,
      overdue,
      completionRate: calculateCompletionRate(deptTasks),
      hours: parseFloat(hours.toFixed(1)),
      color: getDepartmentColor(dept as any),
    };
  });

  // Employee performance
  const employeePerformance = users.filter(u => u.role === 'employee' && u.isActive).map(emp => {
    const empTasks = tasks.filter(t => t.assigneeId === emp.id);
    const overdue = getOverdueTasks(empTasks).length;
    const hours = calculateTotalHours(empTasks);
    return {
      id: emp.id,
      name: emp.name,
      position: emp.position,
      department: emp.department,
      total: empTasks.length,
      done: empTasks.filter(t => t.status === 'done').length,
      inProgress: empTasks.filter(t => t.status === 'in_progress').length,
      overdue,
      completionRate: calculateCompletionRate(empTasks),
      hours: parseFloat(hours.toFixed(1)),
    };
  }).sort((a, b) => b.completionRate - a.completionRate);

  // Priority distribution
  const priorityData = [
    { name: 'Urgent', value: tasks.filter(t => t.priority === 'urgent').length, color: '#ef4444' },
    { name: 'High', value: tasks.filter(t => t.priority === 'high').length, color: '#f97316' },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length, color: '#3b82f6' },
    { name: 'Low', value: tasks.filter(t => t.priority === 'low').length, color: '#94a3b8' },
  ];

  // Status distribution
  const statusData = [
    { name: 'To Do', value: tasks.filter(t => t.status === 'todo').length, color: '#94a3b8' },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, color: '#3b82f6' },
    { name: 'Review', value: tasks.filter(t => t.status === 'review').length, color: '#f59e0b' },
    { name: 'Done', value: tasks.filter(t => t.status === 'done').length, color: '#10b981' },
    { name: 'Blocked', value: tasks.filter(t => t.status === 'blocked').length, color: '#ef4444' },
  ];

  // Overall KPIs
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const overallRate = calculateCompletionRate(tasks);
  const totalOverdue = getOverdueTasks(tasks).length;
  const totalHours = calculateTotalHours(tasks);
  const activeProjects = projects.filter(p => p.status === 'active').length;

  const exportReport = () => {
    const data = [
      ['Digitrench CRM - Analytics Report'],
      ['Generated:', new Date().toLocaleDateString()],
      [],
      ['OVERALL METRICS'],
      ['Total Tasks', totalTasks],
      ['Completed Tasks', completedTasks],
      ['Completion Rate', `${overallRate}%`],
      ['Overdue Tasks', totalOverdue],
      ['Total Hours Logged', `${totalHours.toFixed(1)}h`],
      ['Active Projects', activeProjects],
      [],
      ['DEPARTMENT PERFORMANCE'],
      ['Department', 'Total Tasks', 'Done', 'Completion Rate', 'Hours'],
      ...deptPerformance.map(d => [d.fullName, d.total, d.done, `${d.completionRate}%`, `${d.hours}h`]),
      [],
      ['EMPLOYEE PERFORMANCE'],
      ['Name', 'Position', 'Total Tasks', 'Done', 'Completion Rate', 'Hours'],
      ...employeePerformance.map(e => [e.name, e.position, e.total, e.done, `${e.completionRate}%`, `${e.hours}h`]),
    ];
    const csv = data.map(row => Array.isArray(row) ? row.join(',') : row).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `digitrench-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <AppLayout title="Analytics & Reports">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-500 text-sm">Comprehensive performance insights across all departments</p>
        <button
          onClick={exportReport}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[
          { label: 'Total Tasks', value: totalTasks, icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Completed', value: completedTasks, icon: <Target className="w-4 h-4" />, color: 'text-green-600 bg-green-50' },
          { label: 'Completion Rate', value: `${overallRate}%`, icon: <TrendingUp className="w-4 h-4" />, color: 'text-blue-600 bg-blue-50' },
          { label: 'Overdue', value: totalOverdue, icon: <AlertTriangle className="w-4 h-4" />, color: totalOverdue > 0 ? 'text-red-600 bg-red-50' : 'text-gray-600 bg-gray-50' },
          { label: 'Hours Logged', value: `${totalHours.toFixed(0)}h`, icon: <Clock className="w-4 h-4" />, color: 'text-purple-600 bg-purple-50' },
          { label: 'Active Projects', value: activeProjects, icon: <Activity className="w-4 h-4" />, color: 'text-amber-600 bg-amber-50' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', kpi.color)}>
              {kpi.icon}
            </div>
            <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Department Performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Department Task Completion</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#e0e7ff" name="Total" radius={[4, 4, 0, 0]} />
              <Bar dataKey="done" fill="#6366f1" name="Done" radius={[4, 4, 0, 0]} />
              <Bar dataKey="overdue" fill="#ef4444" name="Overdue" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Task Status Distribution</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={200}>
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
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {statusData.filter(d => d.value > 0).map(item => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Department Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Department Performance Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {deptPerformance.map(dept => (
            <div key={dept.name} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }} />
                <span className="text-sm font-semibold text-gray-900">{dept.fullName}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Completion</span>
                  <span className={cn('font-semibold', dept.completionRate >= 70 ? 'text-green-600' : dept.completionRate >= 40 ? 'text-amber-600' : 'text-red-600')}>
                    {dept.completionRate}%
                  </span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${dept.completionRate}%`, backgroundColor: dept.color }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total</span>
                    <span className="font-medium">{dept.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Done</span>
                    <span className="font-medium text-green-600">{dept.done}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Active</span>
                    <span className="font-medium text-blue-600">{dept.inProgress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Overdue</span>
                    <span className={cn('font-medium', dept.overdue > 0 ? 'text-red-600' : 'text-gray-400')}>
                      {dept.overdue}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Employee Performance Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Employee Performance</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tasks</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Completion</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Overdue</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Hours</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Performance</th>
            </tr>
          </thead>
          <tbody>
            {employeePerformance.map(emp => (
              <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold', getAvatarColor(emp.name))}>
                      {getInitials(emp.name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                      <p className="text-xs text-gray-500">{emp.position}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-gray-600">{getDepartmentLabel(emp.department)}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900">{emp.done}/{emp.total}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', emp.completionRate >= 70 ? 'bg-green-500' : emp.completionRate >= 40 ? 'bg-amber-500' : 'bg-red-500')}
                        style={{ width: `${emp.completionRate}%` }}
                      />
                    </div>
                    <span className={cn('text-xs font-semibold', emp.completionRate >= 70 ? 'text-green-600' : emp.completionRate >= 40 ? 'text-amber-600' : 'text-red-600')}>
                      {emp.completionRate}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-sm font-medium', emp.overdue > 0 ? 'text-red-600' : 'text-gray-400')}>
                    {emp.overdue > 0 ? emp.overdue : '—'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-600">{emp.hours}h</span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    emp.completionRate >= 80 ? 'bg-green-100 text-green-700' :
                    emp.completionRate >= 60 ? 'bg-blue-100 text-blue-700' :
                    emp.completionRate >= 40 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  )}>
                    {emp.completionRate >= 80 ? 'Excellent' :
                     emp.completionRate >= 60 ? 'Good' :
                     emp.completionRate >= 40 ? 'Average' : 'Needs Attention'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
