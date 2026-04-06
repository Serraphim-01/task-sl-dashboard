import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import AdminRoute from './components/AdminRoute.tsx';
import Dashboard from './pages/Dashboard.tsx';
import AccountInfo from './pages/AccountInfo.tsx';
import DeviceCommands from './pages/DeviceCommands.tsx';
import DeviceConfigAssignment from './pages/DeviceConfigAssignment.tsx';
import DeviceManagement from './pages/DeviceManagement.tsx';
import DeviceTelemetry from './pages/DeviceTelemetry.tsx';
import ServiceAccounts from './pages/ServiceAccounts.tsx';
import ServicePlan from './pages/ServicePlan.tsx';
import CustomerManagement from './pages/CustomerManagement.tsx';
import AdminLogin from './pages/AdminLogin.tsx';
import CustomerLogin from './pages/CustomerLogin.tsx';
import CustomerPortal from './pages/CustomerPortal.tsx';
import AdminPortal from './pages/AdminPortal.tsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-starlink-dark">
          <Routes>
            {/* Default route - redirect to customer login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Login routes */}
            <Route path="/login" element={<CustomerLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            
            {/* Legacy routes (kept for backward compatibility) */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/account" element={<AccountInfo />} />
            <Route path="/device-commands" element={<DeviceCommands />} />
            <Route path="/device-config-assignment" element={<DeviceConfigAssignment />} />
            <Route path="/device-management" element={<DeviceManagement />} />
            <Route path="/device-telemetry" element={<DeviceTelemetry />} />
            <Route path="/service-accounts" element={<ServiceAccounts />} />
            <Route path="/service-plan" element={<ServicePlan />} />
            
            {/* Admin Portal with sidebar */}
            <Route path="/admin/*" element={
              <AdminRoute>
                <AdminPortal />
              </AdminRoute>
            } />
            
            {/* Customer Portal with sidebar */}
            <Route path="/customer/portal/*" element={
              <ProtectedRoute>
                <CustomerPortal />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
