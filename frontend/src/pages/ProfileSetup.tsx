import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/form-input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Save, Lock, AlertCircle } from 'lucide-react';
import api from '@/services/api';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'Password must be at least 6 characters').optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    }
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    try {
      const updateData: any = {
        name: data.name,
        email: data.email,
      };

      // Only admins can change passwords directly
      if (data.newPassword && data.currentPassword && user?.role === 'admin') {
        updateData.currentPassword = data.currentPassword;
        updateData.newPassword = data.newPassword;
      }

      const response = await api.put('/api/auth/profile', updateData);
      
      if (response.data.success) {
        // Update user context if user data changed
        if (response.data.data) {
          const { token, ...userData } = response.data.data;
          if (token) {
            login(userData, token);
          }
        }

        toast({
          title: 'Success',
          description: 'Profile updated successfully',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const requestPasswordReset = async () => {
    setIsLoading(true);
    try {
      await api.post('/api/auth/request-password-reset', { email: user?.email });
      toast({
        title: 'Success',
        description: 'Password reset request submitted. Admin will review your request.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to request password reset',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-info/5 p-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Profile Setup</h1>
              <p className="text-muted-foreground">Manage your account information</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Name"
                  {...register('name')}
                  error={errors.name?.message}
                />
                
                <FormInput
                  label="Email"
                  type="email"
                  {...register('email')}
                  error={errors.email?.message}
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Password Management</h3>
                {user?.role === 'admin' ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormInput
                      label="Current Password"
                      type="password"
                      {...register('currentPassword')}
                      error={errors.currentPassword?.message}
                      placeholder="Leave blank to keep current password"
                    />
                    
                    <FormInput
                      label="New Password"
                      type="password"
                      {...register('newPassword')}
                      error={errors.newPassword?.message}
                      placeholder="Enter new password"
                    />
                    
                    <FormInput
                      label="Confirm New Password"
                      type="password"
                      {...register('confirmPassword')}
                      error={errors.confirmPassword?.message}
                      placeholder="Confirm new password"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Password Reset Request</p>
                        <p className="text-sm text-blue-700 mt-1">
                          As a department officer, you need to request password changes through an admin.
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={requestPasswordReset}
                      disabled={isLoading}
                      variant="outline"
                      className="w-full"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Request Password Reset
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Profile
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}