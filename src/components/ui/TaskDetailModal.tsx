'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Task, TaskStatus, Comment, TimeEntry, Subtask } from '@/types';
import {
  getStatusBadgeColor, getStatusLabel, getPriorityBgColor, getPriorityLabel,
  getInitials, getAvatarColor, formatDate, formatDateTime, formatDuration,
  generateId, canManageTasks, canDeleteTasks, cn
} from '@/lib/utils';
import {
  X, Calendar, Clock, Paperclip, MessageSquare, CheckSquare,
  Play, Square, Plus, Trash2, Edit2, Check, ChevronDown,
  Send, Flag
} from 'lucide-react';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
}

const statusOptions: TaskStatus[] = ['todo', 'in_progress', 'review', 'done', 'blocked'];

export default function TaskDetailModal({ task: initialTask, onClose }: TaskDetailModalProps) {
  const { currentUser, updateTask, updateTaskStatus, addComment, addTimeEntry, updateTimeEntry, toggleSubtask, addSubtask, deleteTask, getUserById, addNotification } = useAppStore();
  const tasks = useAppStore(s => s.tasks);
  const task = tasks.find(t => t.id === initialTask.id) || initialTask;

  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'time' | 'subtasks'>('details');
  const [newComment, setNewComment] = useState('');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStart, setTimerStart] = useState<string | null>(null);
  const [newSubtask, setNewSubtask] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [timeNote, setTimeNote] = useState('');
  const [manualHours, setManualHours] = useState('');
  const [manualMinutes, setManualMinutes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description);

  if (!currentUser) return null;

  const assignee = getUserById(task.assigneeId);
  const creator = getUserById(task.createdBy);
  const canManage = canManageTasks(currentUser);
  const canDelete = canDeleteTasks(currentUser);
  const isAssignee = task.assigneeId === currentUser.id;
  const canEdit = canManage || isAssignee;

  const handleStatusChange = (status: TaskStatus) => {
    updateTaskStatus(task.id, status);
    setShowStatusDropdown(false);

    // Notify management if employee marks as review
    if (status === 'review' && currentUser.role === 'employee') {
      const mgmtUsers = useAppStore.getState().users.filter(u => u.role === 'management' || u.role === 'admin');
      mgmtUsers.forEach(mgmt => {
        addNotification({
          id: generateId('notif'),
          userId: mgmt.id,
          type: 'review_request',
          title: 'Task Ready for Review',
          message: `${currentUser.name} marked "${task.title}" as ready for review`,
          taskId: task.id,
          fromUserId: currentUser.id,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      });
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const mentions = newComment.match(/@(\w+)/g)?.map(m => m.slice(1)) || [];
    const comment: Comment = {
      id: generateId('comment'),
      taskId: task.id,
      userId: currentUser.id,
      content: newComment,
      mentions,
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addComment(task.id, comment);
    setNewComment('');
  };

  const handleStartTimer = () => {
    setIsTimerRunning(true);
    setTimerStart(new Date().toISOString());
  };

  const handleStopTimer = () => {
    if (!timerStart) return;
    const endTime = new Date().toISOString();
    const duration = Math.round((new Date(endTime).getTime() - new Date(timerStart).getTime()) / 60000);
    const entry: TimeEntry = {
      id: generateId('te'),
      taskId: task.id,
      userId: currentUser.id,
      startTime: timerStart,
      endTime,
      duration,
      notes: timeNote,
      date: new Date().toISOString().split('T')[0],
    };
    addTimeEntry(task.id, entry);
    setIsTimerRunning(false);
    setTimerStart(null);
    setTimeNote('');
  };

  const handleManualTime = () => {
    const hours = parseInt(manualHours) || 0;
    const minutes = parseInt(manualMinutes) || 0;
    const duration = hours * 60 + minutes;
    if (duration <= 0) return;
    const entry: TimeEntry = {
      id: generateId('te'),
      taskId: task.id,
      userId: currentUser.id,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      duration,
      notes: timeNote,
      date: new Date().toISOString().split('T')[0],
    };
    addTimeEntry(task.id, entry);
    setManualHours('');
    setManualMinutes('');
    setTimeNote('');
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    const subtask: Subtask = {
      id: generateId('sub'),
      title: newSubtask,
      completed: false,
    };
    addSubtask(task.id, subtask);
    setNewSubtask('');
  };

  const handleSaveEdit = () => {
    updateTask(task.id, { title: editTitle, description: editDescription });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(task.id);
      onClose();
    }
  };

  const totalTimeLogged = task.timeEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
  const completedSubtasks = task.subtasks.filter(s => s.completed).length;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div className="flex-1 pr-4">
            {isEditing ? (
              <input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="w-full text-xl font-bold text-gray-900 border-b-2 border-indigo-500 outline-none pb-1"
                autoFocus
              />
            ) : (
              <h2 className="text-xl font-bold text-gray-900">{task.title}</h2>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', getPriorityBgColor(task.priority))}>
                <Flag className="w-3 h-3 inline mr-1" />
                {getPriorityLabel(task.priority)}
              </span>

              {/* Status Dropdown */}
              <div className="relative">
                <button
                  onClick={() => canEdit && setShowStatusDropdown(!showStatusDropdown)}
                  className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1',
                    getStatusBadgeColor(task.status),
                    canEdit && 'cursor-pointer hover:opacity-80'
                  )}
                >
                  {getStatusLabel(task.status)}
                  {canEdit && <ChevronDown className="w-3 h-3" />}
                </button>
                {showStatusDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10 min-w-[140px]">
                    {statusOptions.map(s => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className={cn(
                          'flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-gray-50 transition-colors',
                          task.status === s && 'bg-gray-50 font-medium'
                        )}
                      >
                        <span className={cn('w-2 h-2 rounded-full', getStatusBadgeColor(s).split(' ')[0])} />
                        {getStatusLabel(s)}
                        {task.status === s && <Check className="w-3 h-3 ml-auto text-indigo-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {isEditing && (
              <>
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700"
                >
                  Save
                </button>
                <button
                  onClick={() => { setIsEditing(false); setEditTitle(task.title); setEditDescription(task.description); }}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          {[
            { id: 'details', label: 'Details' },
            { id: 'comments', label: `Comments (${task.comments.length})` },
            { id: 'time', label: `Time (${formatDuration(totalTimeLogged)})` },
            { id: 'subtasks', label: `Subtasks (${completedSubtasks}/${task.subtasks.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</label>
                {isEditing ? (
                  <textarea
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    className="w-full mt-1 p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    rows={4}
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                    {task.description || <span className="text-gray-400 italic">No description</span>}
                  </p>
                )}
              </div>

              {/* Meta info grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Assignee</label>
                  <div className="flex items-center gap-2 mt-1">
                    {assignee ? (
                      <>
                        <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold', getAvatarColor(assignee.name))}>
                          {getInitials(assignee.name)}
                        </div>
                        <span className="text-sm text-gray-700">{assignee.name}</span>
                      </>
                    ) : <span className="text-sm text-gray-400">Unassigned</span>}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Created By</label>
                  <div className="flex items-center gap-2 mt-1">
                    {creator ? (
                      <>
                        <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold', getAvatarColor(creator.name))}>
                          {getInitials(creator.name)}
                        </div>
                        <span className="text-sm text-gray-700">{creator.name}</span>
                      </>
                    ) : <span className="text-sm text-gray-400">Unknown</span>}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Due Date</label>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{formatDate(task.dueDate)}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</label>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{formatDate(task.createdAt)}</span>
                  </div>
                </div>

                {task.estimatedHours && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Estimated</label>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{task.estimatedHours}h</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Time Logged</label>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{formatDuration(totalTimeLogged)}</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {task.tags.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tags</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {task.tags.map(tag => (
                      <span key={tag} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {task.attachments.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Attachments</label>
                  <div className="space-y-2 mt-1">
                    {task.attachments.map(att => (
                      <div key={att.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                        <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700 flex-1 truncate">{att.name}</span>
                        <span className="text-xs text-gray-400">{(att.size / 1024).toFixed(0)}KB</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              {task.comments.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No comments yet</p>
                </div>
              ) : (
                task.comments.map(comment => {
                  const commentUser = getUserById(comment.userId);
                  return (
                    <div key={comment.id} className="flex gap-3">
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0', getAvatarColor(commentUser?.name || ''))}>
                        {getInitials(commentUser?.name || '?')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">{commentUser?.name}</span>
                          <span className="text-xs text-gray-400">{formatDateTime(comment.createdAt)}</span>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                          {comment.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Add Comment */}
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0', getAvatarColor(currentUser.name))}>
                  {getInitials(currentUser.name)}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Add a comment... Use @name to mention someone"
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    rows={3}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && e.ctrlKey) handleAddComment();
                    }}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      Comment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Time Tracking Tab */}
          {activeTab === 'time' && (
            <div className="space-y-4">
              {/* Timer */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Timer</h4>
                <div className="flex items-center gap-3">
                  {!isTimerRunning ? (
                    <button
                      onClick={handleStartTimer}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      Start Timer
                    </button>
                  ) : (
                    <button
                      onClick={handleStopTimer}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors animate-pulse"
                    >
                      <Square className="w-4 h-4" />
                      Stop Timer
                    </button>
                  )}
                  {isTimerRunning && timerStart && (
                    <span className="text-sm text-gray-600">
                      Started at {new Date(timerStart).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <input
                  value={timeNote}
                  onChange={e => setTimeNote(e.target.value)}
                  placeholder="Add a note for this time entry..."
                  className="w-full mt-3 p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Manual Entry */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Manual Entry</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={manualHours}
                    onChange={e => setManualHours(e.target.value)}
                    placeholder="Hours"
                    min="0"
                    className="w-24 p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-gray-500 text-sm">h</span>
                  <input
                    type="number"
                    value={manualMinutes}
                    onChange={e => setManualMinutes(e.target.value)}
                    placeholder="Minutes"
                    min="0"
                    max="59"
                    className="w-24 p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-gray-500 text-sm">m</span>
                  <button
                    onClick={handleManualTime}
                    className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Log
                  </button>
                </div>
              </div>

              {/* Time Entries */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Time Entries</h4>
                {task.timeEntries.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No time logged yet</p>
                ) : (
                  <div className="space-y-2">
                    {task.timeEntries.map(entry => {
                      const entryUser = getUserById(entry.userId);
                      return (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2">
                            <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold', getAvatarColor(entryUser?.name || ''))}>
                              {getInitials(entryUser?.name || '?')}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-700">{entryUser?.name}</p>
                              {entry.notes && <p className="text-xs text-gray-500">{entry.notes}</p>}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">{formatDuration(entry.duration || 0)}</p>
                            <p className="text-xs text-gray-400">{entry.date}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-sm font-semibold text-gray-700">Total</span>
                      <span className="text-sm font-bold text-indigo-600">{formatDuration(totalTimeLogged)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subtasks Tab */}
          {activeTab === 'subtasks' && (
            <div className="space-y-3">
              {/* Progress */}
              {task.subtasks.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">{completedSubtasks} of {task.subtasks.length} completed</span>
                    <span className="font-semibold text-indigo-600">{Math.round((completedSubtasks / task.subtasks.length) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${(completedSubtasks / task.subtasks.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Subtask List */}
              <div className="space-y-2">
                {task.subtasks.map(subtask => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <button
                      onClick={() => toggleSubtask(task.id, subtask.id)}
                      className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                        subtask.completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-indigo-500'
                      )}
                    >
                      {subtask.completed && <Check className="w-3 h-3" />}
                    </button>
                    <span className={cn('text-sm flex-1', subtask.completed && 'line-through text-gray-400')}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add Subtask */}
              <div className="flex gap-2 pt-2">
                <input
                  value={newSubtask}
                  onChange={e => setNewSubtask(e.target.value)}
                  placeholder="Add a subtask..."
                  className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
                />
                <button
                  onClick={handleAddSubtask}
                  disabled={!newSubtask.trim()}
                  className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
