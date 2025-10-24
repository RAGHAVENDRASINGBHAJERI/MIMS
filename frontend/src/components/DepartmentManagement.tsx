import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { departmentService, Department } from '@/services/departmentService';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FormInput } from '@/components/ui/form-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DepartmentFormData {
  name: string;
  type: 'Major' | 'Academic' | 'Service';
}

export default function DepartmentManagement() {
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: '',
    type: 'Major'
  });

  const fetchDepartments = async () => {
    try {
      const data = await departmentService.getAllDepartments();
      setDepartments(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch departments',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Department name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingDepartment) {
        await departmentService.updateDepartment(editingDepartment._id, formData);
        toast({
          title: 'Success',
          description: 'Department updated successfully',
        });
      } else {
        await departmentService.createDepartment(formData);
        toast({
          title: 'Success',
          description: 'Department created successfully',
        });
      }
      
      setIsDialogOpen(false);
      setEditingDepartment(null);
      setFormData({ name: '', type: 'Major' });
      fetchDepartments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save department',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      type: department.type
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return;

    try {
      await departmentService.deleteDepartment(id);
      toast({
        title: 'Success',
        description: 'Department deleted successfully',
      });
      fetchDepartments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete department',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', type: 'Major' });
    setEditingDepartment(null);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Major': return 'default';
      case 'Academic': return 'secondary';
      case 'Service': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Department Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDepartment ? 'Edit Department' : 'Create New Department'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Department Name</Label>
                <FormInput
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter department name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Department Type</Label>
                <Select value={formData.type} onValueChange={(value: 'Major' | 'Academic' | 'Service') => 
                  setFormData({ ...formData, type: value })
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Major">Major</SelectItem>
                    <SelectItem value="Academic">Academic</SelectItem>
                    <SelectItem value="Service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingDepartment ? 'Update' : 'Create'} Department
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading departments...</p>
        </div>
      ) : departments.length === 0 ? (
        <div className="text-center py-8">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-2 text-muted-foreground">No departments found</p>
          <p className="text-sm text-muted-foreground">Create your first department to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((department) => (
            <motion.div
              key={department._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">{department.name}</h3>
                  <Badge variant={getTypeColor(department.type)}>
                    {department.type}
                  </Badge>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mb-3">
                Created: {new Date(department.createdAt).toLocaleDateString()}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(department)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(department._id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Card>
  );
}