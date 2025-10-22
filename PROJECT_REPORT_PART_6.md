# Material Inward Management System (MIMS)
## Comprehensive Project Report - Part 6 of 8

---

# PART 6: KEY FEATURES & BUSINESS LOGIC

## 1. Asset Management System

### 1.1 Multi-Item Bill Support
```javascript
// File: backend/src/models/Asset.js - Item Schema
const itemSchema = new mongoose.Schema({
  particulars: { type: String, trim: true },
  quantity: { type: Number, min: [0, 'Quantity cannot be negative'] },
  rate: { type: Number, min: [0, 'Rate cannot be negative'] },
  cgst: { type: Number, default: 0, min: [0, 'CGST cannot be negative'] },
  sgst: { type: Number, default: 0, min: [0, 'SGST cannot be negative'] },
  amount: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 }
}, { _id: false });

// Pre-save middleware for automatic calculations
assetSchema.pre('save', function(next) {
  if (Array.isArray(this.items) && this.items.length > 0) {
    this.items = this.items.map((item) => {
      const amount = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
      const tax = amount * ((Number(item.cgst) || 0) + (Number(item.sgst) || 0)) / 100;
      return {
        ...item.toObject ? item.toObject() : item,
        amount,
        grandTotal: amount + tax
      };
    });
    this.totalAmount = this.items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
    this.grandTotal = this.items.reduce((sum, it) => sum + (Number(it.grandTotal) || 0), 0);
  }
  next();
});
```

### 1.2 Item-Level Editing System
```typescript
// File: frontend/src/components/ItemEditDialog.tsx
interface ItemEditDialogProps {
  item: AssetItem;
  itemIndex: number;
  assetId: string;
  onItemUpdate: (updatedItem: AssetItem) => void;
}

export function ItemEditDialog({ item, itemIndex, assetId, onItemUpdate }: ItemEditDialogProps) {
  const [editedItem, setEditedItem] = useState<AssetItem>(item);
  const [reason, setReason] = useState('');
  const [officerName, setOfficerName] = useState('');

  const calculateTotals = (item: AssetItem) => {
    const amount = (item.quantity || 0) * (item.rate || 0);
    const tax = amount * ((item.cgst || 0) + (item.sgst || 0)) / 100;
    return {
      amount,
      grandTotal: amount + tax
    };
  };

  const handleSave = async () => {
    if (!reason.trim()) {
      toast({ title: 'Error', description: 'Reason is required', variant: 'destructive' });
      return;
    }

    try {
      const { amount, grandTotal } = calculateTotals(editedItem);
      const updatedItem = { ...editedItem, amount, grandTotal };

      await assetService.updateAssetItem(assetId, itemIndex, updatedItem, reason, officerName);
      
      onItemUpdate(updatedItem);
      toast({ title: 'Success', description: 'Item updated successfully' });
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Particulars</Label>
            <Input
              value={editedItem.particulars}
              onChange={(e) => setEditedItem({...editedItem, particulars: e.target.value})}
            />
          </div>
          
          <div>
            <Label>Quantity</Label>
            <Input
              type="number"
              value={editedItem.quantity}
              onChange={(e) => setEditedItem({...editedItem, quantity: Number(e.target.value)})}
            />
          </div>
          
          <div>
            <Label>Rate (₹)</Label>
            <Input
              type="number"
              step="0.01"
              value={editedItem.rate}
              onChange={(e) => setEditedItem({...editedItem, rate: Number(e.target.value)})}
            />
          </div>
          
          <div>
            <Label>CGST (%)</Label>
            <Input
              type="number"
              step="0.01"
              value={editedItem.cgst}
              onChange={(e) => setEditedItem({...editedItem, cgst: Number(e.target.value)})}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Reason for Change *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide reason for this change"
            />
          </div>
          
          <div>
            <Label>Officer Name</Label>
            <Input
              value={officerName}
              onChange={(e) => setOfficerName(e.target.value)}
              placeholder="Your name"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## 2. Advanced Reporting System

### 2.1 Department-wise Report Generation
```javascript
// File: backend/src/controllers/reportController.js
export const getDepartmentReport = async (req, res) => {
  try {
    const { departmentId, startDate, endDate, type } = req.query;

    const pipeline = [
      // Match stage
      {
        $match: {
          ...(departmentId && { department: mongoose.Types.ObjectId(departmentId) }),
          ...(type && { type }),
          ...(startDate || endDate) && {
            billDate: {
              ...(startDate && { $gte: new Date(startDate) }),
              ...(endDate && { $lte: new Date(endDate) })
            }
          }
        }
      },
      
      // Lookup department details
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'departmentInfo'
        }
      },
      
      // Group by department
      {
        $group: {
          _id: '$department',
          departmentName: { $first: { $arrayElemAt: ['$departmentInfo.name', 0] } },
          totalAssets: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          capitalAssets: { $sum: { $cond: [{ $eq: ['$type', 'capital'] }, 1, 0] } },
          revenueAssets: { $sum: { $cond: [{ $eq: ['$type', 'revenue'] }, 1, 0] } },
          capitalAmount: { $sum: { $cond: [{ $eq: ['$type', 'capital'] }, '$totalAmount', 0] } },
          revenueAmount: { $sum: { $cond: [{ $eq: ['$type', 'revenue'] }, '$totalAmount', 0] } },
          avgAssetValue: { $avg: '$totalAmount' },
          assets: {
            $push: {
              _id: '$_id',
              itemName: '$itemName',
              vendorName: '$vendorName',
              billNo: '$billNo',
              billDate: '$billDate',
              totalAmount: '$totalAmount',
              type: '$type'
            }
          }
        }
      },
      
      // Sort by total amount
      { $sort: { totalAmount: -1 } }
    ];

    const report = await Asset.aggregate(pipeline);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

