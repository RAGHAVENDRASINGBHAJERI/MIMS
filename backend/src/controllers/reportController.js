
import Asset from '../models/Asset.js';
import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import archiver from 'archiver';
import PDFDocument from 'pdfkit';
import { getGridFS } from '../utils/gridfs.js';

export const getDepartmentReport = async (req, res, next) => {
  try {
    const { departmentId } = req.query;
    const user = req.user;

    // Role-based access control
    let filterQuery = {};

    if (user.role === 'admin' || user.role === 'chief-administrative-officer') {
      // Admin and CAO can see all departments
      if (departmentId) {
        filterQuery.department = new mongoose.Types.ObjectId(departmentId);
      }
    } else if (user.role === 'department-officer') {
      // Department officers can only see their own department
      if (!user.department) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: No department assigned to user',
          data: null
        });
      }
      filterQuery.department = user.department._id;
    } else {
      // Regular users don't have access to reports
      return res.status(403).json({
        success: false,
        message: 'Access denied: Insufficient permissions',
        data: null
      });
    }

    // Get detailed assets with populated department info
    const assets = await Asset.find(filterQuery)
      .populate('department', 'name')
      .lean()
      .sort({ billDate: -1 });

    const totalCapital = assets.reduce((sum, asset) => sum + (asset.type === 'capital' ? (asset.grandTotal || asset.totalAmount || 0) : 0), 0);
    const totalRevenue = assets.reduce((sum, asset) => sum + (asset.type === 'revenue' ? (asset.grandTotal || asset.totalAmount || 0) : 0), 0);
    const grandTotal = totalCapital + totalRevenue;

    res.json({
      success: true,
      message: 'Department report generated successfully',
      data: {
        summary: {
          totalCapital,
          totalRevenue,
          grandTotal,
          itemCount: assets.length
        },
        assets
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getVendorReport = async (req, res, next) => {
  try {
    const { vendorName, type } = req.query;
    const user = req.user;

    // Role-based access control
    let filterQuery = {};

    if (user.role === 'admin' || user.role === 'chief-administrative-officer') {
      // Admin and CAO can see all vendors
    } else if (user.role === 'department-officer') {
      // Department officers can only see vendors for their department
      if (!user.department) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: No department assigned to user',
          data: null
        });
      }
      filterQuery.department = user.department._id;
    } else {
      // Regular users don't have access to reports
      return res.status(403).json({
        success: false,
        message: 'Access denied: Insufficient permissions',
        data: null
      });
    }

    if (vendorName) {
      filterQuery.vendorName = { $regex: new RegExp(vendorName, 'i') };
    }

    if (type) {
      filterQuery.type = type;
    }

    // Get detailed assets by vendor instead of aggregated totals
    const assets = await Asset.find(filterQuery)
      .populate('department', 'name')
      .lean()
      .sort({ billDate: -1 });

    // Group by vendor for summary, but return detailed items
    const vendorGroups = {};
    assets.forEach(asset => {
      const vendor = asset.vendorName || 'Unknown Vendor';
      if (!vendorGroups[vendor]) {
        vendorGroups[vendor] = {
          _id: vendor,
          vendorName: vendor,
          items: [],
          totalAmount: 0,
          itemCount: 0,
          itemNames: [],
          departmentNames: []
        };
      }
      vendorGroups[vendor].items.push(asset);
      vendorGroups[vendor].totalAmount += (asset.grandTotal || asset.totalAmount || 0);
      vendorGroups[vendor].itemCount += 1;
      // Collect unique item names from items array or itemName
      if (asset.items && asset.items.length > 0) {
        asset.items.forEach(item => {
          if (item.particulars && !vendorGroups[vendor].itemNames.includes(item.particulars)) {
            vendorGroups[vendor].itemNames.push(item.particulars);
          }
        });
      } else if (asset.itemName) {
        if (!vendorGroups[vendor].itemNames.includes(asset.itemName)) {
          vendorGroups[vendor].itemNames.push(asset.itemName);
        }
      }
      // Collect unique department names
      const departmentName = asset.department?.name || 'N/A';
      if (!vendorGroups[vendor].departmentNames.includes(departmentName)) {
        vendorGroups[vendor].departmentNames.push(departmentName);
      }
    });

    const report = Object.values(vendorGroups).sort((a, b) => b.totalAmount - a.totalAmount);
    const grandTotal = report.reduce((sum, vendor) => sum + vendor.totalAmount, 0);

    res.json({
      success: true,
      message: 'Vendor report generated successfully',
      data: {
        summary: {
          totalCapital: 0, // Vendors don't have capital/revenue distinction
          totalRevenue: 0,
          grandTotal,
          itemCount: report.length
        },
        report
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getItemReport = async (req, res, next) => {
  try {
    const { itemName } = req.query;
    const user = req.user;

    // Role-based access control
    let filterQuery = {};

    if (user.role === 'admin' || user.role === 'chief-administrative-officer') {
      // Admin and CAO can see all items
    } else if (user.role === 'department-officer') {
      // Department officers can only see items for their department
      if (!user.department) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: No department assigned to user',
          data: null
        });
      }
      filterQuery.department = user.department._id;
    } else {
      // Regular users don't have access to reports
      return res.status(403).json({
        success: false,
        message: 'Access denied: Insufficient permissions',
        data: null
      });
    }

    // Search in both itemName and items.particulars
    if (itemName) {
      filterQuery.$or = [
        { itemName: { $regex: new RegExp(itemName, 'i') } },
        { 'items.particulars': { $regex: new RegExp(itemName, 'i') } }
      ];
    }

    const assets = await Asset.find(filterQuery)
      .populate('department', 'name')
      .lean()
      .sort({ billDate: -1 });

    // Flatten items to treat each as individual asset
    const report = [];
    assets.forEach(asset => {
      if (asset.items && asset.items.length > 0) {
        asset.items.forEach(item => {
          // Filter items by name if specified
          if (!itemName || item.particulars?.toLowerCase().includes(itemName.toLowerCase())) {
            report.push({
              ...asset,
              itemName: item.particulars,
              quantity: item.quantity,
              pricePerItem: item.rate,
              totalAmount: item.amount,
              grandTotal: item.grandTotal,
              cgst: item.cgst,
              sgst: item.sgst,
              _isIndividualItem: true
            });
          }
        });
      } else {
        // Legacy single item
        if (!itemName || asset.itemName?.toLowerCase().includes(itemName.toLowerCase())) {
          report.push(asset);
        }
      }
    });

    const totalCapital = report.reduce((sum, item) => sum + (item.type === 'capital' ? (item.grandTotal || item.totalAmount || 0) : 0), 0);
    const totalRevenue = report.reduce((sum, item) => sum + (item.type === 'revenue' ? (item.grandTotal || item.totalAmount || 0) : 0), 0);
    const grandTotal = totalCapital + totalRevenue;

    res.json({
      success: true,
      message: 'Item report generated successfully',
      data: {
        summary: {
          totalCapital,
          totalRevenue,
          grandTotal,
          itemCount: report.length
        },
        report
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getYearReport = async (req, res, next) => {
  try {
    const user = req.user;

    // Role-based access control
    let matchStage = {};

    if (user.role === 'admin' || user.role === 'chief-administrative-officer') {
      // Admin and CAO can see all years
    } else if (user.role === 'department-officer') {
      // Department officers can only see their department's year data
      if (!user.department) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: No department assigned to user',
          data: null
        });
      }
      matchStage.department = user.department._id;
    } else {
      // Regular users don't have access to reports
      return res.status(403).json({
        success: false,
        message: 'Access denied: Insufficient permissions',
        data: null
      });
    }

    const report = await Asset.aggregate([
      { $match: matchStage },
      {
        $addFields: {
          calendarYear: { $year: '$billDate' }
        }
      },
      {
        $group: {
          _id: '$calendarYear',
          totalAssets: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalCapital: { $sum: { $cond: [{ $eq: ['$type', 'capital'] }, '$totalAmount', 0] } },
          totalRevenue: { $sum: { $cond: [{ $eq: ['$type', 'revenue'] }, '$totalAmount', 0] } }
        }
      },
      {
        $sort: { _id: -1 }
      }
    ]);

    const grandTotal = report.reduce((sum, year) => sum + year.totalAmount, 0);

    res.json({
      success: true,
      message: 'Year report generated successfully',
      data: {
        summary: {
          totalCapital: report.reduce((sum, year) => sum + year.totalCapital, 0),
          totalRevenue: report.reduce((sum, year) => sum + year.totalRevenue, 0),
          grandTotal,
          itemCount: report.length
        },
        report
      }
    });
  } catch (error) {
    next(error);
  }
};

export const exportExcel = async (req, res, next) => {
  try {
    const { type, departmentId, vendorName, itemName, type: assetType, startDate, endDate } = req.query;
    const user = req.user;
    let report = [];
    let summary = null;
    let filename = '';

    // Role-based access control
    let baseFilterQuery = {};

    if (user.role === 'admin' || user.role === 'chief-administrative-officer') {
      // Admin and CAO can see all data
    } else if (user.role === 'department-officer') {
      // Department officers can only see their own department's data
      if (!user.department) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: No department assigned to user',
          data: null
        });
      }
      baseFilterQuery.department = user.department._id;
    } else {
      // Regular users don't have access to exports
      return res.status(403).json({
        success: false,
        message: 'Access denied: Insufficient permissions',
        data: null
      });
    }

    // Apply common filters
    const filterQuery = { ...baseFilterQuery };
    
    if (departmentId && departmentId !== 'all' && departmentId !== 'undefined' && mongoose.Types.ObjectId.isValid(departmentId)) {
      filterQuery.department = new mongoose.Types.ObjectId(departmentId);
    }
    
    if (assetType && assetType !== 'undefined') {
      filterQuery.type = assetType;
    }
    
    if (startDate && startDate !== 'undefined') {
      filterQuery.billDate = filterQuery.billDate || {};
      filterQuery.billDate.$gte = new Date(startDate);
    }
    
    if (endDate && endDate !== 'undefined') {
      filterQuery.billDate = filterQuery.billDate || {};
      filterQuery.billDate.$lte = new Date(endDate);
    }

    // Apply specific filters based on report type
    const reportType = Array.isArray(type) ? type[0] : type || 'combined';
    if (reportType === 'vendor' && vendorName) {
      filterQuery.vendorName = { $regex: new RegExp(vendorName, 'i') };
    }
    if (reportType === 'item' && itemName) {
      filterQuery.$or = [
        { itemName: { $regex: new RegExp(itemName, 'i') } },
        { 'items.particulars': { $regex: new RegExp(itemName, 'i') } }
      ];
    }

    // Get all assets for all report types
    report = await Asset.find(filterQuery)
      .populate('department', 'name')
      .lean()
      .sort({ billDate: -1 });

    // Set filename based on type
    const typeNames = {
      department: 'department_report.xlsx',
      vendor: 'vendor_report.xlsx', 
      item: 'item_report.xlsx',
      year: 'year_report.xlsx',
      combined: 'combined_report.xlsx'
    };
    filename = typeNames[type] || 'assets_report.xlsx';

    // Calculate summary for all report types
    const totalCapital = report.reduce((sum, asset) => sum + (asset.type === 'capital' ? (asset.grandTotal || asset.totalAmount || 0) : 0), 0);
    const totalRevenue = report.reduce((sum, asset) => sum + (asset.type === 'revenue' ? (asset.grandTotal || asset.totalAmount || 0) : 0), 0);
    const grandTotal = totalCapital + totalRevenue;
    const itemCount = report.length;

    summary = {
      totalCapital,
      totalRevenue,
      grandTotal,
      itemCount
    };

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    // Add report header information
    const reportTypeTitle = reportType.charAt(0).toUpperCase() + reportType.slice(1) + ' Report';

    // Add title row

    worksheet.addRow([reportTypeTitle]);
    worksheet.addRow([]); // Empty row

    // Style the header row
    worksheet.getRow(1).font = { bold: true, size: 10};
   

    // Add column headers
    worksheet.columns = [
      { header: 'Sl No.', key: 'slNo' },
      { header: 'College ISR No.', key: 'collegeISRNo' },
      { header: 'IT ISR No.', key: 'itISRNo' },
      { header: 'Particulars', key: 'particulars' },
      { header: 'Vendor', key: 'vendor' },
      { header: 'Bill Date', key: 'billDate' },
      { header: 'Bill No.', key: 'billNo' },
      { header: 'Quantity', key: 'quantity' },
      { header: 'Rate', key: 'rate' },
      { header: 'Amount', key: 'amount' },
      { header: 'CGST%', key: 'cgst' },
      { header: 'SGST%', key: 'sgst' },
      { header: 'Grand Total', key: 'grandTotal' },
      { header: 'Remark', key: 'remark' }
    ];

    // Map report data to flat objects for Excel rows
    let rows = [];
    let slNoCounter = 1;
    
    // For item report type, flatten individual items
    if (reportType === 'item') {
      report.forEach(asset => {
        if (Array.isArray(asset.items) && asset.items.length > 0) {
          asset.items.forEach(sub => {
            // Filter items by name if specified
            if (!itemName || sub.particulars?.toLowerCase().includes(itemName.toLowerCase())) {
              rows.push({
                slNo: slNoCounter++,
                collegeISRNo: asset.collegeISRNo || '',
                itISRNo: asset.itISRNo || '',
                particulars: sub.particulars || '',
                vendor: asset.vendorName || asset.vendor || '',
                billDate: asset.billDate ? new Date(asset.billDate).toLocaleDateString() : '',
                billNo: asset.billNo || '',
                quantity: sub.quantity || 0,
                rate: sub.rate || 0,
                amount: sub.amount || 0,
                cgst: sub.cgst || 0,
                sgst: sub.sgst || 0,
                grandTotal: sub.grandTotal || 0,
                remark: asset.remark || ''
              });
            }
          });
        } else {
          // Legacy single item
          if (!itemName || asset.itemName?.toLowerCase().includes(itemName.toLowerCase())) {
            rows.push({
              slNo: slNoCounter++,
              collegeISRNo: asset.collegeISRNo || '',
              itISRNo: asset.itISRNo || '',
              particulars: asset.itemName || '',
              vendor: asset.vendorName || asset.vendor || '',
              billDate: asset.billDate ? new Date(asset.billDate).toLocaleDateString() : '',
              billNo: asset.billNo || '',
              quantity: asset.quantity || 0,
              rate: asset.pricePerItem || 0,
              amount: asset.totalAmount || 0,
              cgst: asset.cgst || 0,
              sgst: asset.sgst || 0,
              grandTotal: asset.grandTotal || asset.totalAmount || 0,
              remark: asset.remark || ''
            });
          }
        }
      });
    } else {
      // For other report types, use existing logic
      report.forEach(item => {
        if (Array.isArray(item.items) && item.items.length > 0) {
          item.items.forEach(sub => {
            rows.push({
              slNo: slNoCounter++,
              collegeISRNo: item.collegeISRNo || '',
              itISRNo: item.itISRNo || '',
              particulars: sub.particulars || '',
              vendor: item.vendorName || item.vendor || '',
              billDate: item.billDate ? new Date(item.billDate).toLocaleDateString() : '',
              billNo: item.billNo || '',
              quantity: sub.quantity || 0,
              rate: sub.rate || 0,
              amount: sub.amount || 0,
              cgst: sub.cgst || 0,
              sgst: sub.sgst || 0,
              grandTotal: sub.grandTotal || 0,
              remark: item.remark || ''
            });
          });
        } else {
          rows.push({
            slNo: slNoCounter++,
            collegeISRNo: item.collegeISRNo || '',
            itISRNo: item.itISRNo || '',
            particulars: item.itemName || '',
            vendor: item.vendorName || item.vendor || '',
            billDate: item.billDate ? new Date(item.billDate).toLocaleDateString() : '',
            billNo: item.billNo || '',
            quantity: item.quantity || 0,
            rate: item.pricePerItem || 0,
            amount: item.totalAmount || 0,
            cgst: item.cgst || 0,
            sgst: item.sgst || 0,
            grandTotal: item.grandTotal || item.totalAmount || 0,
            remark: item.remark || ''
          });
        }
      });
    }

    if (rows.length === 0) {
      // Create at least one row with summary info
      rows.push({
        slNo: '',
        collegeISRNo: '',
        itISRNo: '',
        particulars: 'No data found for the selected filters',
        vendor: '',
        billDate: '',
        billNo: '',
        quantity: 0,
        rate: 0,
        amount: 0,
        cgst: 0,
        sgst: 0,
        grandTotal: 0,
        remark: 'Try adjusting your filters'
      });
    }

    // Add data rows starting from row 6 (after headers)
    rows.forEach(row => {
      worksheet.addRow(row);
    });

    // Add total row at the end
    if (rows.length > 0) {
      const totalAmount = rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
      const totalGrandTotal = rows.reduce((sum, row) => sum + (Number(row.grandTotal) || 0), 0);
      const totalQuantity = rows.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);

      worksheet.addRow({}); // Empty row for separation
      worksheet.addRow({
        slNo: '',
        collegeISRNo: '',
        itISRNo: '',
        particulars: 'TOTAL',
        vendor: '',
        billDate: '',
        billNo: '',
        quantity: totalQuantity,
        rate: '',
        amount: totalAmount,
        cgst: '',
        sgst: '',
        grandTotal: totalGrandTotal,
        remark: ''
      });
    }

    // Auto-fit column widths
    worksheet.columns.forEach(column => {
      column.width = undefined;
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

export const exportWord = async (req, res, next) => {
  try {
    const { type } = req.query;
    const user = req.user;
    let report = [];
    let summary = null;
    let filename = '';

    // Role-based access control
    let baseMatchStage = {};

    if (user.role === 'admin' || user.role === 'chief-administrative-officer') {
      // Admin and CAO can see all data
    } else if (user.role === 'department-officer') {
      // Department officers can only see their own department's data
      if (!user.department) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: No department assigned to user',
          data: null
        });
      }
      baseMatchStage.department = user.department._id;
    } else {
      // Regular users don't have access to exports
      return res.status(403).json({
        success: false,
        message: 'Access denied: Insufficient permissions',
        data: null
      });
    }

    switch (type) {
      case 'department': {
        const departmentId = req.query.departmentId;
        const matchStage = { ...baseMatchStage };
        if (departmentId) {
          matchStage.department = new mongoose.Types.ObjectId(departmentId);
        }
        report = await Asset.aggregate([
          { $match: matchStage },
          { $lookup: { from: 'departments', localField: 'department', foreignField: '_id', as: 'dept' } },
          { $unwind: '$dept' },
          { $group: { _id: '$dept.name', totalAmount: { $sum: '$totalAmount' }, count: { $sum: 1 }, totalCapital: { $sum: { $cond: [{ $eq: ['$type', 'capital'] }, '$totalAmount', 0] } }, totalRevenue: { $sum: { $cond: [{ $eq: ['$type', 'revenue'] }, '$totalAmount', 0] } } } },
          { $sort: { totalAmount: -1 } }
        ]);
        // Rename _id to departmentName for clarity
        report = report.map(item => ({
          departmentName: item._id,
          totalAmount: item.totalAmount,
          count: item.count,
          totalCapital: item.totalCapital,
          totalRevenue: item.totalRevenue
        }));
        filename = 'department_report.docx';
        break;
      }
      case 'vendor': {
        const vendorName = req.query.vendorName;
        const matchStage = { ...baseMatchStage };
        if (vendorName) {
          matchStage.vendorName = { $regex: new RegExp(vendorName, 'i') };
        }
        report = await Asset.aggregate([
          { $match: matchStage },
          { $group: { _id: '$vendorName', totalAmount: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
          { $sort: { totalAmount: -1 } }
        ]);
        filename = 'vendor_report.docx';
        break;
      }
      case 'year':
        report = await Asset.aggregate([
          { $match: baseMatchStage },
          {
            $addFields: {
              calendarYear: { $year: '$billDate' }
            }
          },
          {
            $group: {
              _id: '$calendarYear',
              totalAssets: { $sum: 1 },
              totalAmount: { $sum: '$totalAmount' },
              totalCapital: { $sum: { $cond: [{ $eq: ['$type', 'capital'] }, '$totalAmount', 0] } },
              totalRevenue: { $sum: { $cond: [{ $eq: ['$type', 'revenue'] }, '$totalAmount', 0] } }
            }
          },
          {
            $sort: { _id: -1 }
          }
        ]);
        filename = 'year_report.docx';
        break;
      default:
        const { departmentId, type: assetType, startDate, endDate } = req.query;

        const filterQuery = { ...baseMatchStage };

        if (departmentId) {
          filterQuery.department = new mongoose.Types.ObjectId(departmentId);
        }

        if (assetType) {
          filterQuery.type = assetType;
        }

        if (startDate || endDate) {
          filterQuery.billDate = {};
          if (startDate) {
            filterQuery.billDate.$gte = new Date(startDate);
          }
          if (endDate) {
            filterQuery.billDate.$lte = new Date(endDate);
          }
        }

        report = await Asset.find(filterQuery)
          .populate('department', 'name')
          .lean()
          .sort({ billDate: -1 });

        // Calculate summary for combined report
        const totalCapital = report.reduce((sum, asset) => sum + (asset.type === 'capital' ? (asset.totalAmount || 0) : 0), 0);
        const totalRevenue = report.reduce((sum, asset) => sum + (asset.type === 'revenue' ? (asset.totalAmount || 0) : 0), 0);
        const grandTotal = totalCapital + totalRevenue;
        const itemCount = report.length;

        summary = {
          totalCapital,
          totalRevenue,
          grandTotal,
          itemCount
        };

        filename = 'assets_report.docx';
    }

    const children = [
      new Paragraph({
        children: [
          new TextRun({
            text: `AssetFlow ${type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Assets'} Report`,
            bold: true,
            size: 32
          })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Generated on: ${new Date().toLocaleDateString()}`,
            size: 24
          })
        ]
      })
    ];

    // Add summary for combined report
    if (summary) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Summary:',
              bold: true,
              size: 24
            })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Total Capital Assets: ₹${summary.totalCapital.toLocaleString()}`,
              size: 20
            })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Total Revenue Assets: ₹${summary.totalRevenue.toLocaleString()}`,
              size: 20
            })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Grand Total: ₹${summary.grandTotal.toLocaleString()}`,
              size: 20
            })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Total Items: ${summary.itemCount}`,
              size: 20
            })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: '',
              size: 20
            })
          ]
        })
      );
    }

    // Add report items
    children.push(...report.map(item => new Paragraph({
      children: [
        new TextRun({
          text: `${item.itemName || item._id}: ₹${item.totalAmount || 0} (${item.count || 1} items) - Department: ${item.department?.name || 'N/A'} - Category: ${item.category || 'N/A'} - Quantity: ${item.quantity || 'N/A'} - Price Per Item: ${item.pricePerItem || 'N/A'} - Vendor: ${item.vendorName || 'N/A'} - Bill No: ${item.billNo || 'N/A'} - Bill Date: ${item.billDate ? new Date(item.billDate).toLocaleDateString() : 'N/A'} - Academic Year: ${item.academicYear || 'N/A'}`,
          size: 20
        })
      ]
    })));

    const doc = new Document({
      sections: [{
        properties: {},
        children
      }]
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

export const getCombinedReport = async (req, res, next) => {
  try {
    const { departmentId, type, startDate, endDate } = req.query;
    const user = req.user;

    // Role-based access control
    let filterQuery = {};

    if (user.role === 'admin' || user.role === 'chief-administrative-officer') {
      // Admin and CAO can see all assets
      if (departmentId) {
        filterQuery.department = new mongoose.Types.ObjectId(departmentId);
      }
    } else if (user.role === 'department-officer') {
      // Department officers can only see their own department's assets
      if (!user.department) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: No department assigned to user',
          data: null
        });
      }
      filterQuery.department = user.department._id;
    } else {
      // Regular users don't have access to reports
      return res.status(403).json({
        success: false,
        message: 'Access denied: Insufficient permissions',
        data: null
      });
    }

    if (type) {
      filterQuery.type = type;
    }

    if (startDate || endDate) {
      filterQuery.billDate = {};
      if (startDate) {
        filterQuery.billDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filterQuery.billDate.$lte = new Date(endDate);
      }
    }

    const assets = await Asset.find(filterQuery).populate('department', 'name').lean();

    const totalCapital = assets.reduce((sum, asset) => sum + (asset.type === 'capital' ? (asset.grandTotal || asset.totalAmount || 0) : 0), 0);
    const totalRevenue = assets.reduce((sum, asset) => sum + (asset.type === 'revenue' ? (asset.grandTotal || asset.totalAmount || 0) : 0), 0);
    const grandTotal = totalCapital + totalRevenue;
    const itemCount = assets.length;

    res.json({
      success: true,
      message: 'Combined report generated successfully',
      data: {
        summary: {
          totalCapital,
          totalRevenue,
          grandTotal,
          itemCount
        },
        assets
      }
    });
  } catch (error) {
    next(error);
  }
};



export const exportBillsZip = async (req, res, next) => {
  try {
    const { departmentId, type, startDate, endDate } = req.query;

    const filterQuery = {};

    if (departmentId) {
      filterQuery.department = new mongoose.Types.ObjectId(departmentId);
    }

    if (type) {
      filterQuery.type = type;
    }

    if (startDate || endDate) {
      filterQuery.billDate = {};
      if (startDate) {
        filterQuery.billDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filterQuery.billDate.$lte = new Date(endDate);
      }
    }

    const assets = await Asset.find(filterQuery).populate('department', 'name').lean();

    if (assets.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No assets found with bills',
        data: null 
      });
    }

    // Set response headers for ZIP download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="bills_${new Date().toISOString().split('T')[0]}.zip"`);

    // Create archiver instance
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Handle archiver events
    archive.on('error', (err) => {
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false, 
          message: 'Error creating ZIP file'
        });
      }
    });

    // Pipe archive to response
    archive.pipe(res);

    const gfs = getGridFS();
    let filesAdded = 0;

    // Process each asset with a bill file
    for (const asset of assets) {
      if (asset.billFileId) {
        try {
          const downloadStream = gfs.openDownloadStream(asset.billFileId);
          
          // Create a readable stream for archiver
          const fileExtension = 'pdf'; // Default to PDF, could be determined from metadata
          const filename = `${asset.itemName || 'Asset'}_${asset.billNo || asset._id}.${fileExtension}`;
          
          // Add file to archive
          archive.append(downloadStream, { name: filename });
          filesAdded++;
          
        } catch (fileError) {
          // Continue with other files
        }
      }
    }

    // Finalize the archive
    await archive.finalize();

  } catch (error) {
    if (!res.headersSent) {
      next(error);
    }
  }
};

