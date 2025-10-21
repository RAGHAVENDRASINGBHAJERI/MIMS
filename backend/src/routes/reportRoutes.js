import express from 'express';
import Asset from '../models/Asset.js';
import {
  getDepartmentReport,
  getVendorReport,
  getItemReport,
  getYearReport,
  exportExcel,
  exportPDF,
  exportWord,
  exportBillsZip,
  getCombinedReport
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/reports - General reports endpoint
router.get('/', protect, getCombinedReport);

// GET /api/reports/department - Department report
router.get('/department', protect, getDepartmentReport);

// GET /api/reports/vendor - Vendor report
router.get('/vendor', protect, getVendorReport);

// GET /api/reports/item - Item report
router.get('/item', protect, getItemReport);

// GET /api/reports/year - Year report
router.get('/year', protect, getYearReport);

// GET /api/reports/export/excel - Export Excel
router.get('/export/excel', protect, exportExcel);

// GET /api/reports/export/pdf - Export PDF
router.get('/export/pdf', protect, exportPDF);

// GET /api/reports/export/word - Export Word
router.get('/export/word', protect, exportWord);

// GET /api/reports/download/bills - Download bills as ZIP
router.get('/download/bills', protect, exportBillsZip);

export default router;
