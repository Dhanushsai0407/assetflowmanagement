import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Layout Wrappers
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import AssetDirectory from './pages/AssetDirectory';
import ResourceBooking from './pages/ResourceBooking';
import Maintenance from './pages/Maintenance';
import Allocations from './pages/Allocations';
import Audits from './pages/Audits';
import OrgSetup from './pages/OrgSetup';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import ActivityLogs from './pages/ActivityLogs';
import Profile from './pages/Profile';
import { NotFound, Forbidden } from './pages/ErrorPages';

// Role Guard Component
const RoleGuard = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Portal Routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="assets" element={<AssetDirectory />} />
              <Route path="bookings" element={<ResourceBooking />} />
              <Route path="maintenance" element={<Maintenance />} />
              <Route path="profile" element={<Profile />} />
              <Route path="notifications" element={<Notifications />} />

              {/* Asset Manager / Department Head / Admin Routes */}
              <Route 
                path="allocations" 
                element={
                  <RoleGuard allowedRoles={['Admin', 'Asset Manager', 'Department Head', 'Employee']}>
                    <Allocations />
                  </RoleGuard>
                } 
              />

              {/* Asset Manager / Admin Routes */}
              <Route 
                path="audits" 
                element={
                  <RoleGuard allowedRoles={['Admin', 'Asset Manager', 'Department Head', 'Employee']}>
                    <Audits />
                  </RoleGuard>
                } 
              />
              <Route 
                path="reports" 
                element={
                  <RoleGuard allowedRoles={['Admin', 'Asset Manager', 'Department Head', 'Employee']}>
                    <Reports />
                  </RoleGuard>
                } 
              />
              <Route 
                path="logs" 
                element={
                  <RoleGuard allowedRoles={['Admin', 'Asset Manager', 'Department Head', 'Employee']}>
                    <ActivityLogs />
                  </RoleGuard>
                } 
              />

              {/* Admin Only Routes */}
              <Route 
                path="org-setup" 
                element={
                  <RoleGuard allowedRoles={['Admin', 'Asset Manager', 'Department Head', 'Employee']}>
                    <OrgSetup />
                  </RoleGuard>
                } 
              />

              {/* Fallback Guards */}
              <Route path="forbidden" element={<Forbidden />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
