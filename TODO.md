# Bill Download Feature Implementation

## Backend Changes
- [ ] Install JSZip library in backend
- [ ] Add exportBillsZip function in reportController.js
- [ ] Add new route /api/reports/download/bills in reportRoutes.js

## Frontend Changes
- [ ] Add downloadBills function in reportService.ts
- [ ] Update Reports.tsx to add checkboxes for asset selection
- [ ] Add state for tracking selected assets in Reports.tsx
- [ ] Add "Download Bills" button in Reports.tsx

## Testing
- [ ] Test ZIP download with selected assets
- [ ] Test with filters applied
- [ ] Verify existing Excel/Word export still works
- [ ] Handle edge cases (missing bills, large files)
