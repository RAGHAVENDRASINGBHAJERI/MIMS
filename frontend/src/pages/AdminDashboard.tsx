import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/context/NotificationContext';
import UserManagement from '@/components/UserManagement';
import { NotificationPanel } from '@/components/NotificationPanel';
import DepartmentManagement from '@/components/DepartmentManagement';
import { AnnouncementDialog } from '@/components/AnnouncementDialog';
import { UpdateAssetsPanel } from '@/components/UpdateAssetsPanel';
import {
  ArrowLeft,
  Database,
  Users,
  FileText,
  Activity,
  Eye,
  Download,
  Bell,
  Plus,
  Key,
  UserCog,
  Trash2
} from 'lucide-react';

interface AuditLog {
  _id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: 'ASSET' | 'USER' | 'DEPARTMENT';
  entityId: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  officerName?: string;
  billInfo?: {
    billNumber: string;
    vendorName: string;
  };
  reason: string;
  timestamp: string;
}

interface DatabaseStats {
  stats: {
    assets: number;
    users: number;
    departments: number;
    auditLogs: number;
    passwordResets: number;
    passwordResetRequests: number;
  };
  assetsByType: Array<{ _id: string; count: number }>;
  recentActivity: AuditLog[];
  pendingPasswordResets: Array<{
    _id: string;
    userId: {
      _id: string;
      name: string;
      email: string;
      role: string;
      department?: string;
    };
    reason: string;
    createdAt: string;
  }>;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'departments' | 'notifications' | 'announcements' | 'updates'>('overview');
  const { addNotification } = useNotifications();
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

