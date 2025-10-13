import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader } from '@/components/ui/loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (isAuthenticated === undefined) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader size="lg" text="Checking authentication..." />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Prevent infinite redirect loop by checking current location
    if (location.pathname !== '/login') {
      return <Navigate to="/login" state={{ from: location }} replace />;
    } else {
      // Already on login page, do not redirect again
      return null;
    }
  }

  // Restrict department-officer role: only allow access to /dashboard
  if (user?.role === 'department-officer' && location.pathname !== '/dashboard') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
