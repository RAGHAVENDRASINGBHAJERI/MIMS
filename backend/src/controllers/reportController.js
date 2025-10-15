import Asset from '../models/Asset.js';
import Department from '../models/Department.js';
import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx';
import JSZip from 'jszip';
import { getGridFS } from '../utils/gridfs.js';

/**
 * Helper function to build the base filter query from request query and user role.
 * This ensures consistent filtering across all report and export functions.
 */
const buildFilterQuery = (user, query) => {
    const { departmentId, vendorName, itemName, startDate, endDate } = query;
    let filterQuery = {};

    // 1. Apply user role restrictions
    if (user.role === 'department-officer') {
        // Department Officer can only see assets from their assigned department
        filterQuery.department = user.department;
    } else if (departmentId) {
        // Admin/Principal can filter by department
        // Ensure departmentId is a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(departmentId)) {
            filterQuery.department = new mongoose.Types.ObjectId(departmentId);
        }
    }

    // 2. Apply query filters
    if (vendorName) {
        filterQuery.vendorName = { $regex: new RegExp(vendorName, 'i') };
    }
    if (itemName) {
        filterQuery.itemName = { $regex: new RegExp(itemName, 'i') };
    }
    if (startDate || endDate) {
        filterQuery.billDate = {};
        if (startDate) filterQuery.billDate.$gte = new Date(startDate);
        if (endDate) filterQuery.billDate.$lte = new Date(endDate);
    }

    return filterQuery;
};

// --- Report Generation APIs ---

/**
 * Groups assets by department with type breakdowns.
 */
