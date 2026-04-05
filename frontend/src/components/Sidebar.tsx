import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import KmsTestButton from './KmsTestButton.tsx';
import './Sidebar.css';

// Admin navigation items
const adminNavItems = [
  { path: '/admin/customers', label: 'Manage Customers' },
  { path: '/admin/users', label: 'User Management' },
  { path: '/admin/login', label: 'Admin Login' },
];

// Customer navigation items
const customerNavItems = [
  { path: '/customer/portal', label: 'Customer Portal' },
];

const Sidebar: React.FC = () => {
  const { isAdmin, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="sidebar">
      {/* Logo Area */}
      <div className="logo">
        <h2>Starlink Dashboard</h2>
        <p className="logo-sub">Partner Portal</p>
      </div>

      <nav className="nav">
        {/* Admin Section - Only show for admins */}
        {isAdmin && (
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
              <li>
                <button
                  onClick={handleLogout}
                  style={{
                    background: 'none',
                    border: 'none',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 15px',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  Logout
                </button>
              </li>
            </ul>
          </div>
        )}

        {/* Customer Section - Only show for customers */}
        {!isAdmin && isAuthenticated && (
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
                <button
                  onClick={handleLogout}
                  style={{
                    background: 'none',
                    border: 'none',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 15px',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  Logout
                </button>
              </li>
            </ul>
          </div>
        )}

        {/* Guest Section - Show login options when not authenticated */}
        {!isAuthenticated && (
          <>
            {/* Admin Section */}
            <div style={{ marginTop: '20px', borderTop: '1px solid #444', paddingTop: '10px' }}>
              <h4 style={{ color: '#aaa', fontSize: '12px', marginBottom: '10px', paddingLeft: '15px' }}>ADMIN</h4>
              <ul>
                <li>
                  <NavLink
                    to="/admin/login"
                    className={({ isActive }) => (isActive ? 'active' : '')}
                  >
                    Admin Login
                  </NavLink>
                </li>
              </ul>
            </div>

            {/* Customer Section */}
            <div style={{ marginTop: '20px', borderTop: '1px solid #444', paddingTop: '10px' }}>
              <h4 style={{ color: '#aaa', fontSize: '12px', marginBottom: '10px', paddingLeft: '15px' }}>CUSTOMER</h4>
              <ul>
                <li>
                  <NavLink
                    to="/login"
                    className={({ isActive }) => (isActive ? 'active' : '')}
                  >
                    Customer Login
                  </NavLink>
                </li>
              </ul>
            </div>
          </>
        )}
      </nav>

      {/* KMS Test Button at bottom */}
      <div className="kms-test">
        <KmsTestButton />
      </div>
    </div>
  );
};

export default Sidebar;
