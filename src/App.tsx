import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { ActiveSessionProvider } from './contexts/ActiveSessionContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AdminProtectedRoute } from './routes/AdminProtectedRoute';
import { AdminRoleRoute } from './routes/AdminRoleRoute';
import { AppShell } from './components/layout/AppShell';
import { AdminLayout } from './components/admin/AdminLayout';
import { initUtmCapture } from './services/utmTrackingService';

const UtmCaptureTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    initUtmCapture();
  }, [location.pathname, location.search]);

  return null;
};

// Auth Pages
import { Login } from './pages/auth/Login';
import { SignUp } from './pages/auth/SignUp';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { InstallApp } from './pages/InstallApp';

// Onboarding Flow
import { OnboardingFlow } from './pages/onboarding/OnboardingFlow';

// 5 Tab Pages (Main Learner App)
import { Home } from './pages/Home';
import { Speak } from './pages/Speak';
import { Scenarios } from './pages/Scenarios';
import { Interview } from './pages/Interview';
import { Profile } from './pages/Profile';
import { SessionDetail } from './pages/SessionDetail';

// 4 Admin Foundation Tabs (Direct URL only at /admin)
import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminContent } from './pages/admin/AdminContent';
import { AdminSystem } from './pages/admin/AdminSystem';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <UtmCaptureTracker />
      <AuthProvider>
        <AdminAuthProvider>
          <ActiveSessionProvider>
            <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Public App Install Slugs */}
            <Route path="/install" element={<InstallApp />} />
            <Route path="/get-app" element={<Navigate to="/install" replace />} />
            <Route path="/download" element={<Navigate to="/install" replace />} />

            {/* Onboarding Route (Requires login, does not require onboarding completed) */}
            <Route element={<ProtectedRoute requireOnboarding={false} />}>
              <Route path="/onboarding" element={<OnboardingFlow />} />
            </Route>

            {/* Main App Shell (Requires login + onboarding completed) */}
            <Route element={<ProtectedRoute requireOnboarding={true} />}>
              <Route element={<AppShell />}>
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Navigate to="/" replace />} />
                <Route path="/speak" element={<Speak />} />
                <Route path="/scenarios" element={<Scenarios />} />
                <Route path="/interview" element={<Interview />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/session/:id" element={<SessionDetail />} />
                <Route path="/sessions/:id" element={<SessionDetail />} />
              </Route>
            </Route>

            {/* Admin Shell - Direct URL only (/admin), requires active admin_users row */}
            <Route path="/admin" element={<AdminProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/overview" replace />} />
                
                {/* Overview: accessible to all active admin roles */}
                <Route path="overview" element={<AdminOverview />} />

                {/* Users: admin and support only */}
                <Route element={<AdminRoleRoute allowedRoles={['admin', 'support']} tabName="Users" />}>
                  <Route path="users" element={<AdminUsers />} />
                </Route>

                {/* Content: admin and content_editor only */}
                <Route element={<AdminRoleRoute allowedRoles={['admin', 'content_editor']} tabName="Content" />}>
                  <Route path="content" element={<AdminContent />} />
                </Route>

                {/* System Controls: admin only */}
                <Route element={<AdminRoleRoute allowedRoles={['admin']} tabName="System Controls" />}>
                  <Route path="system" element={<AdminSystem />} />
                </Route>
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ActiveSessionProvider>
      </AdminAuthProvider>
    </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