### 2.2 Excel Export with Advanced Formatting
```javascript
export const exportToExcel = async (req, res) => {
  try {
    const { departmentId, type, startDate, endDate } = req.query;

    // Build query
    let query = {};
    if (departmentId) query.department = departmentId;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.billDate = {};
      if (startDate) query.billDate.$gte = new Date(startDate);
      if (endDate) query.billDate.$lte = new Date(endDate);
    }

    const assets = await Asset.find(query)
      .populate('department', 'name code')
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Assets Report');

    // Define columns with formatting
    worksheet.columns = [
      { header: 'S.No', key: 'sno', width: 10 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Item Name', key: 'itemName', width: 30 },
      { header: 'Vendor Name', key: 'vendorName', width: 25 },
      { header: 'Bill No', key: 'billNo', width: 15 },
      { header: 'Bill Date', key: 'billDate', width: 15 },
      { header: 'Type', key: 'type', width: 10 },
      { header: 'Total Amount (₹)', key: 'totalAmount', width: 18 }
    ];

    // Add data rows
    let totalAmount = 0;
    assets.forEach((asset, index) => {
      const row = worksheet.addRow({
        sno: index + 1,
        department: asset.department.name,
        itemName: asset.itemName || 'Multiple Items',
        vendorName: asset.vendorName,
        billNo: asset.billNo,
        billDate: asset.billDate.toLocaleDateString('en-IN'),
        type: asset.type.charAt(0).toUpperCase() + asset.type.slice(1),
        totalAmount: asset.totalAmount
      });

      // Format amount column
      row.getCell('totalAmount').numFmt = '₹#,##0.00';
      totalAmount += asset.totalAmount;
    });

    // Add summary row
    const summaryRow = worksheet.addRow({
      sno: '',
      department: '',
      itemName: '',
      vendorName: '',
      billNo: '',
      billDate: '',
      type: 'TOTAL:',
      totalAmount: totalAmount
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '366092' }
    };

    // Style summary row
    summaryRow.font = { bold: true };
    summaryRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E7E6E6' }
    };

    // Add borders
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=assets-report-${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

### 2.3 PDF Report Generation
```javascript
export const exportToPDF = async (req, res) => {
  try {
    const { departmentId, type, startDate, endDate } = req.query;

    let query = {};
    if (departmentId) query.department = departmentId;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.billDate = {};
      if (startDate) query.billDate.$gte = new Date(startDate);
      if (endDate) query.billDate.$lte = new Date(endDate);
    }

    const assets = await Asset.find(query)
      .populate('department', 'name code')
      .sort({ createdAt: -1 });

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=assets-report-${Date.now()}.pdf`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Material Inward Management System', { align: 'center' });
    doc.fontSize(16).text('Assets Report', { align: 'center' });
    doc.moveDown();

    // Report details
    doc.fontSize(12);
    if (departmentId) {
      const dept = await Department.findById(departmentId);
      doc.text(`Department: ${dept.name}`);
    }
    if (type) doc.text(`Type: ${type.charAt(0).toUpperCase() + type.slice(1)}`);
    if (startDate) doc.text(`From: ${new Date(startDate).toLocaleDateString('en-IN')}`);
    if (endDate) doc.text(`To: ${new Date(endDate).toLocaleDateString('en-IN')}`);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`);
    doc.moveDown();

    // Table headers
    const tableTop = doc.y;
    const itemCodeX = 50;
    const descriptionX = 150;
    const vendorX = 300;
    const amountX = 450;

    doc.font('Helvetica-Bold');
    doc.text('S.No', itemCodeX, tableTop);
    doc.text('Description', descriptionX, tableTop);
    doc.text('Vendor', vendorX, tableTop);
    doc.text('Amount (₹)', amountX, tableTop);

    // Draw line under headers
    doc.moveTo(itemCodeX, tableTop + 15)
       .lineTo(520, tableTop + 15)
       .stroke();

    // Table data
    doc.font('Helvetica');
    let currentY = tableTop + 25;
    let totalAmount = 0;

    assets.forEach((asset, index) => {
      if (currentY > 700) { // New page if needed
        doc.addPage();
        currentY = 50;
      }

      doc.text(index + 1, itemCodeX, currentY);
      doc.text(asset.itemName || 'Multiple Items', descriptionX, currentY, { width: 140 });
      doc.text(asset.vendorName, vendorX, currentY, { width: 140 });
      doc.text(asset.totalAmount.toLocaleString('en-IN'), amountX, currentY);

      currentY += 20;
      totalAmount += asset.totalAmount;
    });

    // Total
    doc.moveTo(itemCodeX, currentY)
       .lineTo(520, currentY)
       .stroke();
    
    doc.font('Helvetica-Bold');
    doc.text('TOTAL:', vendorX, currentY + 10);
    doc.text(`₹${totalAmount.toLocaleString('en-IN')}`, amountX, currentY + 10);

    doc.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

