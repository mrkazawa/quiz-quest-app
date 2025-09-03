import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true 
}) => {
  const { isAuthenticated } = useAuth();
  
  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Redirect to home page
    return <Navigate to="/" replace />;
  }
  
  // If authenticated or no authentication required, render children
  return <>{children}</>;
};

export default ProtectedRoute;
