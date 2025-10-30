import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route } from "react-router-dom";
import { AssetFlowProvider } from "@/context/AssetFlowContext";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import AnimatedRoutes from "@/components/AnimatedRoutes";
import GlobalAnimationWrapper from "@/components/layout/GlobalAnimationWrapper";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import CreateAdmin from "./pages/CreateAdmin";
import SelectAssetType from "./pages/SelectAssetType";
import CapitalForm from "./pages/CapitalForm";
import RevenueForm from "./pages/RevenueForm";
import Reports from "./pages/Reports";
import AdminDashboard from "./pages/AdminDashboard";
import DepartmentDashboard from "./pages/DepartmentDashboard";
import AdminPasswordReset from "./pages/AdminPasswordReset";
import AdminManagement from "./pages/AdminManagement";
import ProfileSetup from "./pages/ProfileSetup";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NotificationProvider>
        <AssetFlowProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <GlobalAnimationWrapper animationStyle="particles">
              <div className="min-h-screen bg-background">
                <Navbar />
                <div className="flex">
                  <Sidebar />
                  <main className="flex-1 overflow-auto">
                    <AnimatedRoutes>
                      <Route path="/login" element={<Login />} />
                      <Route path="/create-admin" element={<CreateAdmin />} />
                      <Route path="/" element={<Landing />} />
                      <Route path="/dashboard" element={
                        <ProtectedRoute>
                          <DepartmentDashboard />
                        </ProtectedRoute>
                      } />
                      <Route path="/add-material" element={
                        <ProtectedRoute>
                          <SelectAssetType />
                        </ProtectedRoute>
                      } />
                      <Route path="/capital" element={
                        <ProtectedRoute>
                          <CapitalForm />
                        </ProtectedRoute>
                      } />
                      <Route path="/revenue" element={
                        <ProtectedRoute>
                          <RevenueForm />
                        </ProtectedRoute>
                      } />
                      <Route path="/reports" element={
                        <ProtectedRoute>
                          <Reports />
                        </ProtectedRoute>
                      } />
                      <Route path="/admin" element={
                        <AdminProtectedRoute>
                          <AdminDashboard />
                        </AdminProtectedRoute>
                      } />
                      <Route path="/admin-dashboard" element={
                        <AdminProtectedRoute>
                          <AdminDashboard />
                        </AdminProtectedRoute>
                      } />
                      <Route path="/admin/password-reset" element={
                        <AdminProtectedRoute>
                          <AdminPasswordReset />
                        </AdminProtectedRoute>
                      } />
                      <Route path="/admin/management" element={
                        <AdminProtectedRoute>
                          <AdminManagement />
                        </AdminProtectedRoute>
                      } />
                      <Route path="/profile-setup" element={
                        <ProtectedRoute>
                          <ProfileSetup />
                        </ProtectedRoute>
                      } />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </AnimatedRoutes>
                  </main>
                </div>
              </div>
            </GlobalAnimationWrapper>
          </BrowserRouter>
          </TooltipProvider>
        </AssetFlowProvider>
      </NotificationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
