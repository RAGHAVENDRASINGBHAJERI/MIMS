import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/form-input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { OfficerReasonDialog } from '@/components/OfficerReasonDialog';

const itemSchema = z.object({
  particulars: z.string().min(1, 'Particulars is required'),
  serialNumber: z.string().optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  rate: z.number().min(0, 'Rate must be positive'),
  cgst: z.number().min(0).max(100, 'CGST must be between 0-100'),
  sgst: z.number().min(0).max(100, 'SGST must be between 0-100'),
});

type ItemFormValues = z.infer<typeof itemSchema>;

interface Item {
  particulars: string;
  serialNumber?: string;
  quantity: number;
  rate: number;
  cgst: number;
  sgst: number;
  amount: number;
  grandTotal: number;
}

interface ItemEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null;
  itemIndex: number;
  assetId: string;
  onItemUpdate: (assetId: string, itemIndex: number, updatedItem: Item, reason: string, officerName: string) => Promise<void>;
  onItemDelete: (assetId: string, itemIndex: number, reason: string, officerName: string) => Promise<void>;
}

export function ItemEditDialog({
  open,
  onOpenChange,
  item,
  itemIndex,
  assetId,
  onItemUpdate,
  onItemDelete
}: ItemEditDialogProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showUpdateReasonDialog, setShowUpdateReasonDialog] = useState(false);
  const [showDeleteReasonDialog, setShowDeleteReasonDialog] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset: resetForm,
    formState: { errors }
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
  });

  // Reset form when item changes
  React.useEffect(() => {
    if (item) {
      resetForm({
        particulars: item.particulars,
        serialNumber: item.serialNumber || '',
        quantity: item.quantity,
        rate: item.rate,
        cgst: item.cgst,
        sgst: item.sgst,
      });
    }
  }, [item, resetForm]);

  const watchedValues = watch();

  // Calculate amounts based on form values
  const calculateAmounts = (values: ItemFormValues) => {
    const quantity = values.quantity || 0;
    const rate = values.rate || 0;
    const cgst = values.cgst || 0;
    const sgst = values.sgst || 0;
    
    const amount = quantity * rate;
    const cgstAmount = (amount * cgst) / 100;
    const sgstAmount = (amount * sgst) / 100;
    const grandTotal = amount + cgstAmount + sgstAmount;
    
    return {
      amount,
      grandTotal
    };
  };

  const { amount, grandTotal } = calculateAmounts(watchedValues || {});

  const handleUpdateClick = () => {
    setShowUpdateReasonDialog(true);
  };

  const handleDeleteClick = () => {
    setShowDeleteReasonDialog(true);
  };

  const handleUpdateItem = async (reason: string, officerName: string) => {
    if (!item) return;

    setIsUpdating(true);
    try {
      const { amount: calcAmount, grandTotal: calcGrandTotal } = calculateAmounts(watchedValues);
      
      const updatedItem: Item = {
        ...watchedValues,
        amount: calcAmount,
        grandTotal: calcGrandTotal
      };

      // Submit update request instead of direct update
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/assets/${assetId}/request-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({
          requestedFields: ['items'],
          tempValues: {
            itemIndex,
            updatedItem,
            reason,
            officerName
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit update request');
      }
      
      setShowUpdateReasonDialog(false);
      onOpenChange(false);
      
      toast({
        title: 'Success',
        description: 'Item update request submitted for admin approval',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit update request',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteItem = async (reason: string, officerName: string) => {
    try {
      // Submit delete request instead of direct delete
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/assets/${assetId}/request-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({
          requestedFields: ['deleteItem'],
          tempValues: {
            itemIndex,
            action: 'delete',
            reason,
            officerName
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit delete request');
      }
      
      setShowDeleteReasonDialog(false);
      onOpenChange(false);
      
      toast({
        title: 'Success',
        description: 'Item delete request submitted for admin approval',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit delete request',
        variant: 'destructive',
      });
    }
  };

  if (!item) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <FormInput
              label="Particulars"
              {...register('particulars')}
              error={errors.particulars?.message}
            />
            
            <div>
              <Label htmlFor="serialNumber">Serial Numbers (optional)</Label>
              <div className="mt-1 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Array.from({ length: watchedValues.quantity || 1 }, (_, idx) => {
                    const serialNumbers = (watchedValues.serialNumber || '').split('\n').filter(s => s.trim());
                    return (
                      <FormInput
                        key={idx}
                        placeholder={`Serial ${idx + 1}`}
                        value={serialNumbers[idx] || ''}
                        onChange={(e) => {
                          const newSerials = [...Array(watchedValues.quantity || 1)].map((_, i) => serialNumbers[i] || '');
                          newSerials[idx] = e.target.value.trim();
                          setValue('serialNumber', newSerials.filter(s => s.trim()).join('\n'));
                        }}
                      />
                    );
                  })}
                </div>
                {watchedValues.quantity && (
                  <p className="text-sm text-gray-600">
                    Serial numbers: {(watchedValues.serialNumber || '').split('\n').filter(s => s.trim()).length}/{watchedValues.quantity}
                  </p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Quantity"
                type="number"
                {...register('quantity', { valueAsNumber: true })}
                error={errors.quantity?.message}
              />
              
              <FormInput
                label="Rate (₹)"
                type="number"
                step="0.01"
                {...register('rate', { valueAsNumber: true })}
                error={errors.rate?.message}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="CGST (%)"
                type="number"
                step="0.01"
                {...register('cgst', { valueAsNumber: true })}
                error={errors.cgst?.message}
              />
              
              <FormInput
                label="SGST (%)"
                type="number"
                step="0.01"
                {...register('sgst', { valueAsNumber: true })}
                error={errors.sgst?.message}
              />
            </div>
            
            {/* Calculated Values Display */}
            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Amount:</span>
                <span>₹{amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Grand Total:</span>
                <span>₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="flex justify-between pt-4">
              <Button
                variant="destructive"
                onClick={handleDeleteClick}
                disabled={isUpdating}
              >
                Delete Item
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateClick}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Updating...' : 'Update Item'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <OfficerReasonDialog
        open={showUpdateReasonDialog}
        onOpenChange={setShowUpdateReasonDialog}
        onConfirm={handleUpdateItem}
        title="Update Item"
        description="Please provide officer name and reason for updating this item:"
        confirmText="Update"
        isLoading={isUpdating}
      />

      <OfficerReasonDialog
        open={showDeleteReasonDialog}
        onOpenChange={setShowDeleteReasonDialog}
        onConfirm={handleDeleteItem}
        title="Delete Item"
        description="Please provide officer name and reason for deleting this item:"
        confirmText="Delete"
      />
    </>
  );
}