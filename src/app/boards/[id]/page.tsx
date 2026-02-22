'use client';

import { useState, use } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAppStore } from '@/lib/store';
import TaskCard from '@/components/ui/TaskCard';
import TaskDetailModal from '@/components/ui/TaskDetailModal';
import CreateTaskModal from '@/components/ui/CreateTaskModal';
import { Task, TaskStatus } from '@/types';
import {
  getStatusLabel, getStatusBadgeColor, getDepartmentLabel, getDepartmentColor,
  calculateCompletionRate, getOverdueTasks, formatDate, canManageTasks, cn
} from '@/lib/utils';
import {
  Plus, ArrowLeft, Settings, Users, Calendar, BarChart3,
  List, Columns, Filter, Search, AlertTriangle, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const statusColumns: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'todo', label: 'To Do', color: 'bg-gray-100 border-gray-300' },
  { status: 'in_progress', label: 'In Progress', color: 'bg-blue-50 border-blue-300' },
  { status: 'review', label: 'In Review', color: 'bg-amber-50 border-amber-300' },
  { status: 'done', label: 'Done', color: 'bg-green-50 border-green-300' },
  { status: 'blocked', label: 'Blocked', color: 'bg-red-50 border-red-300' },
];

export default function BoardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { currentUser, projects, tasks, users, updateTaskStatus, deleteProject } = useAppStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  if (!currentUser) return null;

  const project = projects.find(p => p.id === id);
  if (!project) {
    return (
      <AppLayout title="Board Not Found">
        <div className="text-center py-16">
          <p className="text-gray-500">Project not found</p>
          <Link href="/boards" className="text-indigo-600 hover:underline mt-2 block">Back to Boards</Link>
        </div>
      </AppLayout>
    );
  }

  const canManage = canManageTasks(currentUser);
  const projectTasks = tasks.filter(t => t.projectId === id);

  // Filter tasks based on role
  const visibleTasks = currentUser.role === 'employee'
    ? projectTasks.filter(t => t.assigneeId === currentUser.id)
    : projectTasks;

  const filteredTasks = visibleTasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    const matchesAssignee = filterAssignee === 'all' || t.assigneeId === filterAssignee;
    return matchesSearch && matchesPriority && matchesAssignee;
  });

  const getColumnTasks = (status: TaskStatus) =>
    filteredTasks.filter(t => t.status === status);

  const projectMembers = project.members.map(id => users.find(u => u.id === id)).filter(Boolean);
  const completionRate = calculateCompletionRate(projectTasks);
  const overdueTasks = getOverdueTasks(projectTasks);

  // Drag and Drop handlers
  const handleDragStart = (taskId: string) => {
    if (!canManage) return;
    setDraggedTask(taskId);
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (draggedTask && canManage) {
      updateTaskStatus(draggedTask, status);
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDeleteProject = () => {
    if (confirm(`Are you sure you want to delete "${project.name}"? This will also delete all tasks.`)) {
      deleteProject(id);
      router.push('/boards');
    }
  };

  const deptColor = getDepartmentColor(project.department);

  return (
    <AppLayout title={project.name}>
      {/* Project Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Link href="/boards" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4" />
            Boards
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-700 font-medium">{project.name}</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${project.color}20` }}>
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: project.color }} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${deptColor}20`, color: deptColor }}
                  >
                    {getDepartmentLabel(project.department)}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{project.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {project.endDate ? `Due ${formatDate(project.endDate)}` : 'No end date'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {projectMembers.length} members
                  </span>
                  {overdueTasks.length > 0 && (
                    <span className="flex items-center gap-1 text-red-600">
                      <AlertTriangle className="w-3 h-3" />
                      {overdueTasks.length} overdue
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Progress */}
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
                <p className="text-xs text-gray-500">Complete</p>
                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${completionRate}%`, backgroundColor: project.color }}
                  />
                </div>
              </div>

              {canManage && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCreateTask(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Task
                  </button>
                  <button
                    onClick={handleDeleteProject}
                    className="p-2 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    title="Delete Project"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {canManage && (
          <select
            value={filterAssignee}
            onChange={e => setFilterAssignee(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="all">All Members</option>
            {projectMembers.map(member => member && (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>
        )}

        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden ml-auto">
          <button
            onClick={() => setViewMode('kanban')}
            className={cn('flex items-center gap-1.5 px-3 py-2 text-sm transition-colors', viewMode === 'kanban' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}
          >
            <Columns className="w-4 h-4" />
            Kanban
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn('flex items-center gap-1.5 px-3 py-2 text-sm transition-colors', viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}
          >
            <List className="w-4 h-4" />
            List
          </button>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statusColumns.map(col => {
            const colTasks = getColumnTasks(col.status);
            const isDragOver = dragOverColumn === col.status;

            return (
              <div
                key={col.status}
                className="flex-shrink-0 w-72"
                onDragOver={e => handleDragOver(e, col.status)}
                onDrop={e => handleDrop(e, col.status)}
              >
                {/* Column Header */}
                <div className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-t-lg border-t border-x',
                  col.color
                )}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                    <span className="text-xs bg-white/80 text-gray-600 px-1.5 py-0.5 rounded-full font-medium">
                      {colTasks.length}
                    </span>
                  </div>
                  {canManage && col.status === 'todo' && (
                    <button
                      onClick={() => setShowCreateTask(true)}
                      className="p-1 rounded hover:bg-white/50 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Column Body */}
                <div className={cn(
                  'min-h-[400px] p-2 rounded-b-lg border-b border-x space-y-2 transition-colors',
                  col.color,
                  isDragOver && 'ring-2 ring-indigo-400 ring-inset'
                )}>
                  {colTasks.map(task => {
                    const assignee = users.find(u => u.id === task.assigneeId);
                    return (
                      <div
                        key={task.id}
                        draggable={canManage}
                        onDragStart={() => handleDragStart(task.id)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          'transition-opacity',
                          draggedTask === task.id && 'opacity-50'
                        )}
                      >
                        <TaskCard
                          task={task}
                          assignee={assignee}
                          onClick={() => setSelectedTask(task)}
                        />
                      </div>
                    );
                  })}

                  {colTasks.length === 0 && (
                    <div className="flex items-center justify-center h-24 text-xs text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                      Drop tasks here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Task</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Assignee</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Due Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Progress</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(task => {
                const assignee = users.find(u => u.id === task.assigneeId);
                const completedSubs = task.subtasks.filter(s => s.completed).length;
                return (
                  <tr
                    key={task.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedTask(task)}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{task.title}</p>
                      {task.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {task.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {assignee && (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                            {assignee.name[0]}
                          </div>
                          <span className="text-xs text-gray-600">{assignee.name.split(' ')[0]}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
                        task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                        task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                        task.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      )}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', getStatusBadgeColor(task.status))}>
                        {getStatusLabel(task.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600">{formatDate(task.dueDate)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {task.subtasks.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${(completedSubs / task.subtasks.length) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{completedSubs}/{task.subtasks.length}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredTasks.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No tasks found</p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
      {showCreateTask && (
        <CreateTaskModal projectId={id} onClose={() => setShowCreateTask(false)} />
      )}
    </AppLayout>
  );
}
