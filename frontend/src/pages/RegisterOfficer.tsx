import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/form-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader } from '@/components/ui/loader';
import { useAssetFlow } from '@/context/AssetFlowContext';
import { departmentService } from '@/services/departmentService';
import { createUser } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Shield } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  hover: { scale: 1.05 },
};

export default function RegisterOfficer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state, dispatch } = useAssetFlow();
  const { isAdmin } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Redirect if not admin
    if (!isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'Only admins can register department officers',
        variant: 'destructive',
      });
      navigate('/dashboard');
      return;
    }

    // Fetch departments
    const fetchDepartments = async () => {
      try {
        const departments = await departmentService.getAllDepartments();
        dispatch({ type: 'SET_DEPARTMENTS', payload: departments });
      } catch (error) {
        console.error('Failed to load departments:', error);
        toast({
          title: 'Error',
          description: 'Failed to load departments. Please ensure backend is running.',
          variant: 'destructive',
        });
      }
    };

    fetchDepartments();
  }, [dispatch, toast, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password || !formData.department) {
      toast({
        title: 'Error',
        description: 'All fields are required',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await createUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: 'department-officer',
        department: formData.department,
      });

      toast({
        title: 'Success',
        description: 'Department officer registered successfully',
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        department: '',
      });
    } catch (error: any) {
      console.error('Error registering officer:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to register department officer',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-info/5 p-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="mb-6"
        >
          <motion.div variants={itemVariants}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </motion.div>
          </motion.div>

          <motion.div className="flex items-center gap-3 mb-2" variants={itemVariants}>
            <div className="p-2 bg-primary/10 rounded-lg">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Register Department Officer</h1>
              <p className="text-muted-foreground">Create a new department officer account</p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          transition={{ delay: 0.1 }}
        >
          <motion.div variants={itemVariants}>
            <Card className="p-8 bg-gradient-card shadow-card">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-2 mb-6">
                  <Shield className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Officer Details</h2>
                </div>

                <FormInput
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter officer's full name"
                  required
                />

                <FormInput
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter officer's email"
                  required
                />

                <FormInput
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter a secure password"
                  required
                />

                <div className="space-y-2">
                  <Label>Department *</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => handleInputChange('department', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {(state.departments || []).map((dept) => (
                        <SelectItem key={dept._id} value={dept._id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Department officers can only manage assets for their assigned department.
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <Loader size="sm" text="Registering..." />
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Register Officer
                        </>
                      )}
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/admin')}
                    >
                      Cancel
                    </Button>
                  </motion.div>
                </div>
              </form>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
