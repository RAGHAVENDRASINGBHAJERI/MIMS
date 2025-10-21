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
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Save, Calculator, FileText, User, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  hover: { scale: 1.05 },
};

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
  department: z.string().min(1, 'Department is required'),
  category: z.string().min(1, 'Category is required'),
  collegeISRNo: z.string().optional(),
  itISRNo: z.string().optional(),

  cgst: z.number().min(0, 'CGST cannot be negative').optional(),
  sgst: z.number().min(0, 'SGST cannot be negative').optional(),
  grandTotal: z.number().min(0, 'Grand total cannot be negative').optional(),
  remark: z.string().optional(),
});

type AssetFormValues = z.infer<typeof assetSchema>;

export default function RevenueForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state, dispatch } = useAssetFlow();
  const { user, isAdmin, isChiefAdministrativeOfficer } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState<Array<{ particulars: string; quantity: number; rate: number; cgst: number; sgst: number; amount: number; grandTotal: number }>>([
    { particulars: '', quantity: 0, rate: 0, cgst: 0, sgst: 0, amount: 0, grandTotal: 0 }
  ]);

  // Auto-calc item totals
  useEffect(() => {
    const updated = items.map((item) => {
      const amount = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
      const tax = amount * (((Number(item.cgst) || 0) + (Number(item.sgst) || 0)) / 100);
      return { ...item, amount, grandTotal: amount + tax };
    });
    const changed = updated.some((u, i) => u.amount !== items[i].amount || u.grandTotal !== items[i].grandTotal);
    if (changed) setItems(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(items.map(i => ({ q: i.quantity, r: i.rate, c: i.cgst, s: i.sgst })))]);

  const billTotalAmount = items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  const billGrandTotal = items.reduce((sum, it) => sum + (Number(it.grandTotal) || 0), 0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    mode: 'onChange',
  });

  const quantity = watch('quantity') || 0;
  const pricePerItem = watch('pricePerItem') || 0;
  const totalAmount = quantity * pricePerItem;

  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });

        const [departments, categories] = await Promise.all([
          departmentService.getAllDepartments(),
          categoryService.getAllCategories('revenue')
        ]);

        dispatch({ type: 'SET_DEPARTMENTS', payload: departments });
        dispatch({ type: 'SET_CATEGORIES', payload: categories });

        // Auto-select department for department-officer
        if (user?.role === 'department-officer' && user.department) {
          setValue('department', user.department._id);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load form data',
          variant: 'destructive',
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    fetchData();
  }, [dispatch, toast, user, setValue]);

  const onSubmit = async (data: AssetFormValues) => {
    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select a bill file',
        variant: 'destructive',
      });
      return;
    }

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
        department: data.department,
        category: data.category,
        type: 'revenue',
        billFile: selectedFile,
        collegeISRNo: data.collegeISRNo,
        itISRNo: data.itISRNo,

        cgst: data.cgst,
        sgst: data.sgst,
        grandTotal: billGrandTotal || data.grandTotal,
        remark: data.remark,
        items,
      };

      console.log('Asset data to send:', assetData);
      const newAsset = await assetService.createAsset(assetData);
      console.log('Created asset:', newAsset);
      
      dispatch({ type: 'ADD_ASSET', payload: newAsset });
      
      toast({
        title: 'Success',
        description: 'Revenue asset added successfully',
      });

      navigate('/');
    } catch (error) {
      console.error('Error creating asset:', error);
      toast({
        title: 'Error',
        description: 'Failed to add revenue asset. Please try again.',
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-6"
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="mb-4 hover:bg-gray-100 transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </motion.div>
          
          <motion.div 
            className="mb-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.h1 
              className="text-3xl font-bold text-gray-800"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              Add New Material
            </motion.h1>
            <motion.p 
              className="text-gray-600"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              Create a new material inward record
            </motion.p>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Bill Information Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="border-b border-gray-200 pb-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center shadow-sm">
                  <FileText className="h-4 w-4 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Bill Information</h3>
                  <p className="text-sm text-gray-600">Basic bill and date information.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  label="Bill Number *"
                  placeholder="BILL-2025-018"
                  {...register('billNo', { required: true })}
                  error={errors.billNo?.message}
                />
                <FormInput
                  label="Bill Date *"
                  type="date"
                  {...register('billDate', { required: true })}
                  error={errors.billDate?.message}
                />
              </div>
            </motion.div>

            {/* Bill Totals */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="border-b border-gray-200 pb-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-100 to-teal-200 rounded-lg flex items-center justify-center shadow-sm">
                  <Calculator className="h-4 w-4 text-teal-700" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Bill Totals</h3>
                  <p className="text-sm text-gray-600">Aggregated from all items.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  label="Total Amount (₹)"
                  type="number"
                  value={billTotalAmount}
                  readOnly
                  className="bg-gray-50"
                />
                <FormInput
                  label="Grand Total (₹)"
                  type="number"
                  value={billGrandTotal}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </motion.div>

            {/* Item Details Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="border-b border-gray-200 pb-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg flex items-center justify-center shadow-sm">
                  <Calculator className="h-4 w-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Item Details</h3>
                  <p className="text-sm text-gray-600">Detailed information about the material.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="department" className="text-sm font-medium text-gray-700">
                    Department *
                  </Label>
                  <Select onValueChange={(value) => setValue('department', value)} disabled={user?.role === 'department-officer'}>
                    <SelectTrigger
                      id="department"
                      aria-label="Select Department"
                      className="mt-1"
                    >
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {state.departments.map((dept) => (
                        <SelectItem key={dept._id} value={dept._id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.department && (
                    <p className="text-sm text-red-600 mt-1" role="alert">
                      {errors.department.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                    Item Category *
                  </Label>
                  <Select onValueChange={(value) => setValue('category', value)}>
                    <SelectTrigger 
                      id="category"
                      aria-label="Select Category"
                      className="mt-1"
                    >
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {state.categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-red-600 mt-1" role="alert">
                      {errors.category.message}
                    </p>
                  )}
                </div>



                {/* Dynamic Items */}
                <div className="col-span-1 md:col-span-2 space-y-4">
                  {items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                      <FormInput
                        label="Particulars"
                        value={it.particulars}
                        onChange={(e) => setItems(items.map((x, i) => i===idx ? { ...x, particulars: e.target.value } : x))}
                      />
                      <FormInput
                        label="Qty"
                        type="number"
                        value={it.quantity}
                        onChange={(e) => setItems(items.map((x, i) => i===idx ? { ...x, quantity: Number(e.target.value) } : x))}
                      />
                      <FormInput
                        label="Rate"
                        type="number"
                        value={it.rate}
                        onChange={(e) => setItems(items.map((x, i) => i===idx ? { ...x, rate: Number(e.target.value) } : x))}
                      />
                      <FormInput
                        label="CGST%"
                        type="number"
                        value={it.cgst}
                        onChange={(e) => setItems(items.map((x, i) => i===idx ? { ...x, cgst: Number(e.target.value) } : x))}
                      />
                      <FormInput
                        label="SGST%"
                        type="number"
                        value={it.sgst}
                        onChange={(e) => setItems(items.map((x, i) => i===idx ? { ...x, sgst: Number(e.target.value) } : x))}
                      />
                      <div>
                        <Label>Total</Label>
                        <div className="h-10 rounded-md border bg-gray-50 px-3 flex items-center">
                          ₹{(it.grandTotal || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="md:col-span-6 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setItems([...items, { particulars: '', quantity: 0, rate: 0, cgst: 0, sgst: 0, amount: 0, grandTotal: 0 }])}>Add Item</Button>
                        {items.length > 1 && (
                          <Button type="button" variant="destructive" onClick={() => setItems(items.filter((_, i) => i !== idx))}>Remove</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Vendor Information Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="border-b border-gray-200 pb-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-lg flex items-center justify-center shadow-sm">
                  <User className="h-4 w-4 text-indigo-700" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Vendor Information</h3>
                  <p className="text-sm text-gray-600">Optional vendor contact details.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  label="Vendor Name *"
                  placeholder="Enter vendor name"
                  {...register('vendorName', { required: true })}
                  error={errors.vendorName?.message}
                />
                <FormInput
                  label="Vendor Address *"
                  placeholder="Enter vendor address"
                  {...register('vendorAddress', { required: true })}
                  error={errors.vendorAddress?.message}
                />
                <FormInput
                  label="Vendor Contact"
                  placeholder="Enter vendor contact number"
                  {...register('contactNumber', { required: true })}
                  error={errors.contactNumber?.message}
                />
                <FormInput
                  label="Vendor Email"
                  type="email"
                  placeholder="Enter vendor email"
                  {...register('email', { required: true })}
                  error={errors.email?.message}
                />
              </div>
            </motion.div>

            {/* ISR Numbers Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="border-b border-gray-200 pb-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center shadow-sm">
                  <FileText className="h-4 w-4 text-purple-700" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">ISR Numbers</h3>
                  <p className="text-sm text-gray-600">Internal Service Request numbers.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  label="College ISR No"
                  placeholder="Enter college ISR number"
                  {...register('collegeISRNo')}
                  error={errors.collegeISRNo?.message}
                />
                <FormInput
                  label="IT ISR No"
                  placeholder="Enter IT ISR number"
                  {...register('itISRNo')}
                  error={errors.itISRNo?.message}
                />
              </div>
            </motion.div>

            {/* GST Details Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="border-b border-gray-200 pb-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center shadow-sm">
                  <Calculator className="h-4 w-4 text-orange-700" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">GST Details</h3>
                  <p className="text-sm text-gray-600">Goods and Services Tax information.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <FormInput
                  label="CGST (₹)"
                  type="number"
                  step="0.01"
                  placeholder="Enter CGST amount"
                  {...register('cgst', { valueAsNumber: true })}
                  error={errors.cgst?.message}
                />
                <FormInput
                  label="SGST (₹)"
                  type="number"
                  step="0.01"
                  placeholder="Enter SGST amount"
                  {...register('sgst', { valueAsNumber: true })}
                  error={errors.sgst?.message}
                />
                <FormInput
                  label="Grand Total (₹)"
                  type="number"
                  step="0.01"
                  placeholder="Enter grand total"
                  {...register('grandTotal', { valueAsNumber: true })}
                  error={errors.grandTotal?.message}
                />
              </div>
            </motion.div>

            {/* Remarks Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="border-b border-gray-200 pb-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center shadow-sm">
                  <FileText className="h-4 w-4 text-gray-700" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Remarks</h3>
                  <p className="text-sm text-gray-600">Additional notes or remarks.</p>
                </div>
              </div>
              <div className="max-w-2xl">
                <Textarea
                  placeholder="Enter any additional remarks..."
                  className="min-h-[100px]"
                  {...register('remark')}
                />
              </div>
            </motion.div>

            {/* Receipt Upload Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="pb-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-lg flex items-center justify-center shadow-sm">
                  <Upload className="h-4 w-4 text-cyan-700" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Receipt Upload</h3>
                  <p className="text-sm text-gray-600">Upload receipt document (PDF or Image, max 5MB).</p>
                </div>
              </div>
              <div className="max-w-md">
                <UploadField
                  label="Receipt File"
                  onFileSelect={setSelectedFile}
                  accept={{ "application/pdf": [".pdf"], "image/*": [".jpg", ".jpeg", ".png"] }}
                  maxSize={5 * 1024 * 1024}
                  required
                />
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex justify-end gap-4 pt-6 border-t border-gray-200"
            >
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                className="px-6 py-2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !isValid}
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isSubmitting ? (
                  <Loader size="sm" text="Saving..." />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Material
                  </>
                )}
              </Button>
            </motion.div>
          </form>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 text-center text-gray-600"
        >
          <p className="text-sm">© 2024 Smt. Kamala and Shri Venkappa M. Agadi College of Engineering and Technology</p>
          <p className="text-xs mt-1">Material Inward Management System</p>
        </motion.div>
      </div>
    </div>
  );
}