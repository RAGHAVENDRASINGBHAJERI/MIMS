import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/form-input';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Edit, Trash2 } from 'lucide-react';
import api from '@/services/api';

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['department-officer', 'chief-administrative-officer']),
  department: z.string().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  department?: { _id: string; name: string };
}

interface Department {
  _id: string;
  name: string;
}

export default function UserManagement() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
  });

  const selectedRole = watch('role');

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/admin/all-users');
      setUsers(response.data.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/api/departments');
      setDepartments(response.data.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch departments',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (data: UserFormValues) => {
    setIsLoading(true);
    try {
      if (editingUser) {
        await api.put(`/api/admin/users/${editingUser._id}`, data);
        toast({
          title: 'Success',
          description: 'User updated successfully',
        });
      } else {
        await api.post('/api/auth/register', data);
        toast({
          title: 'Success',
          description: 'User created successfully',
        });
      }
      
      reset();
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Operation failed',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    reset({
      name: user.name,
      email: user.email,
      role: user.role as any,
      department: user.department?._id || '',
      password: '', // Don't pre-fill password
    });
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await api.delete(`/api/admin/users/${userId}`);
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const cancelEdit = () => {
    setEditingUser(null);
    reset();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <UserPlus className="w-5 h-5 mr-2" />
          {editingUser ? 'Edit User' : 'Create New User'}
        </h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            
            <FormInput
              label="Password"
              type="password"
              {...register('password')}
              error={errors.password?.message}
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                {...register('role')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Role</option>
                <option value="department-officer">Department Officer</option>
                <option value="chief-administrative-officer">Chief Administrative Officer</option>
              </select>
              {errors.role && (
                <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>
              )}
            </div>
            
            {selectedRole === 'department-officer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  {...register('department')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Processing...' : editingUser ? 'Update User' : 'Create User'}
            </Button>
            {editingUser && (
              <Button type="button" variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Existing Users</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Role</th>
                <th className="text-left p-2">Department</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{user.name}</td>
                  <td className="p-2">{user.email}</td>
                  <td className="p-2 capitalize">{user.role.replace('-', ' ')}</td>
                  <td className="p-2">{user.department?.name || 'N/A'}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(user._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}