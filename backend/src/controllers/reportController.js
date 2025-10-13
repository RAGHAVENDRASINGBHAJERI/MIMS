
import Asset from '../models/Asset.js';
import Department from '../models/Department.js';
import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, TextRun } from 'docx';

export const getDepartmentReport = async (req, res, next) => {
  try {
    const { departmentId } = req.query;

    const matchStage = departmentId
      ? { $match: { department: new mongoose.Types.ObjectId(departmentId) } }
      : { $match: {} };

    // Instead of grouping by department, return detailed assets with populated department info
    const assets = await Asset.find(matchStage.$match)
      .populate('department', 'name')
      .lean()
      .sort({ billDate: -1 });

    const totalCapital = assets.reduce((sum, asset) => sum + (asset.type === 'capital' ? (asset.totalAmount || 0) : 0), 0);
    const totalRevenue = assets.reduce((sum, asset) => sum + (asset.type === 'revenue' ? (asset.totalAmount || 0) : 0), 0);
    const grandTotal = totalCapital + totalRevenue;

    res.json({
      success: true,
      data: {
        assets,
        totalCapital,
        totalRevenue,
        grandTotal,
        itemCount: assets.length
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getVendorReport = async (req, res, next) => {
  try {
    const { vendorName } = req.query;

    const matchStage = vendorName
      ? { $match: { vendorName: { $regex: new RegExp(vendorName, 'i') } } }
      : { $match: {} };

    const report = await Asset.aggregate([
      matchStage,
      {
        $group: {
          _id: '$vendorName',
          totalAssets: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          vendorDetails: { $first: { address: '$vendorAddress', contact: '$contactNumber', email: '$email' } }
        }
      },
      {
        $sort: { totalAmount: -1 }
      }
    ]);

    const grandTotal = report.reduce((sum, vendor) => sum + vendor.totalAmount, 0);

    res.json({
      success: true,
      data: {
        report,
        grandTotal,
        totalVendors: report.length
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getItemReport = async (req, res, next) => {
  try {
    const { itemName } = req.query;

    const filterQuery = {};
    if (itemName) {
      filterQuery.itemName = { $regex: new RegExp(itemName, 'i') };
    }

    const report = await Asset.find(filterQuery)
      .populate('department', 'name')
      .lean()
      .sort({ billDate: -1 });

    const grandTotal = report.reduce((sum, item) => sum + (item.totalAmount || 0), 0);

    res.json({
      success: true,
      data: {
        report,
        grandTotal,
        totalItems: report.length
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getYearReport = async (req, res, next) => {
  try {
    const report = await Asset.aggregate([
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

    const grandTotal = report.reduce((sum, year) => sum + year.totalAmount, 0);

    res.json({
      success: true,
      data: {
        report,
        grandTotal,
        totalYears: report.length
      }
    });
  } catch (error) {
    next(error);
  }
};

export const exportExcel = async (req, res, next) => {
  try {
    const { type } = req.query;
    let report = [];
    let summary = null;
    let filename = '';

    switch (type) {
    case 'department': {
      const departmentId = req.query.departmentId;
      const matchStage = departmentId
        ? { $match: { department: new mongoose.Types.ObjectId(departmentId) } }
        : { $match: {} };
      report = await Asset.aggregate([
        { $lookup: { from: 'departments', localField: 'department', foreignField: '_id', as: 'dept' } },
        { $unwind: '$dept' },
        matchStage,
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
      const matchStage = vendorName
        ? { $match: { vendorName: { $regex: new RegExp(vendorName, 'i') } } }
        : { $match: {} };
      report = await Asset.aggregate([
        matchStage,
        { $group: { _id: '$vendorName', totalAmount: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
        { $sort: { totalAmount: -1 } }
      ]);
      filename = 'vendor_report.xlsx';
      break;
    }
      case 'year':
        report = await Asset.aggregate([
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
        report = await Asset.find()
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
        { header: 'IGST', key: 'igst', width: 10 },
        { header: 'CGST', key: 'cgst', width: 10 },
        { header: 'SGST', key: 'sgst', width: 10 },
        { header: 'Grand Total', key: 'grandTotal', width: 15 },
        { header: 'Remark', key: 'remark', width: 25 }
      ];
    }

    // Map report data to flat objects for Excel rows
    const rows = report.map(item => {
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
      return {
        slNo: report.indexOf(item) + 1,
        date: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '',
        collegeISRNo: item.collegeISRNo || '',
        itISRNo: item.itISRNo || '',
        particulars: item.itemName || '',
        vendor: item.vendorName || '',
        billDate: item.billDate ? new Date(item.billDate).toLocaleDateString() : '',
        billNo: item.billNo || '',
        quantity: item.quantity || '',
        rate: item.pricePerItem || '',
        amount: item.totalAmount || '',
        igst: item.igst || '',
        cgst: item.cgst || '',
        sgst: item.sgst || '',
        grandTotal: item.grandTotal || '',
        remark: item.remark || ''
      };
    });

    console.log('Excel worksheet columns:', worksheet.columns.map(c => c.key));
    console.log('First 3 rows to add:', rows.slice(0, 3));

    worksheet.addRows(rows);

    // Add summary rows for combined report at the end
    if (summary) {
      worksheet.addRow({}); // Empty row for separation
      worksheet.addRow({ slNo: 'Summary', date: '', collegeISRNo: '', itISRNo: '', particulars: '', vendor: '', billDate: '', billNo: '', quantity: '', rate: '', amount: '', igst: '', cgst: '', sgst: '', grandTotal: '', remark: '' });
      worksheet.addRow({ slNo: 'Total Capital Assets', date: '', collegeISRNo: '', itISRNo: '', particulars: '', vendor: '', billDate: '', billNo: '', quantity: '', rate: '', amount: summary.totalCapital, igst: '', cgst: '', sgst: '', grandTotal: '', remark: '' });
      worksheet.addRow({ slNo: 'Total Revenue Assets', date: '', collegeISRNo: '', itISRNo: '', particulars: '', vendor: '', billDate: '', billNo: '', quantity: '', rate: '', amount: summary.totalRevenue, igst: '', cgst: '', sgst: '', grandTotal: '', remark: '' });
      worksheet.addRow({ slNo: 'Grand Total', date: '', collegeISRNo: '', itISRNo: '', particulars: '', vendor: '', billDate: '', billNo: '', quantity: '', rate: '', amount: summary.grandTotal, igst: '', cgst: '', sgst: '', grandTotal: '', remark: '' });
      worksheet.addRow({ slNo: 'Total Items', date: '', collegeISRNo: '', itISRNo: '', particulars: '', vendor: '', billDate: '', billNo: '', quantity: summary.itemCount, rate: '', amount: '', igst: '', cgst: '', sgst: '', grandTotal: '', remark: '' });
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
    let report = [];
    let summary = null;
    let filename = '';

    switch (type) {
      case 'department':
        report = await Asset.aggregate([
          { $lookup: { from: 'departments', localField: 'department', foreignField: '_id', as: 'dept' } },
          { $unwind: '$dept' },
          { $group: { _id: '$dept.name', totalAmount: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
          { $sort: { totalAmount: -1 } }
        ]);
        filename = 'department_report.docx';
        break;
      case 'year':
        report = await Asset.aggregate([
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
        filename = 'year_report.docx';
        break;
      default:
        report = await Asset.find()
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

    const totalCapital = assets.reduce((sum, asset) => sum + (asset.type === 'capital' ? (asset.totalAmount || 0) : 0), 0);
    const totalRevenue = assets.reduce((sum, asset) => sum + (asset.type === 'revenue' ? (asset.totalAmount || 0) : 0), 0);
    const grandTotal = totalCapital + totalRevenue;
    const itemCount = assets.length;

    res.json({
      success: true,
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
