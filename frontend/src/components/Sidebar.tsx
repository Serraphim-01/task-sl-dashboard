import React from 'react';
import { NavLink } from 'react-router-dom';
import KmsTestButton from './KmsTestButton.tsx';
import './Sidebar.css';

// Define your navigation items based on permissions
const navItems = [
  { path: '/', label: 'Dashboard', permission: 'read' },
  { path: '/account', label: 'Account Information', permission: 'read-edit' },
  { path: '/device-commands', label: 'Device Command & Config Management', permission: 'read-edit' },
  { path: '/device-config-assignment', label: 'Device Configuration Assignment', permission: 'read-edit' },
  { path: '/device-management', label: 'Device Management', permission: 'read-edit' },
  { path: '/device-telemetry', label: 'Device Telemetry', permission: 'read-edit' },
  { path: '/service-accounts', label: 'Service Account Management', permission: 'read-edit' },
  { path: '/service-plan', label: 'Service Plan', permission: 'read-edit' },
];

// Admin navigation items
const adminNavItems = [
  { path: '/admin/customers', label: 'Manage Customers', permission: 'admin' },
];

// Customer navigation items
const customerNavItems = [
  { path: '/customer/dashboard', label: 'My Dashboard', permission: 'customer' },
];

const Sidebar: React.FC = () => {
  return (
    <div className="sidebar">
      {/* Logo Area */}
      <div className="logo">
        <h2>Starlink Dashboard</h2>
        <p className="logo-sub">Partner Portal</p>
      </div>

      {/* Navigation */}
      <nav className="nav">
        <ul>
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Admin Section */}
        <div style={{ marginTop: '20px', borderTop: '1px solid #444', paddingTop: '10px' }}>
          <h4 style={{ color: '#aaa', fontSize: '12px', marginBottom: '10px', paddingLeft: '15px' }}>ADMIN</h4>
          <ul>
            {adminNavItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => (isActive ? 'active' : '')}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Customer Section */}
        <div style={{ marginTop: '20px', borderTop: '1px solid #444', paddingTop: '10px' }}>
          <h4 style={{ color: '#aaa', fontSize: '12px', marginBottom: '10px', paddingLeft: '15px' }}>CUSTOMER</h4>
          <ul>
            {customerNavItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => (isActive ? 'active' : '')}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
            <li>
              <NavLink
                to="/login"
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                Login
              </NavLink>
            </li>
          </ul>
        </div>
      </nav>

      {/* KMS Test Button at bottom */}
      <div className="kms-test">
        <KmsTestButton />
      </div>
    </div>
  );
};

export default Sidebar;
