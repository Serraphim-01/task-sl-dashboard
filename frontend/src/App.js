import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './pages/Dashboard.tsx';
import AccountInfo from './pages/AccountInfo.tsx';
import DeviceManagement from './pages/DeviceManagement.tsx';
import DeviceTelemetry from './pages/DeviceTelemetry.tsx';

function App() {
  return (
    <Router>
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main style={{ marginLeft: '280px', flex: 1, backgroundColor: '#ffffff', minHeight: '100vh' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/account" element={<AccountInfo />} />
            <Route path="/data-usage" element={<DeviceTelemetry />} />
            <Route path="/performance" element={<DeviceTelemetry />} />
            <Route path="/device-management" element={<DeviceManagement />} />
            <Route path="/support" element={<DeviceTelemetry />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