## 3. Notification System

### 3.1 Admin Announcement System
```javascript
// File: backend/src/controllers/announcementController.js
export const createAnnouncement = async (req, res) => {
  try {
    const { title, message, type, targetDepartments, expiresAt } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can create announcements'
      });
    }

    const announcementData = {
      title,
      message,
      type: type || 'general',
      createdBy: req.user._id
    };

    if (targetDepartments && targetDepartments.length > 0) {
      announcementData.targetDepartments = targetDepartments;
    }

    if (expiresAt) {
      announcementData.expiresAt = new Date(expiresAt);
    }

    const announcement = await Announcement.create(announcementData);
    await announcement.populate(['createdBy', 'targetDepartments']);

    res.status(201).json({
      success: true,
      data: announcement
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
```

### 3.2 Role-based Notification Filtering
```typescript
// File: frontend/src/components/NotificationPanel.tsx
export function NotificationPanel() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('announcements');

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      // Fetch announcements (all roles)
      const announcementsRes = await fetch('/api/announcements', {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
      });
      if (announcementsRes.ok) {
        const data = await announcementsRes.json();
        setAnnouncements(data.data);
      }

      // Fetch activity notifications (admin and chief officers only)
      if (user?.role === 'admin' || user?.role === 'chief-administrative-officer') {
        const activitiesRes = await fetch('/api/admin/recent-activities', {
          headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
        });
        if (activitiesRes.ok) {
          const data = await activitiesRes.json();
          setActivities(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'urgent': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'report_reminder': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'budget_release': return <DollarSign className="h-4 w-4 text-green-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="announcements">
              Announcements ({announcements.length})
            </TabsTrigger>
            {(user?.role === 'admin' || user?.role === 'chief-administrative-officer') && (
              <TabsTrigger value="activities">
                Activities ({activities.length})
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="announcements" className="space-y-3">
            {announcements.map((announcement) => (
              <div key={announcement._id} className="p-3 border rounded-lg">
                <div className="flex items-start gap-2">
                  {getNotificationIcon(announcement.type)}
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{announcement.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{announcement.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
          
          {(user?.role === 'admin' || user?.role === 'chief-administrative-officer') && (
            <TabsContent value="activities" className="space-y-3">
              {activities.map((activity) => (
                <div key={activity._id} className="p-3 border rounded-lg">
                  <div className="flex items-start gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{activity.action}</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {activity.userName} {activity.action.toLowerCase()} {activity.entityType.toLowerCase()}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
```

