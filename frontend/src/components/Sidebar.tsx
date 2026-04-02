import React from 'react';
import { NavLink } from 'react-router-dom';
import KmsTestButton from './KmsTestButton.tsx';
import './Sidebar.css';

// Define your navigation items based on permissions
const navItems = [
  { path: '/', label: 'Dashboard', permission: 'read' },
  { path: '/account', label: 'Account Details', permission: 'read' },
  { path: '/data-usage', label: 'Data Usage', permission: 'read' },
  { path: '/performance', label: 'Performance', permission: 'read' },
  { path: '/device-management', label: 'Device Management', permission: 'read-edit' },
  { path: '/support', label: 'Support', permission: 'read-edit' },
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
      </nav>

      {/* KMS Test Button at bottom */}
      <div className="kms-test">
        <KmsTestButton />
      </div>
    </div>
  );
};

export default Sidebar;
