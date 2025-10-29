import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/form-input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAssetFlow } from '@/context/AssetFlowContext';
import { useToast } from '@/hooks/use-toast';

interface UpdateRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: any;
  onRequestSubmitted: () => void;
}

export function UpdateRequestDialog({ open, onOpenChange, asset, onRequestSubmitted }: UpdateRequestDialogProps) {
  const { state } = useAssetFlow();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestedFields, setRequestedFields] = useState<string[]>([]);
  const [tempValues, setTempValues] = useState<any>({});

  const fieldOptions = [
    { id: 'items', label: 'Items (Multi-item updates)' },
    { id: 'vendorName', label: 'Vendor Name' },
    { id: 'vendorAddress', label: 'Vendor Address' },
    { id: 'contactNumber', label: 'Contact Number' },
    { id: 'email', label: 'Email' },
    { id: 'billNo', label: 'Bill Number' },
    { id: 'billDate', label: 'Bill Date' },
    { id: 'type', label: 'Asset Type' },
    { id: 'collegeISRNo', label: 'College ISR No' },
    { id: 'itISRNo', label: 'IT ISR No' },
    { id: 'remark', label: 'Remark' },
    { id: 'billFile', label: 'Bill File' }
  ];

  const handleFieldToggle = (fieldId: string, checked: boolean) => {
    if (checked) {
      setRequestedFields([...requestedFields, fieldId]);
      if (fieldId === 'items') {
        setTempValues({ ...tempValues, [fieldId]: asset.items || [] });
      } else {
        setTempValues({ ...tempValues, [fieldId]: asset[fieldId] || '' });
      }
    } else {
      setRequestedFields(requestedFields.filter(f => f !== fieldId));
      const newTempValues = { ...tempValues };
      delete newTempValues[fieldId];
      setTempValues(newTempValues);
    }
  };

  const handleValueChange = (fieldId: string, value: any) => {
    setTempValues({ ...tempValues, [fieldId]: value });
  };

  const handleSubmit = async () => {
    if (requestedFields.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one field to update',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/assets/${asset._id}/request-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({
          requestedFields,
          tempValues
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit update request');
      }

      toast({
        title: 'Success',
        description: 'Update request submitted successfully'
      });

      onRequestSubmitted();
      onOpenChange(false);
      setRequestedFields([]);
      setTempValues({});
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit update request',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFieldInput = (fieldId: string) => {
    const currentValue = tempValues[fieldId] || '';

    switch (fieldId) {

      case 'type':
        return (
          <Select value={currentValue} onValueChange={(value) => handleValueChange(fieldId, value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="capital">Capital</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
            </SelectContent>
          </Select>
        );
      case 'billDate':
        return (
          <FormInput
            type="date"
            value={currentValue ? new Date(currentValue).toISOString().split('T')[0] : ''}
            onChange={(e) => handleValueChange(fieldId, e.target.value)}
          />
        );

      case 'items':
        const items = Array.isArray(tempValues[fieldId]) ? tempValues[fieldId] : [];
        return (
          <div className="space-y-2">
            {items.map((item: any, index: number) => (
              <div key={index} className="border p-3 rounded">
                <div className="text-xs text-muted-foreground mb-2">Item {index + 1}</div>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Particulars</Label>
                    <FormInput
                      value={String(item.particulars || '')}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index] = { ...newItems[index], particulars: e.target.value };
                        handleValueChange(fieldId, newItems);
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Quantity</Label>
                      <FormInput
                        type="number"
                        value={String(item.quantity || '')}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index] = { ...newItems[index], quantity: Number(e.target.value) || 0 };
                          handleValueChange(fieldId, newItems);
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Rate (₹)</Label>
                      <FormInput
                        type="number"
                        value={String(item.rate || '')}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index] = { ...newItems[index], rate: Number(e.target.value) || 0 };
                          handleValueChange(fieldId, newItems);
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">CGST (%)</Label>
                      <FormInput
                        type="number"
                        value={String(item.cgst || '')}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index] = { ...newItems[index], cgst: Number(e.target.value) || 0 };
                          handleValueChange(fieldId, newItems);
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">SGST (%)</Label>
                      <FormInput
                        type="number"
                        value={String(item.sgst || '')}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index] = { ...newItems[index], sgst: Number(e.target.value) || 0 };
                          handleValueChange(fieldId, newItems);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      case 'billFile':
        return (
          <div className="space-y-2">
            {asset.billFileId && (
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <span className="text-xs text-muted-foreground">Current bill:</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                      const token = sessionStorage.getItem('token');
                      const response = await fetch(`${API_URL}/api/assets/${asset._id}/preview`, {
                        headers: {
                          'Authorization': `Bearer ${token}`
                        }
                      });
                      if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        window.open(url, '_blank');
                        window.URL.revokeObjectURL(url);
                      }
                    } catch (error) {
                      console.error('Failed to preview bill:', error);
                    }
                  }}
                  className="h-6 text-xs"
                >
                  View Current Bill
                </Button>
              </div>
            )}
            <FormInput
              type="file"
              accept=".pdf"
              onChange={(e) => handleValueChange(fieldId, e.target.files?.[0])}
            />
          </div>
        );
      default:
        return (
          <FormInput
            value={currentValue}
            onChange={(e) => handleValueChange(fieldId, e.target.value)}
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Asset Update - Bill #{asset?.billNo}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select the fields you want to update and provide the new values. Your request will be sent to admin for approval.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fieldOptions.map((field) => (
              <div key={field.id} className="space-y-2 p-4 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={field.id}
                    checked={requestedFields.includes(field.id)}
                    onCheckedChange={(checked) => handleFieldToggle(field.id, checked as boolean)}
                  />
                  <Label htmlFor={field.id} className="font-medium">
                    {field.label}
                  </Label>
                </div>
                
                {requestedFields.includes(field.id) && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Current: {field.id === 'items' ? `${(asset.items || []).length} items` : 
                               field.id === 'billFile' ? (asset.billFileId ? 'Bill file exists' : 'No bill file') :
                               typeof asset[field.id] === 'object' ? 'N/A' : (asset[field.id] || 'N/A')}
                    </Label>
                    <div>
                      {renderFieldInput(field.id)}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}