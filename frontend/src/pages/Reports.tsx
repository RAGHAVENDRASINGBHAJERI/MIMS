import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/form-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useAssetFlow } from '@/context/AssetFlowContext';
import { departmentService } from '@/services/departmentService';
import { reportService, type ReportFilters } from '@/services/reportService';
import { assetService, type Asset, type AssetFormData } from '@/services/assetService';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  FileBarChart,
  Download,
  Filter,
  TrendingUp,
  DollarSign,
  Calendar,
  Building2,
  Edit,
  Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

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

export default function Reports() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state, dispatch } = useAssetFlow();
  const [filters, setFilters] = useState<ReportFilters>({});
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [reportType, setReportType] = useState<'combined' | 'vendor' | 'item' | 'department' | 'year'>('combined');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<AssetFormData>>({});
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
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
  }, [dispatch, toast]);

  useEffect(() => {
    generateReport(false);
  }, [reportType]);

  const generateReport = async (showToast = true) => {
    setIsLoading(true);
    try {
      let reportData;
      switch (reportType) {
        case 'vendor':
          reportData = await reportService.getVendorReport(filters);
          break;
        case 'item':
          reportData = await reportService.getItemReport(filters);
          break;
        case 'department':
          reportData = await reportService.getDepartmentReport(filters);
          break;
        case 'year':
          reportData = await reportService.getYearReport();
          break;
        default:
          reportData = await reportService.generateReport(filters);
      }

      // Set summary for all report types if available
      if (reportData.data) {
        if (reportData.data.totalCapital !== undefined) {
          reportData.summary = {
            totalCapital: reportData.data.totalCapital,
            totalRevenue: reportData.data.totalRevenue,
            grandTotal: reportData.data.grandTotal,
            itemCount: reportData.data.report ? reportData.data.report.length : (reportData.data.assets ? reportData.data.assets.length : 0)
          };
        }
      }

      if ((!reportData.assets || reportData.assets.length === 0) && (!reportData.report || reportData.report.length === 0)) {
        toast({
          title: 'Warning',
          description: 'No data found for the selected filters.',
          variant: 'destructive',
        });
      }

      setReportData(reportData);

      if (showToast) {
        toast({
          title: 'Success',
          description: 'Report generated successfully',
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      const blob = await reportService.exportToExcel(reportType, filters as Record<string, string>);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `asset-report-${reportType}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Report exported to Excel successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export to Excel',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };



  const handleEdit = (asset: Asset) => {
    setSelectedAsset(asset);
    setEditFormData({
      itemName: asset.itemName,
      quantity: asset.quantity,
      pricePerItem: asset.pricePerItem,
      vendorName: asset.vendorName,
      vendorAddress: asset.vendorAddress,
      contactNumber: asset.contactNumber,
      email: asset.email,
      billNo: asset.billNo,
      billDate: asset.billDate,
      department: asset.department?._id || '',
      category: asset.category,
      type: asset.type,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateAsset = async () => {
    if (!selectedAsset) return;

    setIsUpdating(true);
    try {
      await assetService.updateAsset(selectedAsset._id, editFormData);
      setIsEditDialogOpen(false);
      setSelectedAsset(null);
      setEditFormData({});
      await generateReport(false); // Refresh the report data without toast

      toast({
        title: 'Success',
        description: 'Asset updated successfully',
      });
    } catch (error) {
      console.error('Error updating asset:', error);
      toast({
        title: 'Error',
        description: 'Failed to update asset',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    try {
      await assetService.deleteAsset(assetId);
      await generateReport(); // Await refresh of the report data

      toast({
        title: 'Success',
        description: 'Item deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete asset',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteVendor = async (vendorName: string) => {
    try {
      // Get all assets to find those from this vendor
      const allAssets = await assetService.getAssets();
      const vendorAssets = allAssets.filter(asset => asset.vendorName === vendorName);

      // Delete each asset from this vendor
      for (const asset of vendorAssets) {
        await assetService.deleteAsset(asset._id);
      }

      await generateReport(); // Refresh the report data

      toast({
        title: 'Success',
        description: `Deleted ${vendorAssets.length} asset(s) from vendor "${vendorName}"`,
      });
    } catch (error) {
      console.error('Error deleting vendor assets:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete vendor assets',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDepartment = async (departmentName: string) => {
    try {
      // Get all assets to find those from this department
      const allAssets = await assetService.getAssets();
      const departmentAssets = allAssets.filter(asset => asset.department?.name === departmentName);

      // Delete each asset from this department
      for (const asset of departmentAssets) {
        await assetService.deleteAsset(asset._id);
      }

      await generateReport(); // Refresh the report data

      toast({
        title: 'Success',
        description: `Deleted ${departmentAssets.length} asset(s) from department "${departmentName}"`,
      });
    } catch (error) {
      console.error('Error deleting department assets:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete department assets',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateReportClick = () => {
    generateReport(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-info/5 p-6">
      <div className="max-w-7xl mx-auto">
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
                onClick={() => navigate('/')}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </motion.div>
          </motion.div>
          
          <motion.div className="flex items-center gap-3 mb-2" variants={itemVariants}>
            <div className="p-2 bg-info/10 rounded-lg">
              <FileBarChart className="h-6 w-6 text-info" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
              <p className="text-muted-foreground">Generate comprehensive asset and revenue reports</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Edit Asset Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FormInput
              label="Item Name"
              value={editFormData.itemName || ''}
              onChange={(e) => setEditFormData({ ...editFormData, itemName: e.target.value })}
            />
            <FormInput
              label="Quantity"
              type="number"
              value={editFormData.quantity || ''}
              onChange={(e) => setEditFormData({ ...editFormData, quantity: Number(e.target.value) })}
            />
            <FormInput
              label="Price Per Item"
              type="number"
              value={editFormData.pricePerItem || ''}
              onChange={(e) => setEditFormData({ ...editFormData, pricePerItem: Number(e.target.value) })}
            />
            <FormInput
              label="Vendor Name"
              value={editFormData.vendorName || ''}
              onChange={(e) => setEditFormData({ ...editFormData, vendorName: e.target.value })}
            />
            <FormInput
              label="Vendor Address"
              value={editFormData.vendorAddress || ''}
              onChange={(e) => setEditFormData({ ...editFormData, vendorAddress: e.target.value })}
            />
            <FormInput
              label="Contact Number"
              value={editFormData.contactNumber || ''}
              onChange={(e) => setEditFormData({ ...editFormData, contactNumber: e.target.value })}
            />
            <FormInput
              label="Email"
              type="email"
              value={editFormData.email || ''}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
            />
            <FormInput
              label="Bill No"
              value={editFormData.billNo || ''}
              onChange={(e) => setEditFormData({ ...editFormData, billNo: e.target.value })}
            />
            <FormInput
              label="Bill Date"
              type="date"
              value={editFormData.billDate ? new Date(editFormData.billDate).toISOString().split('T')[0] : ''}
              onChange={(e) => setEditFormData({ ...editFormData, billDate: e.target.value })}
            />
            <div>
              <Label>Department</Label>
              <Select
                value={editFormData.department || ''}
                onValueChange={(value) => setEditFormData({ ...editFormData, department: value })}
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
            </div>
            <FormInput
              label="Category"
              value={editFormData.category || ''}
              onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
            />
            <div>
              <Label>Type</Label>
              <Select
                value={editFormData.type || ''}
                onValueChange={(value) => setEditFormData({ ...editFormData, type: value as 'capital' | 'revenue' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="capital">Capital</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isUpdating}>
                Cancel
              </Button>
              <Button onClick={handleUpdateAsset} disabled={isUpdating}>
                {isUpdating ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </DialogContent>
        </Dialog>

        {/* Report Type Selector */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <motion.div variants={itemVariants}>
            <Card className="p-6 bg-gradient-card shadow-card">
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select value={reportType} onValueChange={(value) => setReportType(value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="combined">Combined</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="item">Item</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Assets Overview */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <motion.div variants={itemVariants}>
            <Card className="p-6 bg-gradient-card shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Your Saved Assets</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 bg-primary/5 rounded-lg"
                >
                  <p className="text-2xl font-bold text-primary">{reportData?.data?.assets?.length || (state.assets || []).length || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Assets</p>
                </motion.div>
                <motion.div
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 bg-success/5 rounded-lg"
                >
                  <p className="text-2xl font-bold text-success">
                    {((reportData?.data?.assets || []).filter((asset: any) => asset.type === 'capital').length || (state.assets || []).filter((asset: any) => asset.type === 'capital').length) || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Capital Assets</p>
                </motion.div>
                <motion.div
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 bg-info/5 rounded-lg"
                >
                  <p className="text-2xl font-bold text-info">
                    {((reportData?.data?.assets || []).filter((asset: any) => asset.type === 'revenue').length || (state.assets || []).filter((asset: any) => asset.type === 'revenue').length) || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Revenue Assets</p>
                </motion.div>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Your assets are stored in the database and can be viewed in reports below.
                </p>
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Filters Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          transition={{ delay: 0.1 }}
        >
          <motion.div variants={itemVariants}>
            <Card className="p-6 mb-6 bg-gradient-card shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Report Filters</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {reportType === 'item' && (
                  <div className="space-y-2">
                    <Label>Item Name</Label>
                    <FormInput
                      type="text"
                      placeholder="Enter item name"
                      value={filters.itemName || ''}
                      onChange={(e) => setFilters({ ...filters, itemName: e.target.value || undefined })}
                    />
                  </div>
                )}
                {reportType === 'vendor' && (
                  <div className="space-y-2">
                    <Label>Vendor Name</Label>
                    <FormInput
                      type="text"
                      placeholder="Enter vendor name"
                      value={filters.vendorName || ''}
                      onChange={(e) => setFilters({ ...filters, vendorName: e.target.value || undefined })}
                    />
                  </div>
                )}
                {reportType === 'department' && (
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select value={filters.departmentId} onValueChange={(value) => setFilters({ ...filters, departmentId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="All departments" />
                      </SelectTrigger>
                      <SelectContent>
                    <SelectItem value={null}>All Departments</SelectItem>
                    {(state.departments || []).filter(dept => dept._id && dept.name).map((dept) => (
                      <SelectItem key={dept._id} value={dept._id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={filters.departmentId} onValueChange={(value) => setFilters({ ...filters, departmentId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>All Departments</SelectItem>
                      {(state.departments || []).filter(dept => dept._id && dept.name).map((dept) => (
                        <SelectItem key={dept._id} value={dept._id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Asset Type</Label>
                  <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: (value as 'capital' | 'revenue') || undefined })}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="capital">Capital Assets</SelectItem>
                      <SelectItem value="revenue">Revenue Assets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <div className="flex gap-2">
                    <FormInput
                      type="date"
                      placeholder="From"
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value, academicYear: undefined })}
                    />
                    <FormInput
                      type="date"
                      placeholder="To"
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value, academicYear: undefined })}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 mt-6">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button onClick={() => handleGenerateReportClick()} disabled={isLoading}>
                    {isLoading ? (
                      <Loader size="sm" text="Generating..." />
                    ) : (
                      <>
                        <FileBarChart className="h-4 w-4 mr-2" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </motion.div>
                
                {reportData && (
                  <>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        onClick={exportToExcel}
                        disabled={isExporting}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Excel
                      </Button>
                    </motion.div>
                    

                  </>
                )}
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Results Section */}
        {reportData && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Summary Cards */}
            {reportData.summary && (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-4 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {[
                  {
                    label: 'Total Capital',
                    value: `₹${reportData.summary.totalCapital?.toLocaleString() || '0'}`,
                    icon: <DollarSign className="h-8 w-8 text-primary/70" />,
                    key: 'totalCapital',
                    colorClass: 'text-primary',
                  },
                  {
                    label: 'Total Revenue',
                    value: `₹${reportData.summary.totalRevenue?.toLocaleString() || '0'}`,
                    icon: <TrendingUp className="h-8 w-8 text-success/70" />,
                    key: 'totalRevenue',
                    colorClass: 'text-success',
                  },
                  {
                    label: 'Grand Total',
                    value: `₹${reportData.summary.grandTotal?.toLocaleString() || '0'}`,
                    icon: <Calendar className="h-8 w-8 text-info/70" />,
                    key: 'grandTotal',
                    colorClass: 'text-info',
                  },
                  {
                    label: 'Total Items',
                    value: reportData.summary.itemCount || 0,
                    icon: <Building2 className="h-8 w-8 text-muted-foreground/70" />,
                    key: 'itemCount',
                    colorClass: 'text-foreground',
                  },
                ].map(({ label, value, icon, key, colorClass }) => (
                  <motion.div
                    key={key}
                    className="p-6 bg-gradient-card shadow-card"
                    variants={itemVariants}
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
                      </div>
                      {icon}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Charts Section */}
            {reportData.summary && (
              <motion.div variants={itemVariants}>
                <Card className="p-6 bg-gradient-card shadow-card">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Visual Analytics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pie Chart for Capital vs Revenue */}
                    <div>
                      <h4 className="text-md font-medium text-foreground mb-2">Asset Types Distribution</h4>
                      <ChartContainer
                        config={{
                          capital: { label: "Capital", color: "hsl(var(--primary))" },
                          revenue: { label: "Revenue", color: "hsl(var(--success))" },
                        }}
                        className="h-[300px]"
                      >
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Capital', value: reportData.summary.totalCapital || 0 },
                              { name: 'Revenue', value: reportData.summary.totalRevenue || 0 },
                            ]}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label
                          >
                            <Cell fill="hsl(var(--primary))" />
                            <Cell fill="hsl(var(--success))" />
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ChartContainer>
                    </div>
                    {/* Bar Chart for Departments if department report */}
                    {reportType === 'department' && reportData.report && (
                      <div>
                        <h4 className="text-md font-medium text-foreground mb-2">Department-wise Amounts</h4>
                        <ChartContainer
                          config={{
                            amount: { label: "Amount", color: "hsl(var(--primary))" },
                          }}
                          className="h-[300px]"
                        >
                          <BarChart
                            data={reportData.report.map((item: any) => ({
                              department: item.department?.name || item.department || 'N/A',
                              amount: item.totalAmount || 0,
                            }))}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="department" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="amount" fill="hsl(var(--primary))" />
                          </BarChart>
                        </ChartContainer>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Data Table */}
            <Card className="p-6 bg-gradient-card shadow-card">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                {reportType === 'combined' ? 'Asset Details' :
                 reportType === 'department' ? 'Department Report' :
                 reportType === 'vendor' ? 'Vendor Report' :
                 reportType === 'item' ? 'Item Report' :
                 'Year Report'}
              </h3>

              {(() => {
                const data = reportType === 'combined' || reportType === 'department' ? (reportData?.assets || []) : (reportData?.report || []);
                const hasData = data.length > 0;

                if (!hasData) {
                  return (
                    <div className="text-center py-8">
                      <FileBarChart className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-2 text-muted-foreground">No data found. Ensure backend is running and data is seeded, or add assets via forms.</p>
                      <Button onClick={() => generateReport()} className="mt-4">
                        Retry Load
                      </Button>
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto">
                    <motion.table
                      className="w-full"
                      initial="hidden"
                      animate="visible"
                      variants={containerVariants}
                    >
                      <thead>
                        <tr className="border-b border-border">
                          {reportType === 'combined' || reportType === 'item' ? (
                            <>
                              <th className="text-left p-2 text-sm font-medium text-muted-foreground">Item Name</th>
                              <th className="text-left p-2 text-sm font-medium text-muted-foreground">Type</th>
                              <th className="text-left p-2 text-sm font-medium text-muted-foreground">Department</th>
                              <th className="text-left p-2 text-sm font-medium text-muted-foreground">Quantity</th>
                              <th className="text-left p-2 text-sm font-medium text-muted-foreground">Amount</th>
                              <th className="text-left p-2 text-sm font-medium text-muted-foreground">Date</th>
                              <th className="text-left p-2 text-sm font-medium text-muted-foreground">Actions</th>
                            </>
                          ) : reportType === 'department' ? (
                            <>
                              <th className="text-left p-2 text-sm font-medium text-muted-foreground">Department</th>
                              <th className="text-left p-2 text-sm font-medium text-muted-foreground">Quantity</th>
                              <th className="text-left p-2 text-sm font-medium text-muted-foreground">Amount</th>
                              <th className="text-left p-2 text-sm font-medium text-muted-foreground">Actions</th>
                            </>
                          ) : reportType === 'vendor' ? (
                            <>
                              <th className="text-left p-2 text-sm font-medium text-muted-foreground">Vendor</th>
                              <th className="text-left p-2 text-sm font-medium text-muted-foreground">Total Assets</th>
                              <th className="text-left p-2 text-sm font-medium text-muted-foreground">Total Amount</th>
                              <th className="text-left p-2 text-sm font-medium text-muted-foreground">Actions</th>
                            </>
                          ) : (
                            <>
                              <th className="text-left p-2 text-sm font-medium text-muted-foreground">Year</th>
                              <th className="text-left p-2 text-sm font-medium text-muted-foreground">Total Assets</th>
                              <th className="text-left p-2 text-sm font-medium text-muted-foreground">Total Amount</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((item: any, index: number) => (
                          <motion.tr
                            key={index}
                            className="border-b border-border/50"
                            variants={itemVariants}
                            whileHover={{ scale: 1.02 }}
                          >
                            {reportType === 'combined' || reportType === 'item' ? (
                              <>
                                <td className="p-2 text-sm text-foreground">{item.itemName}</td>
                                <td className="p-2">
                                  <Badge
                                    variant={item.type === 'capital' ? 'default' : 'secondary'}
                                    className={item.type === 'capital' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'}
                                  >
                                    {item.type}
                                  </Badge>
                                </td>
                                <td className="p-2 text-sm text-foreground">{item.department?.name || item.department || 'N/A'}</td>
                                <td className="p-2 text-sm text-foreground">{item.quantity}</td>
                                <td className="p-2 text-sm font-medium text-foreground">
                                  ₹{item.totalAmount?.toLocaleString() || '0'}
                                </td>
                                <td className="p-2 text-sm text-muted-foreground">{item.billDate ? new Date(item.billDate).toLocaleDateString() : 'N/A'}</td>
                                <td className="p-2">
                                  <div className="flex gap-2">
                                    {(reportType === 'combined' || reportType === 'item') ? (
                                      <>
                                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(item)}
                                            className="h-8 w-8 p-0"
                                          >
                                            <Edit className="h-4 w-4 text-primary" />
                                          </Button>
                                        </motion.div>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                              >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                              </Button>
                                            </motion.div>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Delete Asset</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Are you sure you want to delete this asset? This action cannot be undone.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction
                                                onClick={() => handleDeleteAsset(item._id)}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                              >
                                                Delete
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </>
                                    ) : null}
                                  </div>
                                </td>
                              </>
                            ) : reportType === 'vendor' ? (
                              <>
                                <td className="p-2 text-sm text-foreground">{item._id}</td>
                                <td className="p-2 text-sm text-foreground">{item.totalAssets || item.count || 1}</td>
                                <td className="p-2 text-sm font-medium text-foreground">
                                  ₹{item.totalAmount?.toLocaleString() || '0'}
                                </td>
                                <td className="p-2">
                                  <div className="flex gap-2">
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                          >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                          </Button>
                                        </motion.div>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Vendor Data</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete all assets from vendor "{item._id}"? This will delete {item.totalAssets || item.count || 1} asset(s) and cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleDeleteVendor(item._id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
                                            Delete All Assets
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </td>
                              </>
                            ) : reportType === 'department' ? (
                              <>
                              <td className="p-2 text-sm text-foreground">{item.department?.name || item.department || 'N/A'}</td>
                              <td className="p-2 text-sm text-foreground">{item.quantity}</td>
                              <td className="p-2 text-sm font-medium text-foreground">
                                ₹{item.totalAmount?.toLocaleString() || '0'}
                              </td>
                              <td className="p-2">
                                <div className="flex gap-2">
                                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEdit(item)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit className="h-4 w-4 text-primary" />
                                    </Button>
                                  </motion.div>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0"
                                        >
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </motion.div>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Asset</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete this asset? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteAsset(item._id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </td>
                            </>
                          ) : (
                              <>
                                <td className="p-2 text-sm text-foreground">{item._id}</td>
                                <td className="p-2 text-sm text-foreground">{item.totalAssets || item.count || 1}</td>
                                <td className="p-2 text-sm font-medium text-foreground">
                                  ₹{item.totalAmount?.toLocaleString() || '0'}
                                </td>
                              </>
                            )}
                          </motion.tr>
                        ))}
                      </tbody>
                    </motion.table>
                  </div>
                );
              })()}
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
