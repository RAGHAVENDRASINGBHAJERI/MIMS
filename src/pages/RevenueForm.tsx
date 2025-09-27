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
import { ArrowLeft, Save, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const revenueSchema = z.object({
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

type RevenueFormValues = z.infer<typeof revenueSchema>;

export default function RevenueForm() {
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
  } = useForm<RevenueFormValues>({
    resolver: zodResolver(revenueSchema),
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
          categoryService.getAllCategories('revenue'),
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

  const onSubmit = async (data: RevenueFormValues) => {
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
        type: 'revenue',
        file: selectedFile || undefined,
      };

      const newAsset = await assetService.createAsset(assetData);
      dispatch({ type: 'ADD_ASSET', payload: newAsset });
      
      toast({
        title: 'Success',
        description: 'Revenue asset added successfully',
      });

      navigate('/');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add revenue asset',
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
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-success/5 p-6">
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
            <div className="p-2 bg-success/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Add Revenue Asset</h1>
              <p className="text-muted-foreground">Track revenue-generating assets and their performance</p>
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
                <h2 className="text-lg font-semibold text-foreground mb-4">Revenue Item Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Revenue Item Name"
                    required
                    placeholder="e.g., Course Fees, Lab Usage, Equipment Rental"
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
                    <Label>Revenue Category <span className="text-destructive">*</span></Label>
                    <Select onValueChange={(value) => setValue('categoryId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select revenue category" />
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

              {/* Revenue Information */}
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Revenue Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormInput
                    label="Quantity/Units"
                    type="number"
                    placeholder="Number of units"
                    required
                    {...register('quantity', { valueAsNumber: true })}
                    error={errors.quantity?.message}
                  />
                  
                  <FormInput
                    label="Rate Per Unit (₹)"
                    type="number"
                    step="0.01"
                    placeholder="Price per unit"
                    required
                    {...register('pricePerItem', { valueAsNumber: true })}
                    error={errors.pricePerItem?.message}
                  />
                  
                  <FormInput
                    label="Total Revenue (₹)"
                    type="number"
                    value={totalAmount.toFixed(2)}
                    readOnly
                    className="bg-success/5 border-success/20"
                  />
                </div>
              </div>

              {/* Payer/Source Information */}
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Revenue Source Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Payer/Source Name"
                    placeholder="Name of organization/individual"
                    required
                    {...register('vendorName')}
                    error={errors.vendorName?.message}
                  />
                  
                  <FormInput
                    label="Contact Number"
                    placeholder="Contact number"
                    required
                    {...register('contactNumber')}
                    error={errors.contactNumber?.message}
                  />
                  
                  <FormInput
                    label="Email"
                    type="email"
                    placeholder="Email address"
                    required
                    {...register('email')}
                    error={errors.email?.message}
                  />
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="vendorAddress">Source Address <span className="text-destructive">*</span></Label>
                    <Textarea
                      id="vendorAddress"
                      placeholder="Complete address of the revenue source"
                      {...register('vendorAddress')}
                      className="mt-2"
                    />
                    {errors.vendorAddress && (
                      <p className="text-sm text-destructive mt-1">{errors.vendorAddress.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Receipt/Transaction Information */}
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Receipt Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Receipt/Transaction Number"
                    placeholder="Receipt or transaction ID"
                    required
                    {...register('billNo')}
                    error={errors.billNo?.message}
                  />
                  
                  <FormInput
                    label="Transaction Date"
                    type="date"
                    required
                    {...register('billDate')}
                    error={errors.billDate?.message}
                  />
                </div>
              </div>

              {/* File Upload */}
              <UploadField
                label="Upload Receipt/Supporting Document"
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
                  className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                >
                  {isSubmitting ? (
                    <Loader size="sm" text="Saving..." />
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Revenue Asset
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