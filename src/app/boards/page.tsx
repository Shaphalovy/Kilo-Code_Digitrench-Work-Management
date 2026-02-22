'use client';

import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAppStore } from '@/lib/store';
import { Project, Task } from '@/types';
import {
  getDepartmentLabel, getDepartmentColor, calculateCompletionRate,
  getOverdueTasks, formatDate, cn
} from '@/lib/utils';
import {
  Plus, FolderKanban, Users, Calendar, MoreHorizontal, Archive,
  CheckCircle2, Clock, AlertTriangle, Search, Filter, Grid3X3, List, Trash2
} from 'lucide-react';
import Link from 'next/link';
import CreateProjectModal from '@/components/ui/CreateProjectModal';

export default function BoardsPage() {
  const { currentUser, projects, tasks, users, deleteProject, departments } = useAppStore();
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  if (!currentUser) return null;

  const canCreate = currentUser.role === 'management' || currentUser.role === 'admin';
  const canDelete = currentUser.role === 'admin';

  // Filter projects based on role
  const visibleProjects = currentUser.role === 'employee'
    ? projects.filter(p => p.members.includes(currentUser.id))
    : projects;

  const filteredProjects = visibleProjects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDept === 'all' || p.department === filterDept;
    return matchesSearch && matchesDept;
  });

  const handleDeleteProject = (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project? All associated tasks will also be deleted.')) {
      deleteProject(projectId);
      setProjectToDelete(null);
    }
  };

  const deptList = [...new Set(visibleProjects.map(p => p.department))];

  const getProjectStats = (project: Project) => {
    const projectTasks = tasks.filter(t => t.projectId === project.id);
    return {
      total: projectTasks.length,
      done: projectTasks.filter(t => t.status === 'done').length,
      inProgress: projectTasks.filter(t => t.status === 'in_progress').length,
      overdue: getOverdueTasks(projectTasks).length,
      completionRate: calculateCompletionRate(projectTasks),
    };
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    archived: 'bg-gray-100 text-gray-700',
    on_hold: 'bg-amber-100 text-amber-700',
  };

  return (
    <AppLayout title="Boards">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-gray-500 text-sm">Manage and track all your department projects</p>
        </div>
        <div className="flex items-center gap-3">
          {canCreate && (
            <button
              onClick={() => setShowCreateProject(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={filterDept}
          onChange={e => setFilterDept(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="all">All Departments</option>
          {deptList.map(dept => (
            <option key={dept} value={dept}>{getDepartmentLabel(dept)}</option>
          ))}
        </select>

        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={cn('p-2 transition-colors', viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn('p-2 transition-colors', viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <FolderKanban className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No projects found</h3>
          <p className="text-gray-500 text-sm mb-4">
            {canCreate ? 'Create your first project to get started' : 'No projects assigned to you yet'}
          </p>
          {canCreate && (
            <button
              onClick={() => setShowCreateProject(true)}
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
            >
              Create Project
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map(project => {
            const stats = getProjectStats(project);
            const deptColor = getDepartmentColor(project.department);
            const members = project.members.map(id => users.find(u => u.id === id)).filter(Boolean);

            return (
              <div key={project.id} className="bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all overflow-hidden group">
                {/* Color bar */}
                <div className="h-1.5" style={{ backgroundColor: project.color }} />

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${deptColor}20`, color: deptColor }}
                        >
                          {getDepartmentLabel(project.department)}
                        </span>
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statusColors[project.status])}>
                          {project.status.replace('_', ' ')}
                        </span>
                      </div>
                      <Link href={`/boards/${project.id}`}>
                        <h3 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors line-clamp-1">
                          {project.name}
                        </h3>
                      </Link>
                    </div>
                    {canDelete && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                        className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 line-clamp-2 mb-4">{project.description}</p>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{stats.done}/{stats.total} tasks</span>
                      <span className="font-medium text-gray-700">{stats.completionRate}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${stats.completionRate}%`, backgroundColor: project.color }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {stats.inProgress} active
                    </span>
                    {stats.overdue > 0 && (
                      <span className="flex items-center gap-1 text-red-600">
                        <AlertTriangle className="w-3 h-3" />
                        {stats.overdue} overdue
                      </span>
                    )}
                    {project.endDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(project.endDate)}
                      </span>
                    )}
                  </div>

                  {/* Members */}
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {members.slice(0, 4).map(member => member && (
                        <div
                          key={member.id}
                          className={cn(
                            'w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold',
                            member.role === 'management' ? 'bg-indigo-500' : 'bg-emerald-500'
                          )}
                          title={member.name}
                        >
                          {member.name[0]}
                        </div>
                      ))}
                      {members.length > 4 && (
                        <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs text-gray-600 font-medium">
                          +{members.length - 4}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{members.length} members</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Project</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Progress</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tasks</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Due Date</th>
                {canDelete && <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map(project => {
                const stats = getProjectStats(project);
                return (
                  <tr key={project.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/boards/${project.id}`} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                        <span className="text-sm font-medium text-gray-900 hover:text-indigo-700">{project.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600">{getDepartmentLabel(project.department)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statusColors[project.status])}>
                        {project.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${stats.completionRate}%`, backgroundColor: project.color }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{stats.completionRate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{stats.done}/{stats.total}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">{project.endDate ? formatDate(project.endDate) : '—'}</span>
                    </td>
                    {canDelete && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreateProject && (
        <CreateProjectModal onClose={() => setShowCreateProject(false)} />
      )}
    </AppLayout>
  );
}
