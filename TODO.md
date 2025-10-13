# JWT Authentication Implementation

## Backend
- [x] Create `backend/src/middleware/authMiddleware.js` for JWT verification
- [x] Update `backend/src/routes/assetRoutes.js` to use auth middleware
- [x] Update `backend/src/routes/reportRoutes.js` to use auth middleware
- [x] Update `backend/src/routes/departmentRoutes.js` to use auth middleware

## Frontend
- [x] Update `frontend/src/services/api.ts` to include Authorization header with token

## Testing
- [x] Test login functionality
- [x] Test access to protected routes
- [x] Handle token expiry and logout

# Admin Features Implementation

## Backend
- [x] Extend `backend/src/controllers/userController.js` with admin CRUD operations (getAllUsers, createUser, updateUser, deleteUser)
- [x] Create `backend/src/routes/adminRoutes.js` with protected endpoints for user/department/asset management
- [x] Update `backend/src/server.js` to register admin routes
- [x] Add data seeding endpoints for initial data population

## Frontend
- [x] Create `frontend/src/services/adminService.ts` for admin API calls
- [x] Create `frontend/src/pages/AdminDashboard.tsx` with tabs for Users, Departments, Assets
- [x] Update `frontend/src/components/layout/Sidebar.tsx` to add Admin link for admins only
- [x] Update `frontend/src/App.tsx` to add admin routes with role protection

## Role-Based Access Control
- [ ] Implement role checks in frontend components
- [ ] Test admin-only access to admin features
- [ ] Verify CRUD operations on all entities
