import React, { useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import AccountInfo from './AccountInfo.tsx';
import DeviceList from './DeviceList.tsx';
import TelemetryDashboard from './TelemetryDashboard.tsx';
import TaskViewer from './TaskViewer.tsx';
import NetworkConfig from './NetworkConfig.tsx';
import AlertsViewer from './AlertsViewer.tsx';

const CustomerPortal: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { path: '/customer/portal/account', label: 'Account Info', icon: '👤' },
    { path: '/customer/portal/devices', label: 'Devices', icon: '🛰️' },
    { path: '/customer/portal/telemetry', label: 'Telemetry', icon: '📊' },
    { path: '/customer/portal/tasks', label: 'Tasks', icon: '⚙️' },
    { path: '/customer/portal/network', label: 'Network', icon: '🌐' },
    { path: '/customer/portal/alerts', label: 'Alerts', icon: '🔔' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
      {/* Sidebar */}
      <div
        style={{
          width: sidebarOpen ? '250px' : '60px',
          backgroundColor: '#2c3e50',
          color: 'white',
          transition: 'width 0.3s',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid #34495e',
            cursor: 'pointer',
          }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <h3 style={{ margin: 0, fontSize: sidebarOpen ? '18px' : '24px' }}>
            {sidebarOpen ? 'Customer Portal' : '📡'}
          </h3>
        </div>

        <nav style={{ padding: '10px 0' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                padding: '15px 20px',
                color: 'white',
                textDecoration: 'none',
                backgroundColor: isActive ? '#34495e' : 'transparent',
                borderLeft: isActive ? '4px solid #3498db' : '4px solid transparent',
                transition: 'all 0.2s',
              })}
            >
              <span style={{ fontSize: '20px', marginRight: '10px' }}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#f5f5f5' }}>
        <Routes>
          <Route path="/" element={<AccountInfo />} />
          <Route path="/account" element={<AccountInfo />} />
          <Route path="/devices" element={<DeviceList />} />
          <Route path="/telemetry" element={<TelemetryDashboard />} />
          <Route path="/tasks" element={<TaskViewer />} />
          <Route path="/network" element={<NetworkConfig />} />
          <Route path="/alerts" element={<AlertsViewer />} />
        </Routes>
      </div>
    </div>
  );
};

export default CustomerPortal;
