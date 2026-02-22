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

  return (
    <header className={cn(
      'fixed top-0 right-0 h-16 bg-white border-b border-gray-200 z-10 flex items-center justify-between px-6 transition-all duration-300',
      sidebarOpen ? 'left-64' : 'left-0 lg:left-16'
    )}>
      {/* Left: Title */}
      <div className="flex items-center gap-4">
        {title && (
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllNotificationsRead(currentUser.id)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" />
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowNotifications(false)}>
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {userNotifications.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 text-sm">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    No notifications
                  </div>
                ) : (
                  userNotifications.map(notif => (
                    <div
                      key={notif.id}
                      className={cn(
                        'flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors',
                        !notif.isRead && 'bg-indigo-50/50'
                      )}
                      onClick={() => markNotificationRead(notif.id)}
                    >
                      <span className="text-lg flex-shrink-0 mt-0.5">{getNotifIcon(notif.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm', !notif.isRead ? 'font-semibold text-gray-900' : 'text-gray-700')}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatRelative(notif.createdAt)}</p>
                      </div>
                      {!notif.isRead && (
                        <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5" />
                      )}
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
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold',
              getAvatarColor(currentUser.name)
            )}>
              {getInitials(currentUser.name)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900 leading-tight">{currentUser.name}</p>
              <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
            </div>
            <ChevronDown className="w-3 h-3 text-gray-400 hidden sm:block" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-medium text-gray-900 text-sm">{currentUser.name}</p>
                <p className="text-xs text-gray-500">{currentUser.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full capitalize">
                  {currentUser.role}
                </span>
              </div>
              <div className="py-1">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowProfile(false)}
                >
                  Profile Settings
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
