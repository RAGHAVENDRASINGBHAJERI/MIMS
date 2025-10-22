import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/form-input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAssetFlow } from '@/context/AssetFlowContext';

interface AnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
}

export const AnnouncementDialog: React.FC<AnnouncementDialogProps> = ({
  open,
  onOpenChange,
  onSubmit
}) => {
  const { state } = useAssetFlow();
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'general',
    isGlobal: false,
    targetDepartments: [] as string[],
    expiresAt: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit(formData);
      setFormData({
        title: '',
        message: '',
        type: 'general',
        isGlobal: false,
        targetDepartments: [],
        expiresAt: ''
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating announcement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDepartmentChange = (departmentId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        targetDepartments: [...prev.targetDepartments, departmentId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        targetDepartments: prev.targetDepartments.filter(id => id !== departmentId)
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Announcement</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
          />

          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="report_reminder">Report Reminder</SelectItem>
                <SelectItem value="budget_release">Budget Release</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isGlobal"
              checked={formData.isGlobal}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isGlobal: !!checked }))}
            />
            <Label htmlFor="isGlobal">Send to all departments</Label>
          </div>

          {!formData.isGlobal && (
            <div className="space-y-2">
              <Label>Target Departments</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {state.departments.map((dept) => (
                  <div key={dept._id} className="flex items-center space-x-2">
                    <Checkbox
                      id={dept._id}
                      checked={formData.targetDepartments.includes(dept._id)}
                      onCheckedChange={(checked) => handleDepartmentChange(dept._id, !!checked)}
                    />
                    <Label htmlFor={dept._id}>{dept.name}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <FormInput
            label="Expires At (Optional)"
            type="datetime-local"
            value={formData.expiresAt}
            onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
          />

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Announcement'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};