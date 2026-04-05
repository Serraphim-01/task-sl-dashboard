import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import AdminRoute from './components/AdminRoute.tsx';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './pages/Dashboard.tsx';
import AccountInfo from './pages/AccountInfo.tsx';
import DeviceCommands from './pages/DeviceCommands.tsx';
import DeviceConfigAssignment from './pages/DeviceConfigAssignment.tsx';
import DeviceManagement from './pages/DeviceManagement.tsx';
import DeviceTelemetry from './pages/DeviceTelemetry.tsx';
import ServiceAccounts from './pages/ServiceAccounts.tsx';
import ServicePlan from './pages/ServicePlan.tsx';
import AdminCustomerForm from './pages/AdminCustomerForm.tsx';
import UserManagement from './pages/UserManagement.tsx';
import AdminLogin from './pages/AdminLogin.tsx';
import CustomerLogin from './pages/CustomerLogin.tsx';
import CustomerPortal from './pages/CustomerPortal.tsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div style={{ display: 'flex' }}>
          <Sidebar />
          <main style={{ marginLeft: '280px', flex: 1, backgroundColor: '#ffffff', minHeight: '100vh' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/account" element={<AccountInfo />} />
              <Route path="/device-commands" element={<DeviceCommands />} />
              <Route path="/device-config-assignment" element={<DeviceConfigAssignment />} />
              <Route path="/device-management" element={<DeviceManagement />} />
              <Route path="/device-telemetry" element={<DeviceTelemetry />} />
              <Route path="/service-accounts" element={<ServiceAccounts />} />
              <Route path="/service-plan" element={<ServicePlan />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/customers" element={
                <AdminRoute>
                  <AdminCustomerForm />
                </AdminRoute>
              } />
              <Route path="/admin/users" element={
                <AdminRoute>
                  <UserManagement />
                </AdminRoute>
              } />
              <Route path="/login" element={<CustomerLogin />} />
              <Route path="/customer/portal/*" element={
                <ProtectedRoute>
                  <CustomerPortal />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
