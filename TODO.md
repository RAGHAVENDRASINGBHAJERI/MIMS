# TODO: Update Excel Export for Combined Report with Filters and Specific Columns

## Pending Tasks
- [ ] Update backend/src/controllers/reportController.js exportExcel function for default case:
  - Apply filters from req.query (departmentId, type, startDate, endDate) similar to getCombinedReport.
  - Redefine worksheet.columns to: Sl No., Date, College ISR No., IT ISR No., Particulars, Vendor, Bill Date, Bill No., Quantity, Rate, Amount, CGST, SGST, Grand Total, Remark.
  - In rows mapping, add slNo (index + 1), map fields accordingly.
  - After adding rows, add a total row with sums for Amount, CGST, SGST, Grand Total.
- [ ] Update frontend/src/services/reportService.ts exportToExcel method to accept and pass filters.
- [ ] Update frontend/src/pages/Reports.tsx exportToExcel call to pass current filters.
- [ ] Test the export to ensure columns and totals are correct.
