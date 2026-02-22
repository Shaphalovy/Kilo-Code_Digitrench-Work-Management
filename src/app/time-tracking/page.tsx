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

  // Timer effect - always call at top level
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTimer) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - new Date(activeTimer.startTime).getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  if (!currentUser) return null;

  const isManagement = currentUser.role !== 'employee';

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
      date: filterDate || new Date().toISOString().split('T')[0],
    };
    addTimeEntry(manualTaskId, entry);
    setManualHours('');
    setManualMinutes('');
    setManualTaskId('');
    setManualNote('');
  };

  const myTasks = isManagement
    ? tasks.filter(t => t.assigneeId === currentUser.id || t.assigneeId === currentUser.id)
    : tasks.filter(t => t.assigneeId === currentUser.id);

  const userTimeEntries = myTasks.flatMap(t => t.timeEntries.map(e => ({ ...e, taskId: t.id, taskTitle: t.title })));

  const filteredEntries = userTimeEntries.filter(e => {
    const matchesUser = filterUser === 'all' || e.userId === filterUser;
    const matchesDate = !filterDate || e.date === filterDate;
    return matchesUser && matchesDate;
  });

  const totalMinutes = filteredEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);

  const chartData = [...new Set(filteredEntries.map(e => e.date))].sort().slice(-7).map(date => {
    const dayEntries = filteredEntries.filter(e => e.date === date);
    return {
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      hours: Math.round((dayEntries.reduce((sum, e) => sum + (e.duration || 0), 0)) / 60 * 10) / 10,
    };
  });

  const exportCSV = () => {
    const csv = [
      ['Date', 'Task', 'Duration (minutes)', 'Notes'].join(','),
      ...filteredEntries.map(e => [
        e.date,
        `"${e.taskTitle}"`,
        e.duration,
        `"${e.notes || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time-entries-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout title="Time Tracking">
      <div className="space-y-6">
        {/* Active Timer */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Timer
            </h2>
            {activeTimer && (
              <span className="text-2xl font-mono text-indigo-600">{formatElapsed(elapsed)}</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Task</label>
              <select
                value={selectedTaskId}
                onChange={e => setSelectedTaskId(e.target.value)}
                disabled={!!activeTimer}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              >
                <option value="">Choose a task...</option>
                {myTasks.filter(t => t.status !== 'done').map(task => (
                  <option key={task.id} value={task.id}>{task.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
              <input
                type="text"
                value={timeNote}
                onChange={e => setTimeNote(e.target.value)}
                placeholder="What are you working on?"
                disabled={!!activeTimer}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            {!activeTimer ? (
              <button
                onClick={handleStartTimer}
                disabled={!selectedTaskId}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Play className="w-4 h-4" />
                Start Timer
              </button>
            ) : (
              <button
                onClick={handleStopTimer}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Square className="w-4 h-4" />
                Stop Timer
              </button>
            )}
          </div>
        </div>

        {/* Manual Entry */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Manual Entry
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Task</label>
              <select
                value={manualTaskId}
                onChange={e => setManualTaskId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choose a task...</option>
                {myTasks.map(task => (
                  <option key={task.id} value={task.id}>{task.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
              <input
                type="number"
                min="0"
                value={manualHours}
                onChange={e => setManualHours(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minutes</label>
              <input
                type="number"
                min="0"
                max="59"
                value={manualMinutes}
                onChange={e => setManualMinutes(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <input
                type="text"
                value={manualNote}
                onChange={e => setManualNote(e.target.value)}
                placeholder="What did you work on?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={handleManualLog}
              disabled={!manualTaskId || (!manualHours && !manualMinutes)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
              Log Time
            </button>
          </div>
        </div>

        {/* Time Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Total Time Logged</p>
            <p className="text-3xl font-bold text-gray-900">{formatDuration(totalMinutes)}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Entries This Week</p>
            <p className="text-3xl font-bold text-gray-900">{filteredEntries.length}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Average per Day</p>
            <p className="text-3xl font-bold text-gray-900">{totalHours > 0 ? `${Math.round(totalHours / 7)}h` : '0h'}</p>
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Weekly Overview
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Recent Entries */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Entries</h2>
            <div className="flex items-center gap-3">
              <select
                value={filterUser}
                onChange={e => setFilterUser(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Users</option>
                {users.filter(u => u.role !== 'admin').map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {filteredEntries.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No time entries found</p>
          ) : (
            <div className="space-y-3">
              {filteredEntries
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)
                .map(entry => {
                  const task = tasks.find(t => t.id === entry.taskId);
                  const user = users.find(u => u.id === entry.userId);
                  return (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold',
                          getAvatarColor(user?.name || '')
                        )}>
                          {getInitials(user?.name || '')}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{task?.title || 'Unknown Task'}</p>
                          <p className="text-sm text-gray-500">
                            {user?.name} • {formatDate(entry.date)}
                            {entry.notes && ` • ${entry.notes}`}
                          </p>
                        </div>
                      </div>
                      <span className="text-lg font-semibold text-indigo-600">
                        {formatDuration(entry.duration || 0)}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
