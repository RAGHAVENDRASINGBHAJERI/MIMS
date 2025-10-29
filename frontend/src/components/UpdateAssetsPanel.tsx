import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Eye, Check, X, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormInput } from '@/components/ui/form-input';
import { Label } from '@/components/ui/label';

interface PendingUpdate {
  _id: string;
  billNo: string;
  department: { name: string };
  requestedBy: { name: string; email: string };
  requestedAt: string;
  requestedFields: string[];
  tempValues: any;
  updateRequestStatus: string;
  currentValues?: Record<string, string>;
  newValues?: Record<string, string>;
}

export function UpdateAssetsPanel() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pendingUpdates, setPendingUpdates] = useState<PendingUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUpdate, setSelectedUpdate] = useState<PendingUpdate | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [adminRemarks, setAdminRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchPendingUpdates = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/assets/pending-updates`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch pending updates');
      }

      const data = await response.json();
      console.log('Pending updates response:', data);
      setPendingUpdates(data.data || []);
    } catch (error) {
      console.error('Error fetching pending updates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending updates',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUpdates();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingUpdates, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (updateId: string) => {
    setIsProcessing(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/assets/${updateId}/approve-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({ adminRemarks })
      });

      if (!response.ok) {
        throw new Error('Failed to approve update');
      }

      toast({
        title: 'Success',
        description: 'Update request approved successfully'
      });

      setShowReviewDialog(false);
      setAdminRemarks('');
      fetchPendingUpdates();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve update',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (updateId: string) => {
    setIsProcessing(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/assets/${updateId}/reject-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({ adminRemarks })
      });

      if (!response.ok) {
        throw new Error('Failed to reject update');
      }

      toast({
        title: 'Success',
        description: 'Update request rejected'
      });

      setShowReviewDialog(false);
      setAdminRemarks('');
      fetchPendingUpdates();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject update',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openReviewDialog = (update: PendingUpdate) => {
    setSelectedUpdate(update);
    setShowReviewDialog(true);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-muted-foreground">Loading pending updates...</div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Update Assets</h3>
          <Badge variant="secondary">
            {pendingUpdates.length} pending
          </Badge>
        </div>

        {pendingUpdates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No pending update requests
          </div>
        ) : (
          <div className="space-y-4">
            {pendingUpdates.map((update) => (
              <div key={update._id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-medium">Bill #{update.billNo}</div>
                    <div className="text-sm text-muted-foreground">
                      Department: {update.department.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Requested by: {update.requestedBy.name} ({update.requestedBy.email})
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Requested: {new Date(update.requestedAt).toLocaleDateString()}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {update.requestedFields.map((field) => (
                        <Badge key={field} variant="outline" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openReviewDialog(update)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Update Request - Bill #{selectedUpdate?.billNo}</DialogTitle>
          </DialogHeader>
          
          {selectedUpdate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="font-medium">Requested by:</Label>
                  <div>{selectedUpdate.requestedBy.name}</div>
                </div>
                <div>
                  <Label className="font-medium">Department:</Label>
                  <div>{selectedUpdate.department.name}</div>
                </div>
                <div>
                  <Label className="font-medium">Requested on:</Label>
                  <div>{new Date(selectedUpdate.requestedAt).toLocaleString()}</div>
                </div>
              </div>

              <div>
                <Label className="font-medium">Requested Changes:</Label>
                <div className="mt-2 space-y-3">
                  {selectedUpdate.requestedFields.map((field) => (
                    <div key={field} className="border rounded p-3">
                      <div className="font-medium text-sm mb-2">{field}</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs font-medium text-red-600">Previous Value:</Label>
                          <div className="text-sm bg-red-50 p-2 rounded mt-1">
                            {selectedUpdate.currentValues?.[field] || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-green-600">New Value:</Label>
                          <div className="text-sm bg-green-50 p-2 rounded mt-1">
                            {selectedUpdate.newValues?.[field] || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="adminRemarks">Admin Remarks</Label>
                <textarea
                  id="adminRemarks"
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder="Add remarks for approval/rejection..."
                  className="w-full p-2 border rounded-md min-h-[80px] resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowReviewDialog(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReject(selectedUpdate._id)}
                  disabled={isProcessing}
                >
                  <X className="h-4 w-4 mr-1" />
                  {isProcessing ? 'Processing...' : 'Reject'}
                </Button>
                <Button
                  onClick={() => handleApprove(selectedUpdate._id)}
                  disabled={isProcessing}
                >
                  <Check className="h-4 w-4 mr-1" />
                  {isProcessing ? 'Processing...' : 'Approve'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}