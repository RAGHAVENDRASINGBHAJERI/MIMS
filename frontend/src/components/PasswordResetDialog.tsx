import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/form-input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface PasswordResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PasswordResetDialog({ open, onOpenChange }: PasswordResetDialogProps) {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleRequestReset = async () => {
    if (!email || !reason) return;

    setIsLoading(true);
    try {
      const API_URL = 'https://mims-1.onrender.com';
      const response = await fetch(`${API_URL}/api/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, reason }),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.token) {
          // Admin user - immediate token
          setToken(result.token);
          setStep('reset');
          toast({
            title: 'Success',
            description: 'Password reset token generated.',
          });
        } else {
          // Officer - needs approval
          toast({
            title: 'Request Submitted',
            description: 'Your password reset request has been submitted for admin approval.',
          });
          onOpenChange(false);
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to request password reset',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!token || !newPassword || newPassword !== confirmPassword) return;

    setIsLoading(true);
    try {
      const API_URL = 'https://mims-1.onrender.com';
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Password reset successfully. You can now login with your new password.',
        });
        onOpenChange(false);
        setStep('request');
        setEmail('');
        setToken('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'request' ? 'Request Password Reset' : 'Reset Password'}
          </DialogTitle>
        </DialogHeader>

        {step === 'request' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <FormInput
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Password Reset *</Label>
              <FormInput
                id="reason"
                placeholder="Please provide a reason for password reset"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleRequestReset} disabled={!email || !reason || isLoading}>
                {isLoading ? 'Requesting...' : 'Request Reset'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Reset Token</Label>
              <FormInput
                id="token"
                placeholder="Enter reset token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Token: {token} (In production, this would be sent to your email)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <FormInput
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <FormInput
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setStep('request')}>
                Back
              </Button>
              <Button 
                onClick={handleResetPassword} 
                disabled={!token || !newPassword || newPassword !== confirmPassword || isLoading}
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}