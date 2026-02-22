'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { getInitials, getAvatarColor, formatRelative, cn } from '@/lib/utils';
import { Bell, Search, ChevronDown, Check, CheckCheck, X } from 'lucide-react';

export default function Header({ title }: { title?: string }) {
  const { currentUser, notifications, markNotificationRead, markAllNotificationsRead, sidebarOpen } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Always call useEffect at the top level
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  const userNotifications = notifications
    .filter(n => n.userId === currentUser.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const unreadCount = userNotifications.filter(n => !n.isRead).length;

  const getNotifIcon = (type: string) => {
    const icons: Record<string, string> = {
      task_assigned: '📋',
      task_updated: '✏️',
      comment_mention: '💬',
      deadline_reminder: '⏰',
      status_change: '🔄',
      review_request: '👀',
    };
    return icons[type] || '🔔';
  };

  return (
    <header className={cn(
      'fixed top-0 right-0 h-16 bg-white border-b border-gray-200 z-10 flex items-center justify-between px-6 transition-all duration-300',
      sidebarOpen ? 'left-64' : 'left-0 lg:left-16'
    )}>
      {/* Left: Title */}
      <div className="flex items-center gap-4">
        {title && (
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllNotificationsRead(currentUser.id)}
                    className="text-xs text-indigo-600 hover:text-indigo-700"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {userNotifications.length === 0 ? (
                  <p className="p-4 text-sm text-gray-500 text-center">No notifications</p>
                ) : (
                  userNotifications.map(notif => (
                    <div
                      key={notif.id}
                      className={cn(
                        'p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors',
                        !notif.isRead && 'bg-indigo-50'
                      )}
                      onClick={() => markNotificationRead(notif.id)}
                    >
                      <div className="flex gap-3">
                        <span className="text-lg">{getNotifIcon(notif.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm', notif.isRead ? 'text-gray-600' : 'text-gray-900 font-medium')}>
                            {notif.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatRelative(notif.createdAt)}
                          </p>
                        </div>
                        {!notif.isRead && (
                          <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold',
              getAvatarColor(currentUser.name)
            )}>
              {getInitials(currentUser.name)}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <p className="font-medium text-gray-900">{currentUser.name}</p>
                <p className="text-sm text-gray-500">{currentUser.email}</p>
              </div>
              <div className="p-2">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4" />
                  My Profile
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Settings
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