## 4. Responsive Design Implementation

### 4.1 Mobile-First Dashboard
```typescript
// File: frontend/src/pages/DepartmentDashboard.tsx
export default function DepartmentDashboard() {
  const { user } = useAuth();
  const { state } = useAssetFlow();
  
  // Responsive stats calculation
  const stats = useMemo(() => {
    const userAssets = user?.role === 'department-officer' 
      ? state.assets.filter(asset => asset.department._id === user.department?._id)
      : state.assets;

    const totalValue = userAssets.reduce((sum, asset) => sum + (asset.totalAmount || 0), 0);
    const capitalAssets = userAssets.filter(asset => asset.type === 'capital').length;
    const revenueAssets = userAssets.filter(asset => asset.type === 'revenue').length;

    return [
      { label: 'Total Assets', value: userAssets.length.toString(), icon: Building2 },
      { label: 'Capital Assets', value: capitalAssets.toString(), icon: TrendingUp },
      { label: 'Revenue Assets', value: revenueAssets.toString(), icon: DollarSign },
      { label: 'Total Value', value: `₹${totalValue.toLocaleString('en-IN')}`, icon: BarChart3 }
    ];
  }, [state.assets, user]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Responsive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Welcome back, {user?.name}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <Button
            onClick={() => navigate('/add-material')}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Material
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/reports')}
            className="w-full sm:w-auto"
          >
            <FileText className="h-4 w-4 mr-2" />
            Reports
          </Button>
        </div>
      </div>

      {/* Responsive Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <stat.icon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Responsive Recent Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Recent Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 text-sm font-medium">Item</th>
                  <th className="text-left p-2 text-sm font-medium hidden sm:table-cell">Vendor</th>
                  <th className="text-left p-2 text-sm font-medium hidden md:table-cell">Date</th>
                  <th className="text-right p-2 text-sm font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentAssets.map((asset) => (
                  <tr key={asset._id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div>
                        <p className="font-medium text-sm">{asset.itemName || 'Multiple Items'}</p>
                        <p className="text-xs text-gray-500 sm:hidden">{asset.vendorName}</p>
                      </div>
                    </td>
                    <td className="p-2 text-sm hidden sm:table-cell">{asset.vendorName}</td>
                    <td className="p-2 text-sm text-gray-600 hidden md:table-cell">
                      {new Date(asset.billDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-2 text-sm font-medium text-right">
                      ₹{asset.totalAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 4.2 Responsive Form Design
```typescript
// File: frontend/src/pages/CapitalForm.tsx - Responsive Form Layout
return (
  <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
    <Card>
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Add Capital Asset</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Responsive Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select {...register('department')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billDate">Bill Date</Label>
              <Input
                type="date"
                {...register('billDate')}
                className="w-full"
              />
            </div>
          </div>

          {/* Responsive Vendor Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Vendor Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendorName">Vendor Name</Label>
                <Input {...register('vendorName')} className="w-full" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Number</Label>
                <Input {...register('contactNumber')} className="w-full" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vendorAddress">Vendor Address</Label>
              <Textarea {...register('vendorAddress')} className="w-full" />
            </div>
          </div>

          {/* Responsive Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Creating...' : 'Create Asset'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
);
```

---

**End of Part 6**

*Continue to Part 7 for Deployment & Configuration*