  const fetchAnnouncements = async () => {
    
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    setLoadingAnnouncements(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/announcements`, {
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
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  const toggleAnnouncementStatus = async (announcementId: string, isActive: boolean) => {
    
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    try {
      const response = await fetch(`${API_URL}/api/admin/announcements/${announcementId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({ isActive })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Announcement ${isActive ? 'activated' : 'deactivated'} successfully`,
        });
        fetchAnnouncements();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update announcement status',
        variant: 'destructive',
      });
    }
  };

  const deleteAnnouncement = async (announcementId: string) => {
    
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/announcements/${announcementId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Announcement deleted successfully',
        });
        fetchAnnouncements();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete announcement',
        variant: 'destructive',
      });
    }
  };

  const handleCreateAnnouncement = async (data: any) => {
    
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    try {
      const response = await fetch(`${API_URL}/api/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Announcement created successfully',
        });
        addNotification({
          type: 'success',
          title: 'Announcement Created',
          message: `New announcement: ${data.title}`
        });
        fetchAnnouncements();
        setShowAnnouncementDialog(false);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create announcement',
        variant: 'destructive',
      });
    }
  };

  const fetchDatabaseStats = async () => {
    
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    try {
      const response = await fetch(`${API_URL}/api/admin/database-stats`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch database stats:', error);
    }
  };

  const fetchAuditLogs = async () => {
    
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    try {
      console.log('Fetching audit logs from:', `${API_URL}/api/admin/audit-logs?limit=20`);
      const response = await fetch(`${API_URL}/api/admin/audit-logs?limit=20`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      console.log('Audit logs response status:', response.status);
      if (response.ok) {
        const result = await response.json();
        console.log('Audit logs result:', result);
        setAuditLogs(result.data.logs || []);
      } else {
        console.error('Failed to fetch audit logs, status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    fetchDatabaseStats();
    fetchAuditLogs();
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (activeTab === 'announcements') {
      fetchAnnouncements();
    }
  }, [activeTab]);

  const clearAuditLogs = async () => {
    if (!confirm('Are you sure you want to clear all audit logs? This action cannot be undone.')) return;
    
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    try {
      const response = await fetch(`${API_URL}/api/admin/clear-audit-logs`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setAuditLogs([]);
        toast({
          title: 'Success',
          description: 'All audit logs cleared successfully',
        });
        fetchDatabaseStats(); // Refresh stats
      } else {
        throw new Error('Failed to clear audit logs');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear audit logs',
        variant: 'destructive',
      });
    }
  };

  const exportAuditLogs = async () => {
    
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    try {
      const response = await fetch(`${API_URL}/api/admin/audit-logs?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const csvContent = [
          'Timestamp,Action,Entity Type,User,Email,Officer,Bill Number,Vendor,Reason',
          ...result.data.logs.map((log: AuditLog) => 
            `${new Date(log.timestamp).toLocaleString()},${log.action},${log.entityType},${log.userId?.name || 'Unknown User'},${log.userId?.email || 'No email'},${log.action === 'DELETE' ? (log.officerName || 'N/A') : 'N/A'},${log.billInfo?.billNumber || 'N/A'},${log.billInfo?.vendorName || 'N/A'},"${log.reason}"`
          )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
          title: 'Success',
          description: 'Audit logs exported successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export audit logs',
        variant: 'destructive',
      });
    }
  };

  const approvePasswordReset = async (requestId: string) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    const request = stats?.pendingPasswordResets.find(r => r._id === requestId);
    if (!request) return;

    try {
      const usersResponse = await fetch(`${API_URL}/api/admin/all-users`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (usersResponse.ok) {
        const usersResult = await usersResponse.json();
        const existingUser = usersResult.data.find((u: any) => u.email === request.userId.email);
        
        if (!existingUser) {
          toast({
            title: 'Error',
            description: 'User not found in system',
            variant: 'destructive',
          });
          return;
        }

        const response = await fetch(`${API_URL}/api/admin/password-reset-requests/${requestId}/approve`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          toast({
            title: 'Success',
            description: 'Password reset approved. Redirecting to edit user...',
          });
          
          sessionStorage.setItem('editUserData', JSON.stringify({
            _id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role,
            department: existingUser.department?._id || null
          }));
          
          setActiveTab('users');
          fetchDatabaseStats();
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve password reset',
        variant: 'destructive',
      });
    }
  };

  const rejectPasswordReset = async (requestId: string) => {
    
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/password-reset-requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Password reset request rejected',
        });
        addNotification({
          type: 'warning',
          title: 'Password Reset Rejected',
          message: `Password reset request has been rejected. Reason: ${reason}`
        });
        fetchDatabaseStats();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject password reset',
        variant: 'destructive',
      });
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-info/5 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground">Welcome, {user?.name} | Full database access and audit logs</p>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/password-reset')}
            >
              <Key className="h-4 w-4 mr-2" />
              Change Password
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/admin/management')}
            >
              <UserCog className="h-4 w-4 mr-2" />
              Admin Management
            </Button>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={activeTab === 'overview' ? 'default' : 'outline'}
              onClick={() => setActiveTab('overview')}
            >
              <Database className="h-4 w-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={activeTab === 'users' ? 'default' : 'outline'}
              onClick={() => setActiveTab('users')}
            >
              <Users className="h-4 w-4 mr-2" />
              User Management
            </Button>
            <Button
              variant={activeTab === 'departments' ? 'default' : 'outline'}
              onClick={() => setActiveTab('departments')}
            >
              <Database className="h-4 w-4 mr-2" />
              Departments
            </Button>
            <Button
              variant={activeTab === 'notifications' ? 'default' : 'outline'}
              onClick={() => setActiveTab('notifications')}
            >
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
            <Button
              variant={activeTab === 'announcements' ? 'default' : 'outline'}
              onClick={() => setActiveTab('announcements')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Announcements
            </Button>
            <Button
              variant={activeTab === 'updates' ? 'default' : 'outline'}
              onClick={() => setActiveTab('updates')}
            >
              <Activity className="h-4 w-4 mr-2" />
              Update Assets
            </Button>
          </div>
        </motion.div>

        {activeTab === 'overview' && (
          <>
            {/* Database Statistics */}
            {stats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6"
              >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Assets</p>
                  <p className="text-2xl font-bold text-primary">{stats.stats.assets}</p>
                </div>
                <FileText className="h-8 w-8 text-primary/70" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Users</p>
                  <p className="text-2xl font-bold text-success">{stats.stats.users}</p>
                </div>
                <Users className="h-8 w-8 text-success/70" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Departments</p>
                  <p className="text-2xl font-bold text-info">{stats.stats.departments}</p>
                </div>
                <Database className="h-8 w-8 text-info/70" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Audit Logs</p>
                  <p className="text-2xl font-bold text-warning">{stats.stats.auditLogs}</p>
                </div>
                <Activity className="h-8 w-8 text-warning/70" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Password Resets</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.stats.passwordResets}</p>
                </div>
                <Eye className="h-8 w-8 text-purple-600/70" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reset Requests</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.stats.passwordResetRequests}</p>
                </div>
                <Download className="h-8 w-8 text-orange-600/70" />
              </div>
              </Card>
            </motion.div>
          )}

          {/* Pending Password Reset Requests */}
        {stats && stats.pendingPasswordResets && stats.pendingPasswordResets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Pending Password Reset Requests</h2>
              <div className="space-y-3">
                {stats.pendingPasswordResets.map((request) => (
                  <div key={request._id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div>
                      <div className="font-medium text-foreground">{request.userId.name}</div>
                      <div className="text-sm text-muted-foreground">{request.userId.email} ({request.userId.role})</div>
                      <div className="text-sm text-muted-foreground mt-1">Reason: {request.reason}</div>
                      <div className="text-xs text-muted-foreground">Requested: {new Date(request.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approvePasswordReset(request._id)}>
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => rejectPasswordReset(request._id)}>
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Audit Logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Recent Audit Logs</h2>
              <div className="flex gap-2">
                <Button onClick={clearAuditLogs} variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Logs
                </Button>
                <Button onClick={exportAuditLogs} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export All Logs
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading audit logs...</p>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">No audit logs found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2 text-sm font-medium text-muted-foreground">Timestamp</th>
                      <th className="text-left p-2 text-sm font-medium text-muted-foreground">Action</th>
                      <th className="text-left p-2 text-sm font-medium text-muted-foreground">Entity</th>
                      <th className="text-left p-2 text-sm font-medium text-muted-foreground">User</th>
                      <th className="text-left p-2 text-sm font-medium text-muted-foreground">Officer</th>
                      <th className="text-left p-2 text-sm font-medium text-muted-foreground">Bill Info</th>
                      <th className="text-left p-2 text-sm font-medium text-muted-foreground">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log._id} className="border-b border-border/50 hover:bg-gray-50">
                        <td className="p-2 text-sm text-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-2">
                          <Badge
                            variant={
                              log.action === 'CREATE' ? 'default' :
                              log.action === 'UPDATE' ? 'secondary' : 'destructive'
                            }
                          >
                            {log.action}
                          </Badge>
                        </td>
                        <td className="p-2 text-sm text-foreground">{log.entityType}</td>
                        <td className="p-2">
                          <div>
                            <div className="text-sm font-medium text-foreground">{log.userId?.name || 'Unknown User'}</div>
                            <div className="text-xs text-muted-foreground">{log.userId?.email || 'No email'}</div>
                          </div>
                        </td>
                        <td className="p-2 text-sm text-foreground">
                          {log.action === 'DELETE' ? (log.officerName || 'N/A') : 'N/A'}
                        </td>
                        <td className="p-2 text-sm text-foreground">
                          {log.billInfo?.billNumber || 'N/A'}
                        </td>
                        <td className="p-2 text-sm text-foreground max-w-xs truncate" title={log.reason}>
                          {log.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            </Card>
          </motion.div>
          </>
        )}

        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <UserManagement />
          </motion.div>
        )}

        {activeTab === 'departments' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <DepartmentManagement />
          </motion.div>
        )}

        {activeTab === 'notifications' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <NotificationPanel />
          </motion.div>
        )}

        {activeTab === 'updates' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <UpdateAssetsPanel />
          </motion.div>
        )}

        {activeTab === 'announcements' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">Announcement Management</h2>
                <Button onClick={() => setShowAnnouncementDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Announcement
                </Button>
              </div>
              
              {loadingAnnouncements ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading announcements...</p>
                </div>
              ) : announcements.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">No announcements found</p>
                  <p className="text-sm text-muted-foreground">Create your first announcement to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement: any) => (
                    <div key={announcement._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-foreground">{announcement.title}</h3>
                            <Badge 
                              variant={
                                announcement.type === 'urgent' ? 'destructive' :
                                announcement.type === 'report_reminder' ? 'default' :
                                announcement.type === 'budget_release' ? 'secondary' : 'outline'
                              }
                            >
                              {announcement.type.replace('_', ' ').toUpperCase()}
                            </Badge>
                            {announcement.isActive ? (
                              <Badge variant="default">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{announcement.message}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Created: {new Date(announcement.createdAt).toLocaleDateString()}</span>
                            <span>Expires: {new Date(announcement.expiresAt).toLocaleDateString()}</span>
                            {announcement.targetDepartments && announcement.targetDepartments.length > 0 ? (
                              <span>Departments: {announcement.targetDepartments.map((dept: any) => dept.name).join(', ')}</span>
                            ) : (
                              <span>All Departments</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleAnnouncementStatus(announcement._id, !announcement.isActive)}
                          >
                            {announcement.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteAnnouncement(announcement._id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}
        <AnnouncementDialog
          open={showAnnouncementDialog}
          onOpenChange={setShowAnnouncementDialog}
          onSubmit={handleCreateAnnouncement}
        />
      </div>
    </div>
  );


}