import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/form-input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, LogIn, UserPlus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PasswordResetDialog } from '@/components/PasswordResetDialog';
import api from '@/services/api';

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.1,
      duration: 0.6,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  hover: { scale: 1.02 },
};

const logoVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { scale: 1, opacity: 1 },
};

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  // Redirect to intended page or dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else {
        // Default redirect based on user role
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (userData.role === 'admin') {
          navigate('/admin-dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    }
  }, [isAuthenticated, navigate, location.state]);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      // Use the API service for consistency
      const response = await api.post('/api/auth/login', data);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Login failed');
      }
      
      const { token, ...userData } = response.data.data;
      
      // Use the AuthContext login method
      login(userData, token);
      
      toast({
        title: 'Welcome back!',
        description: `Successfully logged in as ${userData.name}`,
        duration: 2000,
      });

      // Delay navigation to show toast
      setTimeout(() => {
        if (userData.role === 'admin') {
          navigate('/admin-dashboard', { replace: true });
        } else if (userData.role === 'chief-administrative-officer') {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }, 1000);
    } catch (error: any) {
      // Extract error message from axios error response
      let errorMessage = 'Login failed';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-md"
      >
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-6 sm:p-8 bg-white/90 backdrop-blur-sm shadow-xl border-0 w-full max-w-md">
            <motion.div
              className="text-center mb-8"
              variants={logoVariants}
            >
              <motion.h1
                className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Material Inward Management
              </motion.h1>
              <motion.p
                className="text-sm sm:text-base text-gray-600"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                Material Inward Management System
              </motion.p>
            </motion.div>

            <motion.form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4 sm:space-y-6"
              variants={containerVariants}
            >
              <motion.div variants={itemVariants}>
                <FormInput
                  label="Email"
                  type="email"
                  required
                  {...register('email')}
                  error={errors.email?.message}
                  style={{ textTransform: 'none' }}
                  autoComplete="off"
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <FormInput
                  label="Password"
                  type="password"
                  required
                  {...register('password')}
                  error={errors.password?.message}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <motion.div
                        className="flex items-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.div
                          className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        Signing In...
                      </motion.div>
                    ) : (
                      <motion.div
                        className="flex items-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </motion.div>
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            </motion.form>

            <motion.div
              className="mt-6 text-center space-y-2"
              variants={itemVariants}
            >
              <p className="text-gray-600">
                Don't have an account?{' '}
                <span className="text-blue-600 font-medium">
                  Contact your admin to create an account
                </span>
              </p>
              <p className="text-gray-600">
                Forgot your password?{' '}
                <motion.button
                  onClick={() => setShowPasswordReset(true)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Reset password
                </motion.button>
              </p>
            </motion.div>

            <motion.div
              className="mt-4 text-center"
              variants={itemVariants}
            >
              <motion.button
                onClick={() => navigate('/')}
                className="text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Dashboard
              </motion.button>
            </motion.div>
          </Card>
        </motion.div>
        
        <PasswordResetDialog
          open={showPasswordReset}
          onOpenChange={setShowPasswordReset}
        />
      </motion.div>
    </div>
  );
}
