# TODO: Isolate Landing Page and Dashboard for Department Officer

## Tasks
- [x] Update frontend/src/App.tsx to route '/' to Landing.tsx (public) and '/dashboard' to Index.tsx (protected)
- [x] Modify frontend/src/components/ProtectedRoute.tsx to restrict department-officer role access
- [x] Update frontend/src/components/layout/Sidebar.tsx navigation items for department-officer
- [x] Update frontend/src/components/layout/Navbar.tsx links to point to '/dashboard'
- [x] Update frontend/src/pages/Landing.tsx navigation links considering role restrictions

## Followup Steps
- [ ] Test routing for different roles to ensure restrictions work
- [ ] Verify department-officer can access only landing page and dashboard
- [ ] Confirm other roles retain full access
