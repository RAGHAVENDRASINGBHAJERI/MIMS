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
import { ArrowLeft, UserPlus, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createAdmin } from '@/services/authService';

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

const createAdminSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type CreateAdminFormValues = z.infer<typeof createAdminSchema>;

export default function CreateAdmin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<CreateAdminFormValues>({
    resolver: zodResolver(createAdminSchema),
  });

  const onSubmit = async (data: CreateAdminFormValues) => {
    setIsLoading(true);
    try {
      console.log('Attempting to create admin with data:', { name: data.name, email: data.email });

      const result = await createAdmin(data.name, data.email, data.password);
      console.log('Create admin response:', result);

      // Auto-login after successful admin creation
      const { token, ...userData } = result.data;
      login(userData, token);

      toast({
        title: 'Admin Created!',
        description: `Welcome ${userData.name}! You are now the system administrator.`,
        duration: 5000,
      });

      navigate('/admin');
    } catch (error: any) {
      console.error('Create admin error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create admin account',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
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
          <Card className="p-8 bg-white/90 backdrop-blur-sm shadow-xl border-0">
            <motion.div
              className="text-center mb-8"
              variants={logoVariants}
            >
              <motion.div
                className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Shield className="w-8 h-8 text-white" />
              </motion.div>
              <motion.h1
                className="text-3xl font-bold text-gray-900 mb-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Create System Admin
              </motion.h1>
              <motion.p
                className="text-gray-600"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                Set up the first administrator account for AssetFlow
              </motion.p>
            </motion.div>

            <motion.form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
              variants={containerVariants}
            >
              <motion.div variants={itemVariants}>
                <FormInput
                  label="Full Name"
                  type="text"
                  required
                  {...register('name')}
                  error={errors.name?.message}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <FormInput
                  label="Email Address"
                  type="email"
                  required
                  {...register('email')}
                  error={errors.email?.message}
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
                <FormInput
                  label="Confirm Password"
                  type="password"
                  required
                  {...register('confirmPassword')}
                  error={errors.confirmPassword?.message}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
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
                        Creating Admin...
                      </motion.div>
                    ) : (
                      <motion.div
                        className="flex items-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create Administrator
                      </motion.div>
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            </motion.form>

            <motion.div
              className="mt-6 text-center"
              variants={itemVariants}
            >
              <motion.button
                onClick={() => navigate('/')}
                className="text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Landing
              </motion.button>
            </motion.div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
