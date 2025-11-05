import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Bell, Check, CheckCheck, Clock, X, Megaphone } from 'lucide-react';
import { notificationService } from '@/services/notificationService';

interface Notification {
  _id: string;
  type: 'update_approved' | 'update_rejected' | 'update_requested' | 'announcement';
  title: string;
  message: string;
  billNo: string;
  isRead: boolean;
  createdAt: string;
  createdBy: { name: string };
  announcementType?: string;
}

export function NotificationPanel() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getNotifications();
      setNotifications(response.data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive'
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast({
        title: 'Success',
        description: 'All notifications marked as read'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive'
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'update_approved':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'update_rejected':
        return <X className="h-4 w-4 text-red-600" />;
      case 'announcement':
        return <Megaphone className="h-4 w-4 text-purple-600" />;
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'update_approved':
        return 'border-l-green-500';
      case 'update_rejected':
        return 'border-l-red-500';
      case 'announcement':
        return 'border-l-purple-500';
      default:
        return 'border-l-blue-500';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-muted-foreground">Loading notifications...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark All Read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No notifications yet
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`border-l-4 p-3 rounded-r-lg ${getNotificationColor(notification.type)} ${
                !notification.isRead ? 'bg-blue-50' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 flex-1">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      {notification.type === 'announcement' ? (
                        <span className="capitalize">{notification.billNo} Announcement</span>
                      ) : (
                        <span>Bill #{notification.billNo}</span>
                      )}
                      <span>•</span>
                      <span>{new Date(notification.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                {!notification.isRead && notification.type !== 'announcement' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkAsRead(notification._id)}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}