export const getDepartmentReport = async (req, res, next) => {
    try {
        const user = req.user;
        const filterQuery = buildFilterQuery(user, req.query);

        const matchStage = { $match: filterQuery };

        const report = await Asset.aggregate([
            matchStage,
            {
                $lookup: {
                    from: 'departments',
                    localField: 'department',
                    foreignField: '_id',
                    as: 'dept'
                }
            },
            {
                $unwind: { path: '$dept', preserveNullAndEmptyArrays: true }
            },
            {
                $group: {
                    _id: '$dept.name',
                    totalCapital: { $sum: { $cond: [{ $eq: ['$type', 'capital'] }, '$totalAmount', 0] } },
                    totalRevenue: { $sum: { $cond: [{ $eq: ['$type', 'revenue'] }, '$totalAmount', 0] } },
                    totalConsumable: { $sum: { $cond: [{ $eq: ['$type', 'consumable'] }, '$totalAmount', 0] } },
                    totalAmount: { $sum: '$totalAmount' },
                    itemCount: { $sum: 1 }
                }
            },
            {
                $sort: { totalAmount: -1 }
            }
        ]);

        const totalCapital = report.reduce((sum, dept) => sum + dept.totalCapital, 0);
        const totalRevenue = report.reduce((sum, dept) => sum + dept.totalRevenue, 0);
        const totalConsumable = report.reduce((sum, dept) => sum + dept.totalConsumable, 0);
        const grandTotal = totalCapital + totalRevenue + totalConsumable;
        const itemCount = report.reduce((sum, dept) => sum + dept.itemCount, 0);

        res.json({
            success: true,
            data: {
                report,
                summary: {
                    totalCapital,
                    totalRevenue,
                    totalConsumable,
                    grandTotal,
                    itemCount
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Groups assets by vendor with type breakdowns and contact details.
 */
export const getVendorReport = async (req, res, next) => {
    try {
        const user = req.user;
        const filterQuery = buildFilterQuery(user, req.query);

        const matchStage = { $match: filterQuery };

        const report = await Asset.aggregate([
            matchStage,
            {
                $group: {
                    _id: '$vendorName',
                    totalCapital: { $sum: { $cond: [{ $eq: ['$type', 'capital'] }, '$totalAmount', 0] } },
                    totalRevenue: { $sum: { $cond: [{ $eq: ['$type', 'revenue'] }, '$totalAmount', 0] } },
                    totalConsumable: { $sum: { $cond: [{ $eq: ['$type', 'consumable'] }, '$totalAmount', 0] } },
                    totalAmount: { $sum: '$totalAmount' },
                    totalAssets: { $sum: 1 },
                    vendorDetails: {
                        $first: {
                            address: '$vendorAddress',
                            contact: '$contactNumber',
                            email: '$email'
                        }
                    }
                }
            },
            {
                $sort: { totalAmount: -1 }
            }
        ]);

        const totalCapital = report.reduce((sum, vendor) => sum + vendor.totalCapital, 0);
        const totalRevenue = report.reduce((sum, vendor) => sum + vendor.totalRevenue, 0);
        const totalConsumable = report.reduce((sum, vendor) => sum + vendor.totalConsumable, 0);
        const grandTotal = totalCapital + totalRevenue + totalConsumable;
        const itemCount = report.reduce((sum, vendor) => sum + vendor.totalAssets, 0);

        res.json({
            success: true,
            data: {
                report,
                summary: {
                    totalCapital,
                    totalRevenue,
                    totalConsumable,
                    grandTotal,
                    itemCount
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Fetches detailed assets filtered by item name with summary.
 */
export const getItemReport = async (req, res, next) => {
    try {
        const user = req.user;
        const filterQuery = buildFilterQuery(user, req.query);

        const report = await Asset.find(filterQuery)
            .populate('department', 'name')
            .lean()
            .sort({ billDate: -1 });

        const totalCapital = report.reduce((sum, asset) => sum + (asset.type === 'capital' ? (asset.totalAmount || 0) : 0), 0);
        const totalRevenue = report.reduce((sum, asset) => sum + (asset.type === 'revenue' ? (asset.totalAmount || 0) : 0), 0);
        const totalConsumable = report.reduce((sum, asset) => sum + (asset.type === 'consumable' ? (asset.totalAmount || 0) : 0), 0);
        const grandTotal = totalCapital + totalRevenue + totalConsumable;
        const itemCount = report.length;

        res.json({
            success: true,
            data: {
                report,
                summary: {
                    totalCapital,
                    totalRevenue,
                    totalConsumable,
                    grandTotal,
                    itemCount
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Groups assets by academic year (assuming academicYear field exists; otherwise use calendar year).
 * Note: Asset model does not have academicYear field; using calendar year from billDate.
 */
export const getYearReport = async (req, res, next) => {
    try {
        const user = req.user;
        const filterQuery = buildFilterQuery(user, req.query);
        const matchStage = { $match: filterQuery };

        const report = await Asset.aggregate([
            matchStage,
            {
                $addFields: {
                    year: { $year: '$billDate' } // Use calendar year; replace with '$academicYear' if field exists
                }
            },
            {
                $group: {
                    _id: '$year',
                    totalCapital: { $sum: { $cond: [{ $eq: ['$type', 'capital'] }, '$totalAmount', 0] } },
                    totalRevenue: { $sum: { $cond: [{ $eq: ['$type', 'revenue'] }, '$totalAmount', 0] } },
                    totalConsumable: { $sum: { $cond: [{ $eq: ['$type', 'consumable'] }, '$totalAmount', 0] } },
                    totalAmount: { $sum: '$totalAmount' },
                    totalAssets: { $sum: 1 }
                }
            },
            {
                $sort: { _id: -1 }
            }
        ]);

        const totalCapital = report.reduce((sum, year) => sum + year.totalCapital, 0);
        const totalRevenue = report.reduce((sum, year) => sum + year.totalRevenue, 0);
        const totalConsumable = report.reduce((sum, year) => sum + year.totalConsumable, 0);
        const grandTotal = totalCapital + totalRevenue + totalConsumable;
        const itemCount = report.reduce((sum, year) => sum + year.totalAssets, 0);

        res.json({
            success: true,
            data: {
                report,
                summary: {
                    totalCapital,
                    totalRevenue,
                    totalConsumable,
                    grandTotal,
                    itemCount
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Provides an overall summary of assets based on filters (used by the dashboard).
 */
export const getCombinedReport = async (req, res, next) => {
    try {
        const user = req.user;
        const filterQuery = buildFilterQuery(user, req.query);

        const assets = await Asset.find(filterQuery).populate('department', 'name').lean();

        const totalCapital = assets.reduce((sum, asset) => sum + (asset.type === 'capital' ? (asset.totalAmount || 0) : 0), 0);
        const totalRevenue = assets.reduce((sum, asset) => sum + (asset.type === 'revenue' ? (asset.totalAmount || 0) : 0), 0);
        const totalConsumable = assets.reduce((sum, asset) => sum + (asset.type === 'consumable' ? (asset.totalAmount || 0) : 0), 0);
        const grandTotal = totalCapital + totalRevenue + totalConsumable;
        const itemCount = assets.length;

        res.json({
            success: true,
            data: {
                summary: {
                    totalCapital,
                    totalRevenue,
                    totalConsumable,
                    grandTotal,
                    itemCount
                },
                assets // Optionally return assets, useful for a combined view
            }
        });
    } catch (error) {
        next(error);
    }
};

// --- Export Functions ---

/**
 * Exports report data to an Excel file.
 */
export const exportExcel = async (req, res, next) => {
    try {
        const { type } = req.query;
        const user = req.user;
        const filterQuery = buildFilterQuery(user, req.query); // Use consistent filter logic

        let report = [];
        let filename = '';

        switch (type) {
            case 'department': {
                const matchStage = { $match: filterQuery };
                report = await Asset.aggregate([
                    matchStage,
                    { $lookup: { from: 'departments', localField: 'department', foreignField: '_id', as: 'dept' } },
                    { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
                    { $group: {
                        _id: '$dept.name',
                        totalCapital: { $sum: { $cond: [{ $eq: ['$type', 'capital'] }, '$totalAmount', 0] } },
                        totalRevenue: { $sum: { $cond: [{ $eq: ['$type', 'revenue'] }, '$totalAmount', 0] } },
                        totalConsumable: { $sum: { $cond: [{ $eq: ['$type', 'consumable'] }, '$totalAmount', 0] } },
                        totalAmount: { $sum: '$totalAmount' },
                        itemCount: { $sum: 1 }
                    } },
                    { $sort: { totalAmount: -1 } }
                ]);
                filename = 'department_report.xlsx';
                break;
            }
            case 'vendor': {
                const matchStage = { $match: filterQuery };
                report = await Asset.aggregate([
                    matchStage,
                    { $group: {
                        _id: '$vendorName',
                        totalCapital: { $sum: { $cond: [{ $eq: ['$type', 'capital'] }, '$totalAmount', 0] } },
                        totalRevenue: { $sum: { $cond: [{ $eq: ['$type', 'revenue'] }, '$totalAmount', 0] } },
                        totalConsumable: { $sum: { $cond: [{ $eq: ['$type', 'consumable'] }, '$totalAmount', 0] } },
                        totalAmount: { $sum: '$totalAmount' },
                        totalAssets: { $sum: 1 },
                        vendorDetails: {
                            $first: {
                                address: '$vendorAddress',
                                contact: '$contactNumber',
                                email: '$email'
                            }
                        }
                    } },
                    { $sort: { totalAmount: -1 } }
                ]);
                filename = 'vendor_report.xlsx';
                break;
            }
            case 'year': {
                const matchStage = { $match: filterQuery };
                report = await Asset.aggregate([
                    matchStage,
                    {
                        $addFields: {
                            year: { $year: '$billDate' } // Use calendar year; replace with '$academicYear' if field exists
                        }
                    },
                    {
                        $group: {
                            _id: '$year',
                            totalCapital: { $sum: { $cond: [{ $eq: ['$type', 'capital'] }, '$totalAmount', 0] } },
                            totalRevenue: { $sum: { $cond: [{ $eq: ['$type', 'revenue'] }, '$totalAmount', 0] } },
                            totalConsumable: { $sum: { $cond: [{ $eq: ['$type', 'consumable'] }, '$totalAmount', 0] } },
                            totalAmount: { $sum: '$totalAmount' },
                            totalAssets: { $sum: 1 }
                        }
                    },
                    {
                        $sort: { _id: -1 }
                    }
                ]);
                filename = 'year_report.xlsx';
                break;
            }
            default: // Default/All Assets/Item Report
                report = await Asset.find(filterQuery)
                    .populate('department', 'name')
                    .lean()
                    .sort({ billDate: -1 });
                filename = 'assets_report.xlsx';
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Report');

        // Add headers
        if (type === 'department') {
            worksheet.columns = [
                { header: 'Department', key: 'departmentName', width: 30 },
                { header: 'Total Capital', key: 'totalCapital', width: 18 },
                { header: 'Total Revenue', key: 'totalRevenue', width: 18 },
                { header: 'Total Consumable', key: 'totalConsumable', width: 18 },
                { header: 'Total Amount', key: 'totalAmount', width: 18 },
                { header: 'Asset Count', key: 'itemCount', width: 15 }
            ];
        } else if (type === 'vendor') {
            worksheet.columns = [
                { header: 'Vendor', key: '_id', width: 30 },
                { header: 'Total Capital', key: 'totalCapital', width: 18 },
                { header: 'Total Revenue', key: 'totalRevenue', width: 18 },
                { header: 'Total Consumable', key: 'totalConsumable', width: 18 },
                { header: 'Total Amount', key: 'totalAmount', width: 18 },
                { header: 'Asset Count', key: 'totalAssets', width: 15 },
                { header: 'Contact', key: 'contact', width: 20 },
                { header: 'Email', key: 'email', width: 25 }
            ];
        } else if (type === 'year') {
            worksheet.columns = [
                { header: 'Year', key: '_id', width: 15 },
                { header: 'Total Capital', key: 'totalCapital', width: 18 },
                { header: 'Total Revenue', key: 'totalRevenue', width: 18 },
                { header: 'Total Consumable', key: 'totalConsumable', width: 18 },
                { header: 'Total Amount', key: 'totalAmount', width: 18 },
                { header: 'Total Assets', key: 'totalAssets', width: 15 }
            ];
        } else { // Default/All Assets report
            worksheet.columns = [
                { header: 'Sl No.', key: 'slNo', width: 10 },
                { header: 'Department', key: 'departmentName', width: 25 },
                { header: 'Date Created', key: 'date', width: 15 },
                { header: 'College ISR No.', key: 'collegeISRNo', width: 20 },
                { header: 'IT ISR No.', key: 'itISRNo', width: 20 },
                { header: 'Item Name/Particulars', key: 'particulars', width: 35 },
                { header: 'Vendor', key: 'vendor', width: 25 },
                { header: 'Bill Date', key: 'billDate', width: 15 },
                { header: 'Bill No.', key: 'billNo', width: 20 },
                { header: 'Quantity', key: 'quantity', width: 15 },
                { header: 'Rate (Per Item)', key: 'rate', width: 15 },
                { header: 'Sub Total (Amt)', key: 'amount', width: 15 },
                { header: 'CGST', key: 'cgst', width: 10 },
                { header: 'SGST', key: 'sgst', width: 10 },
                { header: 'Total Amount', key: 'totalAmount', width: 18 },
                { header: 'Asset Type', key: 'assetType', width: 15 },
                { header: 'Remark', key: 'remark', width: 25 }
            ];
        }

        // Map report data to flat objects for Excel rows
        const rows = report.map((item, index) => {
            if (type === 'department') {
                return {
                    departmentName: item._id || 'Unassigned',
                    totalCapital: item.totalCapital,
                    totalRevenue: item.totalRevenue,
                    totalConsumable: item.totalConsumable,
                    totalAmount: item.totalAmount,
                    itemCount: item.itemCount
                };
            } else if (type === 'vendor') {
                return {
                    _id: item._id,
                    totalCapital: item.totalCapital,
                    totalRevenue: item.totalRevenue,
                    totalConsumable: item.totalConsumable,
                    totalAmount: item.totalAmount,
                    totalAssets: item.totalAssets,
                    contact: item.vendorDetails?.contact || '',
                    email: item.vendorDetails?.email || ''
                };
            } else if (type === 'year') {
                return item;
            } else {
                // Detailed Asset Report mapping
                return {
                    slNo: index + 1,
                    departmentName: item.department?.name || 'N/A',
                    date: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '',
                    collegeISRNo: item.collegeISRNo || '',
                    itISRNo: item.itISRNo || '',
                    particulars: item.itemName || '',
                    vendor: item.vendorName || '',
                    billDate: item.billDate ? new Date(item.billDate).toLocaleDateString() : '',
                    billNo: item.billNo || '',
                    quantity: item.quantity || '',
                    rate: item.pricePerItem || '',
                    amount: (item.quantity * item.pricePerItem) || '',
                    cgst: item.cgst || '',
                    sgst: item.sgst || '',
                    totalAmount: item.totalAmount || '',
                    assetType: item.type || '',
                    remark: item.remark || ''
                };
            }
        });

        worksheet.addRows(rows);

        // Add TOTAL row for all report types
        if (type === 'department') {
            const totalCapital = report.reduce((sum, item) => sum + item.totalCapital, 0);
            const totalRevenue = report.reduce((sum, item) => sum + item.totalRevenue, 0);
            const totalConsumable = report.reduce((sum, item) => sum + item.totalConsumable, 0);
            const totalAmount = report.reduce((sum, item) => sum + item.totalAmount, 0);
            const itemCount = report.reduce((sum, item) => sum + item.itemCount, 0);
            worksheet.addRow({
                departmentName: 'TOTAL',
                totalCapital: { value: totalCapital, numFmt: '0.00' },
                totalRevenue: { value: totalRevenue, numFmt: '0.00' },
                totalConsumable: { value: totalConsumable, numFmt: '0.00' },
                totalAmount: { value: totalAmount, numFmt: '0.00' },
                itemCount: itemCount
            });
        } else if (type === 'vendor') {
            const totalCapital = report.reduce((sum, item) => sum + item.totalCapital, 0);
            const totalRevenue = report.reduce((sum, item) => sum + item.totalRevenue, 0);
            const totalConsumable = report.reduce((sum, item) => sum + item.totalConsumable, 0);
            const totalAmount = report.reduce((sum, item) => sum + item.totalAmount, 0);
            const totalAssets = report.reduce((sum, item) => sum + item.totalAssets, 0);
            worksheet.addRow({
                _id: 'TOTAL',
                totalCapital: { value: totalCapital, numFmt: '0.00' },
                totalRevenue: { value: totalRevenue, numFmt: '0.00' },
                totalConsumable: { value: totalConsumable, numFmt: '0.00' },
                totalAmount: { value: totalAmount, numFmt: '0.00' },
                totalAssets: totalAssets
            });
        } else if (type === 'year') {
            const totalCapital = report.reduce((sum, item) => sum + item.totalCapital, 0);
            const totalRevenue = report.reduce((sum, item) => sum + item.totalRevenue, 0);
            const totalConsumable = report.reduce((sum, item) => sum + item.totalConsumable, 0);
            const totalAmount = report.reduce((sum, item) => sum + item.totalAmount, 0);
            const totalAssets = report.reduce((sum, item) => sum + item.totalAssets, 0);
            worksheet.addRow({
                _id: 'TOTAL',
                totalCapital: { value: totalCapital, numFmt: '0.00' },
                totalRevenue: { value: totalRevenue, numFmt: '0.00' },
                totalConsumable: { value: totalConsumable, numFmt: '0.00' },
                totalAmount: { value: totalAmount, numFmt: '0.00' },
                totalAssets: totalAssets
            });
        } else {
            // Detailed report TOTAL
            const totalAmount = report.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
            worksheet.addRow({
                slNo: '',
                departmentName: '',
                date: '',
                collegeISRNo: '',
                itISRNo: '',
                particulars: 'GRAND TOTAL',
                vendor: '',
                billDate: '',
                billNo: '',
                quantity: '',
                rate: '',
                amount: '',
                cgst: '',
                sgst: '',
                totalAmount: { value: totalAmount, numFmt: '0.00' },
                assetType: '',
                remark: ''
            });
        }

        // Style the total row
        const totalRow = worksheet.lastRow;
        totalRow.eachCell(cell => {
            cell.font = { bold: true };
            cell.border = { top: { style: 'thin' } };
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        next(error);
    }
};

/**
 * Exports report data to a Word file.
 */
export const exportWord = async (req, res, next) => {
    try {
        const { type } = req.query;
        const user = req.user;
        const filterQuery = buildFilterQuery(user, req.query); // Added consistent filter logic

        let report = [];
        let summary = null;
        let filename = '';
        const matchStage = { $match: filterQuery };

        switch (type) {
            case 'department':
                report = await Asset.aggregate([
                    matchStage, // Apply filter
                    { $lookup: { from: 'departments', localField: 'department', foreignField: '_id', as: 'dept' } },
                    { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
                    { $group: { _id: '$dept.name', totalAmount: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
                    { $sort: { totalAmount: -1 } }
                ]);
                filename = 'department_report.docx';
                break;
            case 'vendor':
                report = await Asset.aggregate([
                    matchStage, // Apply filter
                    { $group: { _id: '$vendorName', totalAmount: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
                    { $sort: { totalAmount: -1 } }
                ]);
                filename = 'vendor_report.docx';
                break;
            case 'year':
                report = await Asset.aggregate([
                    matchStage, // Apply filter
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
            default: // Default/All Assets/Item Report
                report = await Asset.find(filterQuery) // Apply filter
                    .populate('department', 'name')
                    .lean()
                    .sort({ billDate: -1 });

                // Calculate summary for combined report
                const totalCapital = report.reduce((sum, asset) => sum + (asset.type === 'capital' ? (asset.totalAmount || 0) : 0), 0);
                const totalRevenue = report.reduce((sum, asset) => sum + (asset.type === 'revenue' ? (asset.totalAmount || 0) : 0), 0);
                const totalConsumable = report.reduce((sum, asset) => sum + (asset.type === 'consumable' ? (asset.totalAmount || 0) : 0), 0);
                const grandTotal = totalCapital + totalRevenue + totalConsumable;
                const itemCount = report.length;

                summary = {
                    totalCapital,
                    totalRevenue,
                    totalConsumable,
                    grandTotal,
                    itemCount
                };
                filename = 'assets_report.docx';
        }

        const children = [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({
                        text: `AssetFlow ${type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Detailed Assets'} Report`,
                        bold: true,
                        size: 40 // Larger header
                    })
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({
                        text: `Generated on: ${new Date().toLocaleDateString()}`,
                        size: 24
                    })
                ],
                spacing: { after: 200 } // Add space after date
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
                            size: 28
                        })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Total Capital Assets: ₹${summary.totalCapital.toLocaleString('en-IN')}`,
                            size: 24
                        })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Total Revenue Assets: ₹${summary.totalRevenue.toLocaleString('en-IN')}`,
                            size: 24
                        })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Total Consumable Assets: ₹${summary.totalConsumable.toLocaleString('en-IN')}`,
                            size: 24
                        })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Grand Total: ₹${summary.grandTotal.toLocaleString('en-IN')}`,
                            bold: true,
                            size: 24
                        })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Total Items: ${summary.itemCount}`,
                            size: 24
                        })
                    ]
                }),
                new Paragraph({ spacing: { after: 300 } }) // Add space
            );
        }
        
        // Add report items
        if (type === 'department' || type === 'vendor' || type === 'year') {
            const grandTotal = report.reduce((sum, item) => sum + item.totalAmount, 0);

            children.push(
                new Table({
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [new Paragraph({ children: [new TextRun({ text: type.charAt(0).toUpperCase() + type.slice(1), bold: true })] })],
                                    width: { size: 50, type: WidthType.PERCENTAGE }
                                }),
                                new TableCell({
                                    children: [new Paragraph({ children: [new TextRun({ text: 'Asset Count', bold: true })] })],
                                    width: { size: 25, type: WidthType.PERCENTAGE }
                                }),
                                new TableCell({
                                    children: [new Paragraph({ children: [new TextRun({ text: 'Total Amount (₹)', bold: true })] })],
                                    width: { size: 25, type: WidthType.PERCENTAGE }
                                }),
                            ],
                        }),
                        ...report.map(item => new TableRow({
                            children: [
                                new TableCell({
                                    children: [new Paragraph(item._id || 'N/A')],
                                }),
                                new TableCell({
                                    children: [new Paragraph(item.count.toString())],
                                }),
                                new TableCell({
                                    children: [new Paragraph(item.totalAmount.toLocaleString('en-IN'))],
                                }),
                            ],
                        })),
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [new Paragraph({ children: [new TextRun({ text: 'GRAND TOTAL', bold: true })] })],
                                }),
                                new TableCell({
                                    children: [new Paragraph({ children: [new TextRun({ text: report.reduce((sum, item) => sum + item.count, 0).toString(), bold: true })] })],
                                }),
                                new TableCell({
                                    children: [new Paragraph({ children: [new TextRun({ text: grandTotal.toLocaleString('en-IN'), bold: true })] })],
                                }),
                            ],
                        })
                    ],
                    width: { size: 100, type: WidthType.PERCENTAGE },
                })
            );

        } else {
            // Detailed Asset Report - Improve formatting
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'Detailed Asset List:',
                            bold: true,
                            size: 28
                        })
                    ],
                    spacing: { before: 300 }
                })
            );
            
            report.forEach((item, index) => {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({ text: `${index + 1}. ${item.itemName || 'Asset'}: `, bold: true, size: 24 }),
                            new TextRun({ text: `Type: ${item.type || 'N/A'}`, size: 24 }),
                        ],
                        spacing: { before: 200 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: `Department: ${item.department?.name || 'N/A'} | `, size: 20 }),
                            new TextRun({ text: `Vendor: ${item.vendorName || 'N/A'} | `, size: 20 }),
                            new TextRun({ text: `Bill Date: ${item.billDate ? new Date(item.billDate).toLocaleDateString() : 'N/A'} | `, size: 20 }),
                            new TextRun({ text: `Bill No: ${item.billNo || 'N/A'}`, size: 20 }),
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: `Quantity: ${item.quantity || 'N/A'} | `, size: 20 }),
                            new TextRun({ text: `Rate: ₹${item.pricePerItem ? item.pricePerItem.toLocaleString('en-IN') : 'N/A'} | `, size: 20 }),
                            new TextRun({ text: `Total Amount: ₹${item.totalAmount ? item.totalAmount.toLocaleString('en-IN') : 'N/A'}`, size: 20 }),
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: `College ISR: ${item.collegeISRNo || 'N/A'} | `, size: 20 }),
                            new TextRun({ text: `IT ISR: ${item.itISRNo || 'N/A'}`, size: 20 }),
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: `Remark: ${item.remark || 'None'}`, size: 20 }),
                        ],
                        spacing: { after: 200 }
                    })
                );
            });
        }


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

/**
 * Exports bill documents as a ZIP file.
 */
export const exportBillsZip = async (req, res, next) => {
    try {
        const { assetIds } = req.query;
        const user = req.user;

        // Use the consistent filter builder logic, but manually handle assetIds for inclusion
        const baseFilterQuery = buildFilterQuery(user, req.query); 

        // Parse asset IDs
        let selectedAssetIds = [];
        if (assetIds) {
            selectedAssetIds = assetIds.split(',').map(id => new mongoose.Types.ObjectId(id.trim())).filter(id => mongoose.Types.ObjectId.isValid(id));
        }

        const filterQuery = {
            ...baseFilterQuery,
            // Include only assets with a bill file
            billFileId: { $exists: true, $ne: null }
        };

        // If specific asset IDs are provided, filter by them
        if (selectedAssetIds.length > 0) {
            filterQuery._id = { $in: selectedAssetIds };
        }

        // Fetch assets with bill files
        const assets = await Asset.find(filterQuery)
            .populate('department', 'name')
            .lean();

        if (assets.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No assets with bills found for the selected criteria'
            });
        }

        const zip = new JSZip();
        const gfs = getGridFS();

        // Add each bill to the ZIP
        for (const asset of assets) {
            try {
                const downloadStream = gfs.openDownloadStream(asset.billFileId);
                const chunks = [];
                
                // Wait for the stream to finish and collect all data chunks
                await new Promise((resolve, reject) => {
                    downloadStream.on('data', chunk => chunks.push(chunk));
                    downloadStream.on('error', reject);
                    downloadStream.on('end', resolve);
                });
                
                const buffer = Buffer.concat(chunks);
                
                // Create a clear and unique filename for the bill
                const fileExtension = asset.billFileName ? asset.billFileName.split('.').pop() : 'pdf';
                // Filename format: [ISR_No]_[Vendor]_[Bill_No].[ext]
                const fileName = `${asset.collegeISRNo || asset.itISRNo || 'ISR_N_A'}_${asset.vendorName || 'Vendor_N_A'}_${asset.billNo || asset._id}.${fileExtension}`;
                
                zip.file(fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_'), buffer); // Clean filename
            } catch (fileError) {
                // Log and continue if a single file download fails
                console.warn(`Failed to add bill for asset ${asset._id}:`, fileError.message);
            }
        }

        // Generate ZIP buffer
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

        // Set response headers
        const filename = `bills_${new Date().toISOString().split('T')[0]}.zip`;
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', zipBuffer.length);
        res.send(zipBuffer);

    } catch (error) {
        console.error('Error exporting bills ZIP:', error);
        next(error);
    }
};