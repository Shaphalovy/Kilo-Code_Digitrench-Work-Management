'use client';

import { useState } from 'react';
import { Task, User } from '@/types';
import {
  getStatusBadgeColor, getStatusLabel, getPriorityBgColor, getPriorityLabel,
  getInitials, getAvatarColor, formatDate, isTaskOverdue, isTaskDueSoon, cn
} from '@/lib/utils';
import { Calendar, Clock, MessageSquare, Paperclip, CheckSquare, AlertTriangle } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  assignee?: User;
  onClick?: () => void;
  compact?: boolean;
}

export default function TaskCard({ task, assignee, onClick, compact = false }: TaskCardProps) {
  const overdue = isTaskOverdue(task);
  const dueSoon = isTaskDueSoon(task);
  const completedSubtasks = task.subtasks.filter(s => s.completed).length;
  const totalSubtasks = task.subtasks.length;

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group',
        compact ? 'p-3' : 'p-4',
        overdue && 'border-red-200 bg-red-50/30',
      )}
    >
      {/* Priority & Status */}
      <div className="flex items-center justify-between mb-2">
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', getPriorityBgColor(task.priority))}>
          {getPriorityLabel(task.priority)}
        </span>
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', getStatusBadgeColor(task.status))}>
          {getStatusLabel(task.status)}
        </span>
      </div>

      {/* Title */}
      <h3 className={cn(
        'font-medium text-gray-900 group-hover:text-indigo-700 transition-colors line-clamp-2',
        compact ? 'text-sm' : 'text-sm'
      )}>
        {task.title}
      </h3>

      {!compact && task.description && (
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
      )}

      {/* Tags */}
      {!compact && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Subtasks progress */}
      {totalSubtasks > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span className="flex items-center gap-1">
              <CheckSquare className="w-3 h-3" />
              {completedSubtasks}/{totalSubtasks}
            </span>
            <span>{Math.round((completedSubtasks / totalSubtasks) * 100)}%</span>
          </div>
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2">
          {/* Due date */}
          <div className={cn(
            'flex items-center gap-1 text-xs',
            overdue ? 'text-red-600 font-medium' : dueSoon ? 'text-amber-600' : 'text-gray-500'
          )}>
            {overdue ? <AlertTriangle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
            {formatDate(task.dueDate)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Comments */}
          {task.comments.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <MessageSquare className="w-3 h-3" />
              {task.comments.length}
            </span>
          )}
          {/* Attachments */}
          {task.attachments.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Paperclip className="w-3 h-3" />
              {task.attachments.length}
            </span>
          )}
          {/* Assignee */}
          {assignee && (
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold',
                getAvatarColor(assignee.name)
              )}
              title={assignee.name}
            >
              {getInitials(assignee.name)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
