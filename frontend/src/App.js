import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './pages/Dashboard.tsx';
import AccountInfo from './pages/AccountInfo.tsx';
import DeviceCommands from './pages/DeviceCommands.tsx';
import DeviceConfigAssignment from './pages/DeviceConfigAssignment.tsx';
import DeviceManagement from './pages/DeviceManagement.tsx';
import DeviceTelemetry from './pages/DeviceTelemetry.tsx';
import ServiceAccounts from './pages/ServiceAccounts.tsx';
import ServicePlan from './pages/ServicePlan.tsx';

function App() {
  return (
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
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
