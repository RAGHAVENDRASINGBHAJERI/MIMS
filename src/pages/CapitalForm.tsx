import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/form-input';
import { UploadField } from '@/components/ui/upload-field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader } from '@/components/ui/loader';
import { useAssetFlow } from '@/context/AssetFlowContext';
import { departmentService } from '@/services/departmentService';
import { categoryService } from '@/services/categoryService';
import { assetService, type AssetFormData } from '@/services/assetService';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const assetSchema = z.object({
  itemName: z.string().min(1, 'Item name is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  pricePerItem: z.number().min(0, 'Price must be positive'),
  vendorName: z.string().min(1, 'Vendor name is required'),
  vendorAddress: z.string().min(1, 'Vendor address is required'),
  contactNumber: z.string().min(10, 'Contact number must be at least 10 digits'),
  email: z.string().email('Invalid email address'),
  billNo: z.string().min(1, 'Bill number is required'),
  billDate: z.string().min(1, 'Bill date is required'),
  departmentId: z.string().min(1, 'Department is required'),
  categoryId: z.string().min(1, 'Category is required'),
});

type AssetFormValues = z.infer<typeof assetSchema>;

export default function CapitalForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state, dispatch } = useAssetFlow();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
  });

  const quantity = watch('quantity') || 0;
  const pricePerItem = watch('pricePerItem') || 0;
  const totalAmount = quantity * pricePerItem;

  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const [departments, categories] = await Promise.all([
          departmentService.getAllDepartments(),
          categoryService.getAllCategories('capital'),
        ]);
        dispatch({ type: 'SET_DEPARTMENTS', payload: departments });
        dispatch({ type: 'SET_CATEGORIES', payload: categories });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load data',
          variant: 'destructive',
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    fetchData();
  }, [dispatch, toast]);

  const onSubmit = async (data: AssetFormValues) => {
    setIsSubmitting(true);
    try {
      const assetData: AssetFormData = {
        itemName: data.itemName,
        quantity: data.quantity,
        pricePerItem: data.pricePerItem,
        vendorName: data.vendorName,
        vendorAddress: data.vendorAddress,
        contactNumber: data.contactNumber,
        email: data.email,
        billNo: data.billNo,
        billDate: data.billDate,
        departmentId: data.departmentId,
        categoryId: data.categoryId,
        type: 'capital',
        file: selectedFile || undefined,
      };

      const newAsset = await assetService.createAsset(assetData);
      dispatch({ type: 'ADD_ASSET', payload: newAsset });
      
      toast({
        title: 'Success',
        description: 'Capital asset added successfully',
      });

      // Reset form or navigate
      navigate('/');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add capital asset',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (state.loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader size="lg" text="Loading form data..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calculator className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Add Capital Asset</h1>
              <p className="text-muted-foreground">Track capital assets with vendor details</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-8 bg-gradient-card shadow-elevated">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Item Information */}
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Item Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Item Name"
                    required
                    {...register('itemName')}
                    error={errors.itemName?.message}
                  />
                  
                  <div className="space-y-2">
                    <Label>Department <span className="text-destructive">*</span></Label>
                    <Select onValueChange={(value) => setValue('departmentId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {state.departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.departmentId && (
                      <p className="text-sm text-destructive">{errors.departmentId.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Category <span className="text-destructive">*</span></Label>
                    <Select onValueChange={(value) => setValue('categoryId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {state.categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.categoryId && (
                      <p className="text-sm text-destructive">{errors.categoryId.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing Information */}
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Pricing Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormInput
                    label="Quantity"
                    type="number"
                    required
                    {...register('quantity', { valueAsNumber: true })}
                    error={errors.quantity?.message}
                  />
                  
                  <FormInput
                    label="Price Per Item (₹)"
                    type="number"
                    step="0.01"
                    required
                    {...register('pricePerItem', { valueAsNumber: true })}
                    error={errors.pricePerItem?.message}
                  />
                  
                  <FormInput
                    label="Total Amount (₹)"
                    type="number"
                    value={totalAmount.toFixed(2)}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>

              {/* Vendor Information */}
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Vendor Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Vendor Name"
                    required
                    {...register('vendorName')}
                    error={errors.vendorName?.message}
                  />
                  
                  <FormInput
                    label="Contact Number"
                    required
                    {...register('contactNumber')}
                    error={errors.contactNumber?.message}
                  />
                  
                  <FormInput
                    label="Email"
                    type="email"
                    required
                    {...register('email')}
                    error={errors.email?.message}
                  />
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="vendorAddress">Vendor Address <span className="text-destructive">*</span></Label>
                    <Textarea
                      id="vendorAddress"
                      {...register('vendorAddress')}
                      className="mt-2"
                    />
                    {errors.vendorAddress && (
                      <p className="text-sm text-destructive mt-1">{errors.vendorAddress.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bill Information */}
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Bill Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Bill Number"
                    required
                    {...register('billNo')}
                    error={errors.billNo?.message}
                  />
                  
                  <FormInput
                    label="Bill Date"
                    type="date"
                    required
                    {...register('billDate')}
                    error={errors.billDate?.message}
                  />
                </div>
              </div>

              {/* File Upload */}
              <UploadField
                label="Upload Bill/Invoice"
                onFileSelect={setSelectedFile}
              />

              {/* Submit Button */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <Loader size="sm" text="Saving..." />
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Capital Asset
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