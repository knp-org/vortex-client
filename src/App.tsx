import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/settings';
import { Library } from './pages/Library';
import { MediaDetail } from './pages/MediaDetail';
import { Player } from './pages/Player';
import { Profile } from './pages/Profile';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

const RouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-cyan-500">
        <div className="w-8 h-8 border-2 border-current rounded-full animate-spin border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route path="/" element={<RouteGuard><Dashboard /></RouteGuard>} />
          <Route path="/libraries/:id" element={<RouteGuard><Library /></RouteGuard>} />
          <Route path="/media/:id" element={<RouteGuard><MediaDetail /></RouteGuard>} />
          <Route path="/series/:name" element={<RouteGuard><MediaDetail /></RouteGuard>} />
          <Route path="/player/:id" element={<RouteGuard><Player /></RouteGuard>} />
          <Route path="/profile" element={<RouteGuard><Profile /></RouteGuard>} />
          <Route path="/profile/preferences" element={<RouteGuard><Profile /></RouteGuard>} />
          <Route path="/profile/security" element={<RouteGuard><Profile /></RouteGuard>} />
          <Route path="/settings" element={<RouteGuard><Settings /></RouteGuard>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
