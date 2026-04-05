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
    { path: '/customer/portal/account', label: 'Account Info' },
    { path: '/customer/portal/devices', label: 'Devices' },
    { path: '/customer/portal/telemetry', label: 'Telemetry' },
    { path: '/customer/portal/tasks', label: 'Tasks' },
    { path: '/customer/portal/network', label: 'Network' },
    { path: '/customer/portal/alerts', label: 'Alerts' },
  ];

  return (
    <div className="flex min-h-[calc(100vh-60px)]">
      {/* Sidebar */}
      <div
        className={`bg-starlink-gray text-starlink-text transition-all duration-300 overflow-hidden ${
          sidebarOpen ? 'w-[250px]' : 'w-[60px]'
        }`}
      >
        <div
          className="p-5 border-b border-starlink-border cursor-pointer"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <h3 className={`m-0 text-lg ${sidebarOpen ? 'text-lg' : 'text-2xl'}`}>
            {sidebarOpen ? 'Customer Portal' : 'CP'}
          </h3>
        </div>

        <nav className="py-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-5 py-4 text-starlink-text no-underline transition-all duration-200 ${
                  isActive
                    ? 'bg-starlink-light border-l-4 border-starlink-accent'
                    : 'border-l-4 border-transparent hover:bg-starlink-light'
                }`
              }
            >
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-starlink-darker">
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
