import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/form-input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface ItemUpdateRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any;
  itemIndex: number;
  assetId: string;
  onRequestSubmitted: () => void;
}

export function ItemUpdateRequestDialog({ 
  open, 
  onOpenChange, 
  item, 
  itemIndex, 
  assetId, 
  onRequestSubmitted 
}: ItemUpdateRequestDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatedItem, setUpdatedItem] = useState({
    particulars: item?.particulars || '',
    quantity: item?.quantity || 0,
    rate: item?.rate || 0,
    cgst: item?.cgst || 0,
    sgst: item?.sgst || 0
  });

  const calculateAmounts = () => {
    const amount = updatedItem.quantity * updatedItem.rate;
    const cgstAmount = (amount * updatedItem.cgst) / 100;
    const sgstAmount = (amount * updatedItem.sgst) / 100;
    const grandTotal = amount + cgstAmount + sgstAmount;
    return { amount, grandTotal };
  };

  const { amount, grandTotal } = calculateAmounts();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { amount: calcAmount, grandTotal: calcGrandTotal } = calculateAmounts();
      
      const finalItem = {
        ...updatedItem,
        amount: calcAmount,
        grandTotal: calcGrandTotal
      };

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/assets/${assetId}/request-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({
          requestedFields: ['singleItem'],
          tempValues: {
            itemIndex,
            updatedItem: finalItem,
            action: 'update'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit update request');
      }

      toast({
        title: 'Success',
        description: 'Item update request submitted for admin approval'
      });

      onRequestSubmitted();
      onOpenChange(false);
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

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/assets/${assetId}/request-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({
          requestedFields: ['singleItem'],
          tempValues: {
            itemIndex,
            action: 'delete'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit delete request');
      }

      toast({
        title: 'Success',
        description: 'Item delete request submitted for admin approval'
      });

      onRequestSubmitted();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit delete request',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Item Update</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Particulars</Label>
            <FormInput
              value={updatedItem.particulars}
              onChange={(e) => setUpdatedItem({ ...updatedItem, particulars: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Quantity</Label>
              <FormInput
                type="number"
                value={updatedItem.quantity}
                onChange={(e) => setUpdatedItem({ ...updatedItem, quantity: Number(e.target.value) || 0 })}
              />
            </div>
            
            <div>
              <Label>Rate (₹)</Label>
              <FormInput
                type="number"
                step="0.01"
                value={updatedItem.rate}
                onChange={(e) => setUpdatedItem({ ...updatedItem, rate: Number(e.target.value) || 0 })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>CGST (%)</Label>
              <FormInput
                type="number"
                step="0.01"
                value={updatedItem.cgst}
                onChange={(e) => setUpdatedItem({ ...updatedItem, cgst: Number(e.target.value) || 0 })}
              />
            </div>
            
            <div>
              <Label>SGST (%)</Label>
              <FormInput
                type="number"
                step="0.01"
                value={updatedItem.sgst}
                onChange={(e) => setUpdatedItem({ ...updatedItem, sgst: Number(e.target.value) || 0 })}
              />
            </div>
          </div>
          
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
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              Request Delete
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Request Update'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}