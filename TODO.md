# TODO: Implement Role-Based Filtering in Reports Module

## Backend Changes
- [ ] Modify `getDepartmentReport` to enforce role-based access
- [ ] Modify `getVendorReport` to show item details instead of aggregated totals, with role-based filtering
- [ ] Modify `getItemReport` to enforce role-based access
- [ ] Modify `getYearReport` to enforce role-based access
- [ ] Modify `getCombinedReport` to enforce role-based access
- [ ] Update export functions to respect role-based filtering

## Frontend Changes
- [ ] Update Reports.tsx to handle new vendor report structure (if changed)
- [ ] Test role-based filtering with different user types

## Testing
- [ ] Test with admin user (full access)
- [ ] Test with CAO user (full access)
- [ ] Test with department officer (department-restricted access)
- [ ] Test with regular user (minimal/no access)
