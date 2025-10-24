import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import {
  Bell,
  X,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Trash2,
  Check,
  Megaphone
} from 'lucide-react';

const NotificationPanel: React.FC = () => {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAll, 
    unreadCount 
  } = useNotifications();
  const { user, isAdmin } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/announcements`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const result = await response.json();
        setAnnouncements(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-l-green-500 bg-green-50';
      case 'error': return 'border-l-red-500 bg-red-50';
      case 'warning': return 'border-l-yellow-500 bg-yellow-50';
      default: return 'border-l-blue-500 bg-blue-50';
    }
  };

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case 'report_reminder': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'budget_release': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'urgent': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Megaphone className="h-4 w-4 text-blue-500" />;
    }
  };

  const getAnnouncementColor = (type: string) => {
    switch (type) {
      case 'report_reminder': return 'border-l-yellow-500 bg-yellow-50';
      case 'budget_release': return 'border-l-green-500 bg-green-50';
      case 'urgent': return 'border-l-red-500 bg-red-50';
      default: return 'border-l-blue-500 bg-blue-50';
    }
  };

  if (notifications.length === 0 && announcements.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No notifications</h3>
          <p className="text-muted-foreground">You're all caught up!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-xs text-destructive"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {/* Announcements */}
        {announcements.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Announcements</h4>
            <AnimatePresence>
              {announcements.map((announcement) => (
                <motion.div
                  key={announcement._id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  className={`p-3 border-l-4 rounded-r-lg ${getAnnouncementColor(announcement.type)} shadow-md mb-2`}
                >
                  <div className="flex items-start gap-2">
                    {getAnnouncementIcon(announcement.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-foreground">
                          {announcement.title}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {announcement.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {announcement.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(announcement.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        
        {/* Regular Notifications - Only show for admin and chief officers */}
        {notifications.length > 0 && (isAdmin || user?.role === 'chief-administrative-officer') && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Activity Notifications</h4>
            <AnimatePresence>
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  className={`p-3 border-l-4 rounded-r-lg ${getTypeColor(notification.type)} ${
                    !notification.read ? 'shadow-md' : 'opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      {getIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-foreground">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="h-6 w-6 p-0"
                          title="Mark as read"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeNotification(notification.id)}
                        className="h-6 w-6 p-0 text-destructive"
                        title="Remove"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Card>
  );
};

export default NotificationPanel;