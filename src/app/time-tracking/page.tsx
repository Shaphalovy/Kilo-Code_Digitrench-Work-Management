'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAppStore } from '@/lib/store';
import { TimeEntry } from '@/types';
import { formatDuration, formatDate, getInitials, getAvatarColor, generateId, cn } from '@/lib/utils';
import { Clock, Play, Square, Plus, Download, Calendar, User, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TimeTrackingPage() {
  const { currentUser, tasks, users, addTimeEntry } = useAppStore();
  const [activeTimer, setActiveTimer] = useState<{ taskId: string; startTime: string } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [timeNote, setTimeNote] = useState('');
  const [manualHours, setManualHours] = useState('');
  const [manualMinutes, setManualMinutes] = useState('');
  const [manualTaskId, setManualTaskId] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [filterUser, setFilterUser] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  if (!currentUser) return null;

  const isManagement = currentUser.role !== 'employee';

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTimer) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - new Date(activeTimer.startTime).getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  const formatElapsed = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = () => {
    if (!selectedTaskId) return;
    setActiveTimer({ taskId: selectedTaskId, startTime: new Date().toISOString() });
    setElapsed(0);
  };

  const handleStopTimer = () => {
    if (!activeTimer) return;
    const endTime = new Date().toISOString();
    const duration = Math.round(elapsed / 60);
    if (duration > 0) {
      const entry: TimeEntry = {
        id: generateId('te'),
        taskId: activeTimer.taskId,
        userId: currentUser.id,
        startTime: activeTimer.startTime,
        endTime,
        duration,
        notes: timeNote,
        date: new Date().toISOString().split('T')[0],
      };
      addTimeEntry(activeTimer.taskId, entry);
    }
    setActiveTimer(null);
    setElapsed(0);
    setTimeNote('');
  };

  const handleManualLog = () => {
    if (!manualTaskId) return;
    const hours = parseInt(manualHours) || 0;
    const minutes = parseInt(manualMinutes) || 0;
    const duration = hours * 60 + minutes;
    if (duration <= 0) return;

    const entry: TimeEntry = {
      id: generateId('te'),
      taskId: manualTaskId,
      userId: currentUser.id,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      duration,
      notes: manualNote,
      date: new Date().toISOString().split('T')[0],
    };
    addTimeEntry(manualTaskId, entry);
    setManualHours('');
    setManualMinutes('');
    setManualNote('');
    setManualTaskId('');
  };

  // Collect all time entries
  const allEntries = tasks.flatMap(task =>
    task.timeEntries.map(entry => ({
      ...entry,
      taskTitle: task.title,
      taskId: task.id,
    }))
  );

  const visibleEntries = allEntries.filter(entry => {
    const matchesUser = filterUser === 'all' || entry.userId === filterUser;
    const matchesDate = !filterDate || entry.date === filterDate;
    const isMyEntry = currentUser.role === 'employee' ? entry.userId === currentUser.id : true;
    return matchesUser && matchesDate && isMyEntry;
  }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  // My tasks for timer
  const myActiveTasks = tasks.filter(t =>
    t.assigneeId === currentUser.id && t.status !== 'done'
  );

  // Weekly chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    const dayEntries = allEntries.filter(e => {
      const isRelevant = currentUser.role === 'employee' ? e.userId === currentUser.id : true;
      return e.date === dateStr && isRelevant;
    });
    const totalMinutes = dayEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
    return {
      day: date.toLocaleDateString('en', { weekday: 'short' }),
      hours: parseFloat((totalMinutes / 60).toFixed(1)),
    };
  });

  const totalHoursThisWeek = last7Days.reduce((sum, d) => sum + d.hours, 0);
  const totalHoursToday = last7Days[last7Days.length - 1]?.hours || 0;

  const exportCSV = () => {
    const headers = ['Date', 'Task', 'User', 'Duration (min)', 'Notes'];
    const rows = visibleEntries.map(e => {
      const user = users.find(u => u.id === e.userId);
      return [e.date, e.taskTitle, user?.name || '', e.duration || 0, e.notes || ''];
    });
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'time-report.csv';
    a.click();
  };

  return (
    <AppLayout title="Time Tracking">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Today</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalHoursToday.toFixed(1)}h</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">This Week</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalHoursThisWeek.toFixed(1)}h</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Entries</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{visibleEntries.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Avg/Day</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{(totalHoursThisWeek / 7).toFixed(1)}h</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Timer */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            Active Timer
          </h3>

          {activeTimer ? (
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-indigo-600 mb-4">
                {formatElapsed(elapsed)}
              </div>
              <p className="text-sm text-gray-600 mb-3">
                {tasks.find(t => t.id === activeTimer.taskId)?.title}
              </p>
              <input
                value={timeNote}
                onChange={e => setTimeNote(e.target.value)}
                placeholder="Add a note..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleStopTimer}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                <Square className="w-4 h-4" />
                Stop Timer
              </button>
            </div>
          ) : (
            <div>
              <select
                value={selectedTaskId}
                onChange={e => setSelectedTaskId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Select a task...</option>
                {myActiveTasks.map(task => (
                  <option key={task.id} value={task.id}>{task.title}</option>
                ))}
              </select>
              <button
                onClick={handleStartTimer}
                disabled={!selectedTaskId}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <Play className="w-4 h-4" />
                Start Timer
              </button>
            </div>
          )}
        </div>

        {/* Manual Entry */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-600" />
            Manual Entry
          </h3>
          <div className="space-y-3">
            <select
              value={manualTaskId}
              onChange={e => setManualTaskId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Select a task...</option>
              {myActiveTasks.map(task => (
                <option key={task.id} value={task.id}>{task.title}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  value={manualHours}
                  onChange={e => setManualHours(e.target.value)}
                  placeholder="Hours"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  value={manualMinutes}
                  onChange={e => setManualMinutes(e.target.value)}
                  placeholder="Minutes"
                  min="0"
                  max="59"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <input
              value={manualNote}
              onChange={e => setManualNote(e.target.value)}
              placeholder="Notes (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleManualLog}
              disabled={!manualTaskId || (!manualHours && !manualMinutes)}
              className="w-full py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              Log Time
            </button>
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            Weekly Overview
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v}h`, 'Hours']} />
              <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Time Log Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Time Log</h3>
          <div className="flex items-center gap-3">
            {isManagement && (
              <select
                value={filterUser}
                onChange={e => setFilterUser(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="all">All Users</option>
                {users.filter(u => u.role === 'employee').map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            )}
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Task</th>
              {isManagement && <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>}
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Duration</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</th>
            </tr>
          </thead>
          <tbody>
            {visibleEntries.slice(0, 20).map(entry => {
              const entryUser = users.find(u => u.id === entry.userId);
              return (
                <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-600">{entry.date}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{entry.taskTitle}</p>
                  </td>
                  {isManagement && (
                    <td className="px-4 py-3">
                      {entryUser && (
                        <div className="flex items-center gap-2">
                          <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold', getAvatarColor(entryUser.name))}>
                            {getInitials(entryUser.name)}
                          </div>
                          <span className="text-xs text-gray-600">{entryUser.name}</span>
                        </div>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-indigo-600">{formatDuration(entry.duration || 0)}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{entry.notes || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {visibleEntries.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No time entries found</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
