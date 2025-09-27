import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/form-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import { useAssetFlow } from '@/context/AssetFlowContext';
import { departmentService } from '@/services/departmentService';
import { reportService, type ReportFilters } from '@/services/reportService';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  FileBarChart,
  Download,
  FileText,
  Filter,
  TrendingUp,
  DollarSign,
  Calendar,
  Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Reports() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state, dispatch } = useAssetFlow();
  const [filters, setFilters] = useState<ReportFilters>({});
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const departments = await departmentService.getAllDepartments();
        dispatch({ type: 'SET_DEPARTMENTS', payload: departments });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load departments',
          variant: 'destructive',
        });
      }
    };

    fetchDepartments();
  }, [dispatch, toast]);

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const data = await reportService.generateReport(filters);
      setReportData(data);
    } catch (error) {
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
      const blob = await reportService.exportToExcel(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `asset-report-${new Date().toISOString().split('T')[0]}.xlsx`;
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

  const exportToWord = async () => {
    setIsExporting(true);
    try {
      const blob = await reportService.exportToWord(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `asset-report-${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Success',
        description: 'Report exported to Word successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export to Word',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-info/5 p-6">
      <div className="max-w-7xl mx-auto">
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
            <div className="p-2 bg-info/10 rounded-lg">
              <FileBarChart className="h-6 w-6 text-info" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
              <p className="text-muted-foreground">Generate comprehensive asset and revenue reports</p>
            </div>
          </div>
        </motion.div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 mb-6 bg-gradient-card shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Report Filters</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Select onValueChange={(value) => setFilters({ ...filters, academicYear: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2023-24">2023-24</SelectItem>
                    <SelectItem value="2024-25">2024-25</SelectItem>
                    <SelectItem value="2025-26">2025-26</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Department</Label>
                <Select onValueChange={(value) => setFilters({ ...filters, departmentId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Departments</SelectItem>
                    {state.departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Asset Type</Label>
                <Select onValueChange={(value) => setFilters({ ...filters, type: value as 'capital' | 'revenue' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
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
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  />
                  <FormInput
                    type="date"
                    placeholder="To"
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 mt-6">
              <Button onClick={generateReport} disabled={isLoading}>
                {isLoading ? (
                  <Loader size="sm" text="Generating..." />
                ) : (
                  <>
                    <FileBarChart className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
              
              {reportData && (
                <>
                  <Button
                    variant="outline"
                    onClick={exportToExcel}
                    disabled={isExporting}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={exportToWord}
                    disabled={isExporting}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export Word
                  </Button>
                </>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Results Section */}
        {reportData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-6 bg-gradient-card shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Capital</p>
                    <p className="text-2xl font-bold text-primary">
                      ₹{reportData.summary.totalCapital?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-primary/70" />
                </div>
              </Card>
              
              <Card className="p-6 bg-gradient-card shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold text-success">
                      ₹{reportData.summary.totalRevenue?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-success/70" />
                </div>
              </Card>
              
              <Card className="p-6 bg-gradient-card shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Grand Total</p>
                    <p className="text-2xl font-bold text-info">
                      ₹{reportData.summary.grandTotal?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-info/70" />
                </div>
              </Card>
              
              <Card className="p-6 bg-gradient-card shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Items</p>
                    <p className="text-2xl font-bold text-foreground">
                      {reportData.summary.itemCount || 0}
                    </p>
                  </div>
                  <Building2 className="h-8 w-8 text-muted-foreground/70" />
                </div>
              </Card>
            </div>

            {/* Data Table */}
            <Card className="p-6 bg-gradient-card shadow-card">
              <h3 className="text-lg font-semibold text-foreground mb-4">Asset Details</h3>
              
              {reportData.assets && reportData.assets.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-2 text-sm font-medium text-muted-foreground">Item Name</th>
                        <th className="text-left p-2 text-sm font-medium text-muted-foreground">Type</th>
                        <th className="text-left p-2 text-sm font-medium text-muted-foreground">Department</th>
                        <th className="text-left p-2 text-sm font-medium text-muted-foreground">Quantity</th>
                        <th className="text-left p-2 text-sm font-medium text-muted-foreground">Amount</th>
                        <th className="text-left p-2 text-sm font-medium text-muted-foreground">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.assets.map((asset: any, index: number) => (
                        <tr key={index} className="border-b border-border/50">
                          <td className="p-2 text-sm text-foreground">{asset.itemName}</td>
                          <td className="p-2">
                            <Badge 
                              variant={asset.type === 'capital' ? 'default' : 'secondary'}
                              className={asset.type === 'capital' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'}
                            >
                              {asset.type}
                            </Badge>
                          </td>
                          <td className="p-2 text-sm text-foreground">{asset.department}</td>
                          <td className="p-2 text-sm text-foreground">{asset.quantity}</td>
                          <td className="p-2 text-sm font-medium text-foreground">
                            ₹{asset.totalAmount?.toLocaleString() || '0'}
                          </td>
                          <td className="p-2 text-sm text-muted-foreground">{asset.billDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileBarChart className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">No data found for the selected filters</p>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}