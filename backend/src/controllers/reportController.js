
import Asset from '../models/Asset.js';
import Department from '../models/Department.js';
import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import JSZip from 'jszip';
import archiver from 'archiver';
import { getGridFS } from '../utils/gridfs.js';
import PDFDocument from 'pdfkit';

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

    const filterQuery = {};
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

export const exportPDF = async (req, res, next) => {
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

    const assets = await Asset.find(filterQuery)
      .populate('department', 'name')
      .lean()
      .sort({ billDate: -1 });

    // Flatten items for PDF
    const flattenedRows = assets.flatMap(asset => {
      if (Array.isArray(asset.items) && asset.items.length > 0) {
        return asset.items.map((item, idx) => ({
          slNo: idx + 1,
          date: asset.createdAt ? new Date(asset.createdAt).toLocaleDateString() : '',
          collegeISRNo: asset.collegeISRNo || '',
          itISRNo: asset.itISRNo || '',
          particulars: item.particulars || '',
          vendor: asset.vendorName || asset.vendor || '',
          billDate: asset.billDate ? new Date(asset.billDate).toLocaleDateString() : '',
          billNo: asset.billNo || '',
          quantity: item.quantity || '',
          rate: item.rate || '',
          amount: item.amount || '',
          cgst: item.cgst || '',
          sgst: item.sgst || '',
          grandTotal: item.grandTotal || '',
          remark: asset.remark || ''
        }));
      }
      return [{
        slNo: 1,
        date: asset.createdAt ? new Date(asset.createdAt).toLocaleDateString() : '',
        collegeISRNo: asset.collegeISRNo || '',
        itISRNo: asset.itISRNo || '',
        particulars: asset.itemName || '',
        vendor: asset.vendorName || asset.vendor || '',
        billDate: asset.billDate ? new Date(asset.billDate).toLocaleDateString() : '',
        billNo: asset.billNo || '',
        quantity: asset.quantity || '',
        rate: asset.pricePerItem || '',
        amount: asset.totalAmount || '',
        cgst: asset.cgst || '',
        sgst: asset.sgst || '',
        grandTotal: asset.grandTotal || '',
        remark: asset.remark || ''
      }];
    });

    const doc = new PDFDocument({ margin: 50 });
    const filename = `assets_report_${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('AssetFlow Report', { align: 'center' });
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // Table headers
    const headers = ['Sl No', 'Date', 'College ISR', 'IT ISR', 'Particulars', 'Vendor', 'Bill Date', 'Bill No', 'Qty', 'Rate', 'Amount', 'CGST', 'SGST', 'Grand Total', 'Remark'];
    const colWidths = [40, 60, 80, 80, 120, 100, 80, 80, 40, 60, 80, 50, 50, 80, 100];
    let x = 50;

    headers.forEach((header, i) => {
      doc.fontSize(8).text(header, x, doc.y, { width: colWidths[i], align: 'left' });
      x += colWidths[i];
    });

    doc.moveDown(1);
    doc.line(50, doc.y, 50 + colWidths.reduce((a, b) => a + b, 0), doc.y);
    doc.moveDown(0.5);

    // Table rows
    flattenedRows.forEach(row => {
      x = 50;
      const rowData = [
        row.slNo.toString(),
        row.date,
        row.collegeISRNo,
        row.itISRNo,
        row.particulars,
        row.vendor,
        row.billDate,
        row.billNo,
        row.quantity.toString(),
        row.rate.toString(),
        row.amount.toString(),
        row.cgst.toString(),
        row.sgst.toString(),
        row.grandTotal.toString(),
        row.remark
      ];

      rowData.forEach((data, i) => {
        doc.fontSize(7).text(data || '', x, doc.y, { width: colWidths[i], align: 'left' });
        x += colWidths[i];
      });

      doc.moveDown(0.8);

      // Add new page if needed
      if (doc.y > 700) {
        doc.addPage();
      }
    });

    // Add totals
    const totalAmount = flattenedRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
    const totalCGST = flattenedRows.reduce((sum, row) => sum + (Number(row.cgst) || 0), 0);
    const totalSGST = flattenedRows.reduce((sum, row) => sum + (Number(row.sgst) || 0), 0);
    const totalGrandTotal = flattenedRows.reduce((sum, row) => sum + (Number(row.grandTotal) || 0), 0);

    doc.moveDown(1);
    doc.line(50, doc.y, 50 + colWidths.reduce((a, b) => a + b, 0), doc.y);
    doc.moveDown(0.5);

    x = 50;
    const totalRow = ['', '', '', '', 'TOTAL', '', '', '', '', '', totalAmount.toString(), totalCGST.toString(), totalSGST.toString(), totalGrandTotal.toString(), ''];
    totalRow.forEach((data, i) => {
      doc.fontSize(8).text(data || '', x, doc.y, { width: colWidths[i], align: 'left' });
      x += colWidths[i];
    });

    doc.end();
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
