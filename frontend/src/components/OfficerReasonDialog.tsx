import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/form-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface OfficerReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string, officerName: string) => void;
  title: string;
  description: string;
  confirmText: string;
  isLoading?: boolean;
}

export const OfficerReasonDialog: React.FC<OfficerReasonDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText,
  isLoading = false,
}) => {
  const [reason, setReason] = useState('');
  const [officerName, setOfficerName] = useState('');

  const handleConfirm = () => {
    if (reason.trim() && officerName.trim()) {
      onConfirm(reason.trim(), officerName.trim());
      setReason('');
      setOfficerName('');
    }
  };

  const handleCancel = () => {
    setReason('');
    setOfficerName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{description}</p>
          
          <div className="space-y-2">
            <Label htmlFor="officerName">Officer Name *</Label>
            <FormInput
              id="officerName"
              placeholder="Enter officer name"
              value={officerName}
              onChange={(e) => setOfficerName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for this action"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!reason.trim() || !officerName.trim() || isLoading}
            >
              {isLoading ? 'Processing...' : confirmText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};