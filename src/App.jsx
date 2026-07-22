import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { EmergencyProvider } from './context/EmergencyContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { initOfflineSync } from './utils/offlineQueue';
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';
import SOSPage from './pages/SOSPage';
import SymptomCheckerPage from './pages/SymptomCheckerPage';
import AuthorityDashboard from './pages/AuthorityDashboard';
import DetectPage from './pages/DetectPage';
import GuidancePage from './pages/GuidancePage';
import EntryPage from './pages/EntryPage';
import UserLoginPage from './pages/UserLoginPage';
import UserRegisterPage from './pages/UserRegisterPage';
import AuthorityLoginPage from './pages/AuthorityLoginPage';
import AuthorityRegisterPage from './pages/AuthorityRegisterPage';
import ProfilePage from './pages/ProfilePage';
import { useEffect } from 'react';
import './i18n';

function OfflineSyncInit() {
  useEffect(() => { initOfflineSync(); }, []);
  return null;
}

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-zg-bg flex items-center justify-center">
        <span className="w-8 h-8 border-3 border-zg-indigo/20 border-t-zg-indigo rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  
  // Custom Role fallback to prevent hard Entry kicks
  if (requiredRole && user.role !== requiredRole) {
    if (user.role === 'authority') return <Navigate to="/dashboard" replace />;
    if (user.role === 'user') return <Navigate to="/home" replace />;
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-zg-bg flex items-center justify-center">
        <span className="w-8 h-8 border-3 border-zg-indigo/20 border-t-zg-indigo rounded-full animate-spin" />
      </div>
    );
  }

  const authRoutes = ['/', '/user-login', '/authority-login', '/user-register', '/authority-register'];
  if (user && authRoutes.includes(location.pathname)) {
    return <Navigate to={user.role === 'authority' ? '/dashboard' : '/home'} replace />;
  }

  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();

  const authPages = ['/', '/user-login', '/user-register', '/authority-login', '/authority-register'];
  const showBottomNav = !authPages.includes(location.pathname) && user;

  return (
    <div className="flex flex-col min-h-dvh bg-zg-bg overflow-x-hidden">
      <main className="flex-1 relative">
        <Routes>
          <Route path="/" element={<PublicRoute><EntryPage /></PublicRoute>} />
          <Route path="/user-login" element={<PublicRoute><UserLoginPage /></PublicRoute>} />
          <Route path="/user-register" element={<PublicRoute><UserRegisterPage /></PublicRoute>} />
          <Route path="/authority-login" element={<PublicRoute><AuthorityLoginPage /></PublicRoute>} />
          <Route path="/authority-register" element={<PublicRoute><AuthorityRegisterPage /></PublicRoute>} />

          <Route path="/home" element={<ProtectedRoute requiredRole="user"><HomePage /></ProtectedRoute>} />
          <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
          <Route path="/sos" element={<PublicRoute><SOSPage /></PublicRoute>} />
          <Route path="/symptoms" element={<ProtectedRoute><SymptomCheckerPage /></ProtectedRoute>} />
          <Route path="/detect" element={<ProtectedRoute><DetectPage /></ProtectedRoute>} />
          <Route path="/guidance" element={<ProtectedRoute><GuidancePage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          <Route path="/dashboard" element={<ProtectedRoute requiredRole="authority"><AuthorityDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <EmergencyProvider>
        <ToastProvider>
          <OfflineSyncInit />
          <AppRoutes />
        </ToastProvider>
      </EmergencyProvider>
    </AuthProvider>
  );
}