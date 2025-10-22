
import Asset from '../models/Asset.js';
import Department from '../models/Department.js';
import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import JSZip from 'jszip';
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

    const totalCapital = assets.reduce((sum, asset) => sum + (asset.type === 'capital' ? (asset.totalAmount || 0) : 0), 0);
    const totalRevenue = assets.reduce((sum, asset) => sum + (asset.type === 'revenue' ? (asset.totalAmount || 0) : 0), 0);
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
          vendorName: vendor,
          items: [],
          totalAmount: 0,
          itemCount: 0,
          itemNames: [],
          departmentNames: []
        };
      }
      vendorGroups[vendor].items.push(asset);
      vendorGroups[vendor].totalAmount += asset.totalAmount || 0;
      vendorGroups[vendor].itemCount += 1;
      // Collect unique item names
      const itemName = asset.itemName || 'N/A';
      if (!vendorGroups[vendor].itemNames.includes(itemName)) {
        vendorGroups[vendor].itemNames.push(itemName);
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

    if (itemName) {
      filterQuery.itemName = { $regex: new RegExp(itemName, 'i') };
    }

    const report = await Asset.find(filterQuery)
      .populate('department', 'name')
      .lean()
      .sort({ billDate: -1 });

    const totalCapital = report.reduce((sum, item) => sum + (item.type === 'capital' ? (item.totalAmount || 0) : 0), 0);
    const totalRevenue = report.reduce((sum, item) => sum + (item.type === 'revenue' ? (item.totalAmount || 0) : 0), 0);
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
      // Rename _id to departmentName for clarity in frontend
      report = report.map(item => ({
        departmentName: item._id,
        totalAmount: item.totalAmount,
        count: item.count,
        totalCapital: item.totalCapital,
        totalRevenue: item.totalRevenue
      }));
      // Calculate summary totals
      const totalCapital = report.reduce((sum, item) => sum + item.totalCapital, 0);
      const totalRevenue = report.reduce((sum, item) => sum + item.totalRevenue, 0);
      const grandTotal = totalCapital + totalRevenue;
      filename = 'department_report.xlsx';
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
      filename = 'vendor_report.xlsx';
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
              totalAmount: { $sum: '$totalAmount' }
            }
          },
          {
            $sort: { _id: -1 }
          }
        ]);
        filename = 'year_report.xlsx';
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

        filename = 'assets_report.xlsx';
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    // Add headers
    if (type === 'department') {
      worksheet.columns = [
        { header: 'Department', key: 'departmentName', width: 30 },
        { header: 'Total Amount', key: 'totalAmount', width: 15 },
        { header: 'Asset Count', key: 'count', width: 15 }
      ];
    } else if (type === 'vendor') {
      worksheet.columns = [
        { header: 'Vendor', key: '_id', width: 30 },
        { header: 'Total Amount', key: 'totalAmount', width: 15 },
        { header: 'Asset Count', key: 'count', width: 15 }
      ];
    } else if (type === 'year') {
      worksheet.columns = [
        { header: 'Year', key: '_id', width: 15 },
        { header: 'Total Assets', key: 'totalAssets', width: 15 },
        { header: 'Total Amount', key: 'totalAmount', width: 15 }
      ];
    } else {
      worksheet.columns = [
        { header: 'Sl No.', key: 'slNo', width: 10 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'College ISR No.', key: 'collegeISRNo', width: 20 },
        { header: 'IT ISR No.', key: 'itISRNo', width: 20 },
        { header: 'Particulars', key: 'particulars', width: 30 },
        { header: 'Vendor', key: 'vendor', width: 25 },
        { header: 'Bill Date', key: 'billDate', width: 15 },
        { header: 'Bill No.', key: 'billNo', width: 20 },
        { header: 'Quantity', key: 'quantity', width: 15 },
        { header: 'Rate', key: 'rate', width: 15 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'CGST', key: 'cgst', width: 15 },
        { header: 'SGST', key: 'sgst', width: 15 },
        { header: 'Grand Total', key: 'grandTotal', width: 15 },
        { header: 'Remark', key: 'remark', width: 25 }
      ];
    }

    // Map report data to flat objects for Excel rows
    const rows = report.flatMap(item => {
      if (type === 'vendor') {
        return {
          _id: item._id || '',
          totalAmount: item.totalAmount || '',
          count: item.count || ''
        };
      } else if (type === 'year') {
        return {
          _id: item._id || '',
          totalAssets: item.totalAssets || '',
          totalAmount: item.totalAmount || ''
        };
      } else if (type === 'department') {
        return {
          departmentName: item.departmentName || '',
          totalAmount: item.totalAmount || '',
          count: item.count || ''
        };
      }
      // Flatten items per bill; if no items array, fallback to legacy fields
      if (Array.isArray(item.items) && item.items.length > 0) {
        return item.items.map((sub, idx) => ({
          slNo: idx + 1,
          date: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '',
          collegeISRNo: item.collegeISRNo || '',
          itISRNo: item.itISRNo || '',
          particulars: sub.particulars || '',
          vendor: item.vendorName || item.vendor || '',
          billDate: item.billDate ? new Date(item.billDate).toLocaleDateString() : '',
          billNo: item.billNo || '',
          quantity: sub.quantity || '',
          rate: sub.rate || '',
          amount: sub.amount || '',
          cgst: sub.cgst || '',
          sgst: sub.sgst || '',
          grandTotal: sub.grandTotal || '',
          remark: item.remark || ''
        }));
      }
      return [{
        slNo: 1,
        date: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '',
        collegeISRNo: item.collegeISRNo || '',
        itISRNo: item.itISRNo || '',
        particulars: item.itemName || '',
        vendor: item.vendorName || item.vendor || '',
        billDate: item.billDate ? new Date(item.billDate).toLocaleDateString() : '',
        billNo: item.billNo || '',
        quantity: item.quantity || '',
        rate: item.pricePerItem || '',
        amount: item.totalAmount || '',
        cgst: item.cgst || '',
        sgst: item.sgst || '',
        grandTotal: item.grandTotal || '',
        remark: item.remark || ''
      }];
    });

    console.log('Excel worksheet columns:', worksheet.columns.map(c => c.key));
    console.log('First 3 rows to add:', rows.slice(0, 3));

    worksheet.addRows(rows);

    // Add total row for combined report at the end
    if (summary) {
      const totalAmount = rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
      const totalCGST = rows.reduce((sum, row) => sum + (Number(row.cgst) || 0), 0);
      const totalSGST = rows.reduce((sum, row) => sum + (Number(row.sgst) || 0), 0);
      const totalGrandTotal = rows.reduce((sum, row) => sum + (Number(row.grandTotal) || 0), 0);

      worksheet.addRow({}); // Empty row for separation
      worksheet.addRow({
        slNo: '',
        date: '',
        collegeISRNo: '',
        itISRNo: '',
        particulars: 'Total',
        vendor: '',
        billDate: '',
        billNo: '',
        quantity: '',
        rate: '',
        amount: totalAmount,
        cgst: totalCGST,
        sgst: totalSGST,
        grandTotal: totalGrandTotal,
        remark: ''
      });
    }

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

    const totalCapital = assets.reduce((sum, asset) => sum + (asset.type === 'capital' ? (asset.totalAmount || 0) : 0), 0);
    const totalRevenue = assets.reduce((sum, asset) => sum + (asset.type === 'revenue' ? (asset.totalAmount || 0) : 0), 0);
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
      console.error('Archive error:', err);
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false, 
          message: 'Error creating ZIP file',
          error: err.message 
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
          console.error(`Error processing file for asset ${asset._id}:`, fileError);
          // Continue with other files
        }
      }
    }

    // Finalize the archive
    await archive.finalize();

    console.log(`Successfully created ZIP with ${filesAdded} files`);

  } catch (error) {
    console.error('Export bills ZIP error:', error);
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
    console.error('Export merged bills PDF error:', error);
    if (!res.headersSent) {
      next(error);
    }
  }
};