export const exportMergedBillsPDF = async (req, res, next) => {
  try {
    const { departmentId, type, startDate, endDate } = req.query;
    const user = req.user;

    // Role-based access control
    let filterQuery = {};

    if (user.role === 'admin' || user.role === 'chief-administrative-officer') {
      if (departmentId) {
        filterQuery.department = new mongoose.Types.ObjectId(departmentId);
      }
    } else if (user.role === 'department-officer') {
      if (!user.department) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: No department assigned to user'
        });
      }
      filterQuery.department = user.department._id;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Insufficient permissions'
      });
    }

    if (type) {
      filterQuery.type = type;
    }

    if (startDate || endDate) {
      filterQuery.billDate = {};
      if (startDate) {
        filterQuery.billDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filterQuery.billDate.$lte = new Date(endDate);
      }
    }

    const assets = await Asset.find(filterQuery)
      .populate('department', 'name')
      .lean()
      .sort({ billDate: -1 });

    if (assets.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No assets found for merging'
      });
    }

    // Create a new PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="merged_bills_${new Date().toISOString().split('T')[0]}.pdf"`);
    
    // Pipe the PDF to response
    doc.pipe(res);

    // Add title page
    doc.fontSize(20).text('Asset Bills Report', { align: 'center' });
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // Add summary
    const totalAmount = assets.reduce((sum, asset) => sum + (asset.grandTotal || asset.totalAmount || 0), 0);
    const capitalAssets = assets.filter(a => a.type === 'capital');
    const revenueAssets = assets.filter(a => a.type === 'revenue');
    
    doc.fontSize(14).text('Summary:', { underline: true });
    doc.fontSize(12)
      .text(`Total Assets: ${assets.length}`)
      .text(`Capital Assets: ${capitalAssets.length}`)
      .text(`Revenue Assets: ${revenueAssets.length}`)
      .text(`Total Amount: ₹${totalAmount.toLocaleString()}`)
      .moveDown(2);

    // Add detailed asset information
    doc.fontSize(14).text('Asset Details:', { underline: true });
    doc.moveDown();

    assets.forEach((asset, index) => {
      // Add page break for each asset (except first)
      if (index > 0) {
        doc.addPage();
      }

      doc.fontSize(12)
        .text(`${index + 1}. Bill #${asset.billNo || 'N/A'}`, { underline: true })
        .text(`Date: ${asset.billDate ? new Date(asset.billDate).toLocaleDateString() : 'N/A'}`)
        .text(`Department: ${asset.department?.name || 'N/A'}`)
        .text(`Type: ${asset.type || 'N/A'}`)
        .text(`Vendor: ${asset.vendorName || 'N/A'}`)
        .text(`Contact: ${asset.contactNumber || 'N/A'}`)
        .text(`Email: ${asset.email || 'N/A'}`)
        .moveDown();

      // Add items table if available
      if (asset.items && asset.items.length > 0) {
        doc.text('Items:', { underline: true });
        
        // Table headers
        const startX = 50;
        let currentY = doc.y;
        
        doc.text('Particulars', startX, currentY, { width: 120 })
           .text('Qty', startX + 120, currentY, { width: 40 })
           .text('Rate', startX + 160, currentY, { width: 60 })
           .text('CGST%', startX + 220, currentY, { width: 50 })
           .text('SGST%', startX + 270, currentY, { width: 50 })
           .text('Total', startX + 320, currentY, { width: 80 });
        
        currentY += 20;
        
        // Draw line under headers
        doc.moveTo(startX, currentY).lineTo(startX + 400, currentY).stroke();
        currentY += 10;
        
        // Add items
        asset.items.forEach(item => {
          doc.text(item.particulars || '', startX, currentY, { width: 120 })
             .text((item.quantity || 0).toString(), startX + 120, currentY, { width: 40 })
             .text(`₹${(item.rate || 0).toLocaleString()}`, startX + 160, currentY, { width: 60 })
             .text(`${item.cgst || 0}%`, startX + 220, currentY, { width: 50 })
             .text(`${item.sgst || 0}%`, startX + 270, currentY, { width: 50 })
             .text(`₹${(item.grandTotal || 0).toLocaleString()}`, startX + 320, currentY, { width: 80 });
          currentY += 15;
        });
        
        // Total line
        currentY += 10;
        doc.moveTo(startX, currentY).lineTo(startX + 400, currentY).stroke();
        currentY += 10;
        
        const assetTotal = asset.grandTotal || asset.totalAmount || 0;
        doc.fontSize(12).text(`Asset Total: ₹${assetTotal.toLocaleString()}`, startX + 250, currentY, { width: 150 });
      } else {
        // Legacy single item display
        doc.text(`Item: ${asset.itemName || 'N/A'}`)
           .text(`Quantity: ${asset.quantity || 'N/A'}`)
           .text(`Price per Item: ₹${(asset.pricePerItem || 0).toLocaleString()}`)
           .text(`Total Amount: ₹${(asset.totalAmount || 0).toLocaleString()}`);
      }
      
      if (asset.remark) {
        doc.moveDown().text(`Remark: ${asset.remark}`);
      }
      
      doc.moveDown(2);
    });

    // Finalize the PDF
    doc.end();

  } catch (error) {
    if (!res.headersSent) {
      next(error);
    }
  }
};
