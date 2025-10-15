# TODO: Fix React Controlled Input Warning

## Issue
Warning: A component is changing an uncontrolled input to be controlled. This is likely caused by the value changing from undefined to a defined value, which should not happen. Decide between using a controlled or uncontrolled input element for the lifetime of the component.

## Root Cause
The `useForm` hooks in `AdminDashboard.tsx` do not have `defaultValues` set, causing form fields to start as uncontrolled (value=undefined) and become controlled when values are set, triggering the React warning.

## Plan
- Update `userForm`, `departmentForm`, and `assetForm` to include `defaultValues` with empty strings for all fields to ensure they remain controlled throughout the component's lifecycle.

## Files to Edit
- `frontend/src/pages/AdminDashboard.tsx`

## Steps
- [x] Add defaultValues to userForm useForm hook
- [x] Add defaultValues to departmentForm useForm hook
- [x] Add defaultValues to assetForm useForm hook
- [x] Fix department loading for user creation form
- [x] Fix assets.map is not a function error by adding Array.isArray check
- [ ] Test the forms to ensure no warnings appear

## Followup
- Run the application and check for the warning in the console
- Verify form functionality still works correctly
