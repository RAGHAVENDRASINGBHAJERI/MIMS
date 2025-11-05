
import Asset from '../models/Asset.js';
import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import archiver from 'archiver';
import PDFDocument from 'pdfkit';
import { getGridFS } from '../utils/gridfs.js';

export const getDepartmentReport = async (req, res, next) => {
  try {
    const { departmentId, type, startDate, endDate } = req.query;
    const user = req.user;

    // Role-based access control
    let filterQuery = {};

    if (user.role === 'admin' || user.role === 'chief-administrative-officer') {
      // Admin and CAO can see all departments
      if (departmentId && departmentId !== 'all') {
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

    // Apply additional filters
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

    // Get detailed assets with populated department info
    const assets = await Asset.find(filterQuery)
      .populate('department', 'name')
      .lean()
      .sort({ billDate: -1 });

    const totalCapital = assets.reduce((sum, asset) => sum + (asset.type === 'capital' ? (Number(asset.grandTotal) || Number(asset.totalAmount) || 0) : 0), 0);
    const totalRevenue = assets.reduce((sum, asset) => sum + (asset.type === 'revenue' ? (Number(asset.grandTotal) || Number(asset.totalAmount) || 0) : 0), 0);
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
    const { vendorName, type, departmentId, startDate, endDate } = req.query;
    const user = req.user;

    // Role-based access control
    let filterQuery = {};

    if (user.role === 'admin' || user.role === 'chief-administrative-officer') {
      // Admin and CAO can see all vendors
      if (departmentId && departmentId !== 'all') {
        filterQuery.department = new mongoose.Types.ObjectId(departmentId);
      }
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

    if (startDate || endDate) {
      filterQuery.billDate = {};
      if (startDate) {
        filterQuery.billDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filterQuery.billDate.$lte = new Date(endDate);
      }
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
    const { itemName, departmentId, type, startDate, endDate } = req.query;
    const user = req.user;

    // Role-based access control
    let filterQuery = {};

    if (user.role === 'admin' || user.role === 'chief-administrative-officer') {
      // Admin and CAO can see all items
      if (departmentId && departmentId !== 'all') {
        filterQuery.department = new mongoose.Types.ObjectId(departmentId);
      }
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

    // Apply additional filters
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

    const totalCapital = report.reduce((sum, item) => sum + (item.type === 'capital' ? (Number(item.grandTotal) || Number(item.totalAmount) || 0) : 0), 0);
    const totalRevenue = report.reduce((sum, item) => sum + (item.type === 'revenue' ? (Number(item.grandTotal) || Number(item.totalAmount) || 0) : 0), 0);
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
    const { departmentId, type, startDate, endDate } = req.query;
    const user = req.user;

    // Role-based access control
    let matchStage = {};

    if (user.role === 'admin' || user.role === 'chief-administrative-officer') {
      // Admin and CAO can see all years
      if (departmentId && departmentId !== 'all') {
        matchStage.department = new mongoose.Types.ObjectId(departmentId);
      }
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

    // Apply additional filters
    if (type) {
      matchStage.type = type;
    }

    if (startDate || endDate) {
      matchStage.billDate = {};
      if (startDate) {
        matchStage.billDate.$gte = new Date(startDate);
      }
      if (endDate) {
        matchStage.billDate.$lte = new Date(endDate);
      }
    }

    const report = await Asset.aggregate([
      { $match: { ...matchStage, billDate: { $ne: null, ...(matchStage.billDate || {}) } } },
      {
        $addFields: {
          calendarYear: { $year: '$billDate' }
        }
      },
      {
        $group: {
          _id: '$calendarYear',
          totalAssets: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ['$grandTotal', '$totalAmount'] } },
          totalCapital: { $sum: { $cond: [{ $eq: ['$type', 'capital'] }, { $ifNull: ['$grandTotal', '$totalAmount'] }, 0] } },
          totalRevenue: { $sum: { $cond: [{ $eq: ['$type', 'revenue'] }, { $ifNull: ['$grandTotal', '$totalAmount'] }, 0] } }
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
    const { type, departmentId, vendorName, itemName, startDate, endDate } = req.query;
    // Handle multiple type parameters - second one is asset type
    const assetType = Array.isArray(req.query.type) ? req.query.type[1] : (req.query.type !== 'combined' && req.query.type !== 'department' && req.query.type !== 'vendor' && req.query.type !== 'item' && req.query.type !== 'year' ? req.query.type : null);
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
    
    // Store the actual asset type used for filtering
    const actualAssetType = assetType && assetType !== 'undefined' ? assetType : null;

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
    const totalCapital = report.reduce((sum, asset) => sum + (asset.type === 'capital' ? (Number(asset.grandTotal) || Number(asset.totalAmount) || 0) : 0), 0);
    const totalRevenue = report.reduce((sum, asset) => sum + (asset.type === 'revenue' ? (Number(asset.grandTotal) || Number(asset.totalAmount) || 0) : 0), 0);
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

    // Get department name from existing report data
    let departmentName = 'All Departments';
    if (departmentId && departmentId !== 'all' && departmentId !== 'undefined' && report.length > 0 && report[0].department?.name) {
      departmentName = report[0].department.name;
    }
    
    const assetTypeText = actualAssetType && typeof actualAssetType === 'string' ? ` - ${actualAssetType.charAt(0).toUpperCase() + actualAssetType.slice(1)} Assets` : ' - All Types';
    const reportTypeTitle = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report - ${departmentName}${assetTypeText}`;

    // Add title row
    worksheet.addRow([reportTypeTitle]);
    worksheet.addRow([]); // Empty row

    // Style and merge the title row
    const titleRow = worksheet.getRow(1);
    titleRow.font = { bold: true, size: 14 };
    titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
    titleRow.height = 30;
    worksheet.mergeCells('A1:O1'); // Merge from A to O (Remarks column)
    

   

    // Define columns without headers first
    worksheet.columns = [
      { key: 'slNo', width: 10 },
      { key: 'collegeISRNo', width: 18 },
      { key: 'itISRNo', width: 18 },
      { key: 'particulars', width: 35 },
      { key: 'serialNumbers', width: 25 },
      { key: 'vendor', width: 25 },
      { key: 'billDate', width: 15 },
      { key: 'billNo', width: 18 },
      { key: 'quantity', width: 12 },
      { key: 'rate', width: 15 },
      { key: 'amount', width: 15 },
      { key: 'cgst', width: 10 },
      { key: 'sgst', width: 10 },
      { key: 'grandTotal', width: 18 },
      { key: 'remark', width: 25 }
    ];

    // Define border style
    const borderStyle = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };

    // Add column headers manually in row 3
    const headerRow = worksheet.getRow(3);
    headerRow.values = ['Sl No.', 'College ISR No.', 'IT ISR No.', 'Particulars', 'Serial Numbers', 'Vendor', 'Bill Date', 'Bill No.', 'Quantity', 'Rate', 'Amount', 'CGST%', 'SGST%', 'Grand Total', 'Remark'];
    headerRow.font = { bold: true, size: 12 };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    // Apply gray background only to columns up to Remarks (A-O)
    for (let col = 1; col <= 15; col++) {
      const cell = headerRow.getCell(col);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    }
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.border = borderStyle;
    });

    // Map report data to flat objects for Excel rows
    let rows = [];
    let slNoCounter = 1;
    
    // Helper function to create rows for an item with serial numbers
    const createRowsForItem = (asset, sub, isLegacy = false) => {
      const baseRow = {
        collegeISRNo: asset.collegeISRNo || '',
        itISRNo: asset.itISRNo || '',
        particulars: isLegacy ? asset.itemName || '' : sub.particulars || '',
        vendor: asset.vendorName || asset.vendor || '',
        billDate: asset.billDate ? new Date(asset.billDate).toLocaleDateString() : '',
        billNo: asset.billNo || '',
        quantity: isLegacy ? asset.quantity || 0 : sub.quantity || 0,
        rate: isLegacy ? asset.pricePerItem || 0 : sub.rate || 0,
        amount: isLegacy ? asset.totalAmount || 0 : sub.amount || 0,
        cgst: isLegacy ? asset.cgst || 0 : sub.cgst || 0,
        sgst: isLegacy ? asset.sgst || 0 : sub.sgst || 0,
        grandTotal: isLegacy ? asset.grandTotal || asset.totalAmount || 0 : sub.grandTotal || 0,
        remark: asset.remark || ''
      };

      // Get serial numbers
      const serialNumbers = isLegacy ? [] : (sub.serialNumbers && sub.serialNumbers.length > 0 ? sub.serialNumbers.filter(s => s.trim()) : (sub.serialNumber ? sub.serialNumber.split('\n').filter(s => s.trim()) : []));

      if (serialNumbers.length > 0) {
        // Create one row per serial number
        serialNumbers.forEach(serial => {
          rows.push({
            slNo: slNoCounter++,
            ...baseRow,
            serialNumbers: serial
          });
        });
      } else {
        // No serial numbers, create one row
        rows.push({
          slNo: slNoCounter++,
          ...baseRow,
          serialNumbers: ''
        });
      }
    };

    // For item report type, flatten individual items
    if (reportType === 'item') {
      report.forEach(asset => {
        if (Array.isArray(asset.items) && asset.items.length > 0) {
          asset.items.forEach(sub => {
            // Filter items by name if specified
            if (!itemName || sub.particulars?.toLowerCase().includes(itemName.toLowerCase())) {
              createRowsForItem(asset, sub);
            }
          });
        } else {
          // Legacy single item
          if (!itemName || asset.itemName?.toLowerCase().includes(itemName.toLowerCase())) {
            createRowsForItem(asset, asset, true);
          }
        }
      });
    } else {
      // For other report types, use existing logic
      report.forEach(item => {
        if (Array.isArray(item.items) && item.items.length > 0) {
          item.items.forEach(sub => {
            createRowsForItem(item, sub);
          });
        } else {
          createRowsForItem(item, item, true);
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
        serialNumbers: '',
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

    // Add data rows starting from row 4 (immediately after headers)
    const startRow = 4;
    rows.forEach(row => {
      worksheet.addRow(row);
    });
    const endRow = worksheet.rowCount;





    // Apply borders and center alignment to data rows
    for (let rowNum = startRow; rowNum <= endRow; rowNum++) {
      const row = worksheet.getRow(rowNum);
      row.eachCell((cell) => {
        cell.border = borderStyle;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
      row.height = 20; // Set row height
    }

    // Merge cells for consecutive rows with same values
    const columnsToMerge = ['collegeISRNo', 'itISRNo', 'particulars', 'vendor', 'billDate', 'billNo', 'quantity', 'rate', 'amount', 'cgst', 'sgst', 'grandTotal', 'remark'];
    
    columnsToMerge.forEach(columnKey => {
      const columnIndex = worksheet.columns.findIndex(col => col.key === columnKey) + 1;
      if (columnIndex === 0) return;
      
      let mergeStart = startRow;
      let currentValue = rows[0] ? rows[0][columnKey] : null;
      
      for (let i = 1; i <= rows.length; i++) {
        const nextValue = i < rows.length ? rows[i][columnKey] : null;
        
        if (nextValue !== currentValue || i === rows.length) {
          const mergeEnd = startRow + i - 1;
          
          if (mergeEnd > mergeStart) {
            // Merge cells
            worksheet.mergeCells(mergeStart, columnIndex, mergeEnd, columnIndex);
            
            // Center align merged cells
            const mergedCell = worksheet.getCell(mergeStart, columnIndex);
            mergedCell.alignment = { 
              vertical: 'middle', 
              horizontal: 'center' 
            };
          }
          
          mergeStart = startRow + i;
          currentValue = nextValue;
        }
      }
    });

    // Add total row at the end with Excel formulas
    if (rows.length > 0) {
      const dataStartRow = 4; // Headers are on row 3, data starts on row 4
      const dataEndRow = dataStartRow + rows.length - 1;
      
      worksheet.addRow({}); // Empty row for separation
      const totalRow = worksheet.addRow({
        slNo: '',
        collegeISRNo: '',
        itISRNo: '',
        particulars: 'TOTAL',
        serialNumbers: '',
        vendor: '',
        billDate: '',
        billNo: '',
        quantity: { formula: `SUM(H${dataStartRow}:H${dataEndRow})` },
        rate: '',
        amount: { formula: `SUM(J${dataStartRow}:J${dataEndRow})` },
        cgst: '',
        sgst: '',
        grandTotal: { formula: `SUM(M${dataStartRow}:M${dataEndRow})` },
        remark: ''
      });
      
      // Apply borders, center alignment, and styling to total row
      totalRow.eachCell((cell) => {
        cell.border = borderStyle;
        cell.font = { bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
      totalRow.height = 25;
    }

    // Auto-fit column widths based on content
    worksheet.columns.forEach((column, index) => {
      let maxLength = 0;
      const columnLetter = String.fromCharCode(65 + index);
      
      worksheet.eachRow((row, rowNumber) => {
        const cell = row.getCell(index + 1);
        if (cell.value) {
          const cellLength = cell.value.toString().length;
          if (cellLength > maxLength) {
            maxLength = cellLength;
          }
        }
      });
      
      column.width = Math.max(maxLength + 2, column.width || 10);
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
        const totalCapital = report.reduce((sum, asset) => sum + (asset.type === 'capital' ? (Number(asset.grandTotal) || Number(asset.totalAmount) || 0) : 0), 0);
        const totalRevenue = report.reduce((sum, asset) => sum + (asset.type === 'revenue' ? (Number(asset.grandTotal) || Number(asset.totalAmount) || 0) : 0), 0);
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

    const totalCapital = assets.reduce((sum, asset) => sum + (asset.type === 'capital' ? (Number(asset.grandTotal) || Number(asset.totalAmount) || 0) : 0), 0);
    const totalRevenue = assets.reduce((sum, asset) => sum + (asset.type === 'revenue' ? (Number(asset.grandTotal) || Number(asset.totalAmount) || 0) : 0), 0);
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

    // Set response headers first
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="merged_bills_${new Date().toISOString().split('T')[0]}.pdf"`);
    
    // Create a new PDF document
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    
    // Pipe the PDF to response
    doc.pipe(res);
    
    // Handle PDF errors
    doc.on('error', (err) => {
      console.error('PDF generation error:', err);
    });
    
    res.on('error', (err) => {
      console.error('Response stream error:', err);
    });

    // Add title page
    doc.fontSize(20).text('Asset Bills Report', { align: 'center' });
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // Add summary
    const totalAmount = assets.reduce((sum, asset) => sum + (Number(asset.grandTotal) || Number(asset.totalAmount) || 0), 0);
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

    let currentY = doc.y;
    
    assets.forEach((asset, index) => {
      // Add page break for each asset (except first)
      if (index > 0) {
        doc.addPage();
        currentY = 50; // Reset Y position for new page
      }

      doc.fontSize(12)
        .text(`${index + 1}. Bill #${asset.billNo || 'N/A'}`, 50, currentY, { underline: true });
      currentY += 20;
      
      doc.fontSize(10)
        .text(`Date: ${asset.billDate ? new Date(asset.billDate).toLocaleDateString() : 'N/A'}`, 50, currentY);
      currentY += 15;
      
      doc.text(`Department: ${asset.department?.name || 'N/A'}`, 50, currentY);
      currentY += 15;
      
      doc.text(`Type: ${asset.type || 'N/A'}`, 50, currentY);
      currentY += 15;
      
      doc.text(`Vendor: ${asset.vendorName || 'N/A'}`, 50, currentY);
      currentY += 15;
      
      doc.text(`Contact: ${asset.contactNumber || 'N/A'}`, 50, currentY);
      currentY += 15;
      
      doc.text(`Email: ${asset.email || 'N/A'}`, 50, currentY);
      currentY += 20;

      // Add items table if available
      if (asset.items && asset.items.length > 0) {
        doc.fontSize(11).text('Items:', 50, currentY, { underline: true });
        currentY += 20;
        
        // Table headers with proper spacing
        const startX = 50;
        
        doc.fontSize(9)
           .text('Sl.No', 50, currentY)
           .text('Particulars', 85, currentY)
           .text('Serial No', 210, currentY)
           .text('Qty', 340, currentY)
           .text('Rate', 370, currentY)
           .text('CGST%', 430, currentY)
           .text('SGST%', 470, currentY)
           .text('Total', 510, currentY);
        
        currentY += 15;
        
        // Draw line under headers
        doc.moveTo(50, currentY).lineTo(570, currentY).stroke();
        currentY += 10;
        
        // Add items with serial numbers
        let serialCounter = 1;
        asset.items.forEach(item => {
          const serialNumbers = item.serialNumbers && item.serialNumbers.length > 0 
            ? item.serialNumbers.filter(s => s.trim()) 
            : (item.serialNumber ? item.serialNumber.split('\n').filter(s => s.trim()) : []);
          
          if (serialNumbers.length > 0) {
            // Create one row per serial number
            serialNumbers.forEach(serial => {
              doc.fontSize(8)
                 .text(serialCounter.toString(), 50, currentY)
                 .text(item.particulars || '', 85, currentY, { width: 120, height: 30 })
                 .text(serial, 210, currentY, { width: 125, height: 30 })
                 .text((item.quantity || 0).toString(), 340, currentY)
                 .text(`₹${(item.rate || 0).toLocaleString()}`, 370, currentY, { width: 55 })
                 .text(`${item.cgst || 0}%`, 430, currentY)
                 .text(`${item.sgst || 0}%`, 470, currentY)
                 .text(`₹${(item.grandTotal || 0).toLocaleString()}`, 510, currentY, { width: 60 });
              currentY += 30;
              serialCounter++;
            });
          } else {
            // No serial numbers, create one row
            doc.fontSize(8)
               .text(serialCounter.toString(), 50, currentY)
               .text(item.particulars || '', 85, currentY, { width: 120, height: 30 })
               .text('N/A', 210, currentY)
               .text((item.quantity || 0).toString(), 340, currentY)
               .text(`₹${(item.rate || 0).toLocaleString()}`, 370, currentY, { width: 55 })
               .text(`${item.cgst || 0}%`, 430, currentY)
               .text(`${item.sgst || 0}%`, 470, currentY)
               .text(`₹${(item.grandTotal || 0).toLocaleString()}`, 510, currentY, { width: 60 });
            currentY += 30;
            serialCounter++;
          }
        });
        
        // Total line
        currentY += 5;
        doc.moveTo(50, currentY).lineTo(570, currentY).stroke();
        currentY += 10;
        
        const assetTotal = asset.grandTotal || asset.totalAmount || 0;
        doc.fontSize(10).text(`Asset Total: ₹${assetTotal.toLocaleString()}`, 410, currentY);
        currentY += 20;
      } else {
        // Legacy single item display
        doc.fontSize(10)
           .text(`Item: ${asset.itemName || 'N/A'}`, 50, currentY);
        currentY += 15;
        
        doc.text(`Quantity: ${asset.quantity || 'N/A'}`, 50, currentY);
        currentY += 15;
        
        doc.text(`Price per Item: ₹${(asset.pricePerItem || 0).toLocaleString()}`, 50, currentY);
        currentY += 15;
        
        doc.text(`Total Amount: ₹${(asset.totalAmount || 0).toLocaleString()}`, 50, currentY);
        currentY += 15;
      }
      
      if (asset.remark) {
        currentY += 15;
        doc.fontSize(9)
           .text('Remark:', 50, currentY, { width: 60 })
           .text(asset.remark, 115, currentY, { width: 450, align: 'left' });
        currentY += 20;
      }
      
      // Ensure we don't exceed page boundaries
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }
      currentY += 10;
    });

    // Finalize the PDF
    doc.end();

  } catch (error) {
    console.error('Merged PDF export error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate merged PDF'
      });
    }
  }
};
