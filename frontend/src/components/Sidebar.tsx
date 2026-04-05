import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import KmsTestButton from './KmsTestButton.tsx';

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
    <div className="w-[280px] bg-starlink-black text-starlink-text h-screen fixed left-0 top-0 flex flex-col justify-between py-8 px-4 box-border">
      {/* Logo Area */}
      <div className="text-center mb-8">
        <h2 className="m-0 text-2xl font-semibold">Starlink Dashboard</h2>
        <p className="text-sm text-starlink-text-secondary mt-1">Partner Portal</p>
      </div>

      <nav className="nav">
        {/* Admin Section - Only show for admins */}
        {isAdmin && (
          <div className="mt-5 border-t border-starlink-border pt-3">
            <h4 className="text-starlink-text-muted text-xs mb-3 pl-4">ADMIN</h4>
            <ul className="list-none p-0 m-0 space-y-2">
              {adminNavItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => 
                      `block px-4 py-3 text-starlink-text no-underline rounded transition-all duration-200 ${
                        isActive ? 'bg-starlink-light font-medium' : 'hover:bg-starlink-gray'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
              <li>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-starlink-text hover:bg-starlink-gray rounded transition-all duration-200 cursor-pointer bg-transparent border-none"
                >
                  Logout
                </button>
              </li>
            </ul>
          </div>
        )}

        {/* Customer Section - Only show for customers */}
        {!isAdmin && isAuthenticated && (
          <div className="mt-5 border-t border-starlink-border pt-3">
            <h4 className="text-starlink-text-muted text-xs mb-3 pl-4">CUSTOMER</h4>
            <ul className="list-none p-0 m-0 space-y-2">
              {customerNavItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => 
                      `block px-4 py-3 text-starlink-text no-underline rounded transition-all duration-200 ${
                        isActive ? 'bg-starlink-light font-medium' : 'hover:bg-starlink-gray'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
              <li>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-starlink-text hover:bg-starlink-gray rounded transition-all duration-200 cursor-pointer bg-transparent border-none"
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
            <div className="mt-5 border-t border-starlink-border pt-3">
              <h4 className="text-starlink-text-muted text-xs mb-3 pl-4">ADMIN</h4>
              <ul className="list-none p-0 m-0 space-y-2">
                <li>
                  <NavLink
                    to="/admin/login"
                    className={({ isActive }) => 
                      `block px-4 py-3 text-starlink-text no-underline rounded transition-all duration-200 ${
                        isActive ? 'bg-starlink-light font-medium' : 'hover:bg-starlink-gray'
                      }`
                    }
                  >
                    Admin Login
                  </NavLink>
                </li>
              </ul>
            </div>

            {/* Customer Section */}
            <div className="mt-5 border-t border-starlink-border pt-3">
              <h4 className="text-starlink-text-muted text-xs mb-3 pl-4">CUSTOMER</h4>
              <ul className="list-none p-0 m-0 space-y-2">
                <li>
                  <NavLink
                    to="/login"
                    className={({ isActive }) => 
                      `block px-4 py-3 text-starlink-text no-underline rounded transition-all duration-200 ${
                        isActive ? 'bg-starlink-light font-medium' : 'hover:bg-starlink-gray'
                      }`
                    }
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
      <div className="mt-auto pt-4 border-t border-starlink-border">
        <KmsTestButton />
      </div>
    </div>
  );
};

export default Sidebar;
