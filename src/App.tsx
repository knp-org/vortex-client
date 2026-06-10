import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Titlebar } from './components/common/Titlebar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/settings';
import { Library } from './pages/Library';
import { MediaDetail } from './pages/MediaDetail';
import { Player } from './pages/Player';

// The reader pulls in heavy renderers (pdf.js / epub.js); load it on demand
// so they stay out of the main bundle.
const Reader = lazy(() => import('./pages/Reader').then((m) => ({ default: m.Reader })));
import { MpvOverlay } from './pages/MpvOverlay';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

const RouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-white/50">
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
  // The mpv controls overlay runs in its own transparent window and must
  // render bare (no Titlebar / opaque background) so the video shows through.
  // Loaded as `?mpvOverlay=<id>` on the root so it resolves in dev and in a
  // packaged build (no deep-path SPA fallback needed).
  if (typeof window !== 'undefined') {
    const overlayId = new URLSearchParams(window.location.search).get('mpvOverlay');
    if (overlayId) {
      return <MpvOverlay id={overlayId} />;
    }
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0a0a0f]">
          <Titlebar />
          <div className="flex-1 overflow-hidden relative">
            <Routes>
              <Route path="/login" element={<Login />} />

              {/* Protected Routes */}
              <Route path="/" element={<RouteGuard><Dashboard /></RouteGuard>} />
              <Route path="/libraries/:id" element={<RouteGuard><Library /></RouteGuard>} />
              <Route path="/media/:id" element={<RouteGuard><MediaDetail /></RouteGuard>} />
              <Route path="/series/:name" element={<RouteGuard><MediaDetail /></RouteGuard>} />
              <Route path="/player/:id" element={<RouteGuard><Player /></RouteGuard>} />
              <Route path="/reader/:id" element={
                <RouteGuard>
                  <Suspense fallback={
                    <div className="h-full w-full flex items-center justify-center bg-[#0a0a0f] text-white/50">
                      <div className="w-8 h-8 border-2 border-current rounded-full animate-spin border-t-transparent" />
                    </div>
                  }>
                    <Reader />
                  </Suspense>
                </RouteGuard>
              } />
              <Route path="/settings" element={<RouteGuard><Settings /></RouteGuard>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
