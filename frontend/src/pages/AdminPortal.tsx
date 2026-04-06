import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import CustomerManagement from './CustomerManagement.tsx';
import AdminSettings from './AdminSettings.tsx';
import { FaUsers, FaCog, FaSignOutAlt, FaBars } from 'react-icons/fa';

const AdminPortal: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // On mobile, start with sidebar closed
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Set initial state
    handleResize();

    // Listen for resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { path: '/admin/customers', label: 'Customer Management', icon: <FaUsers /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleNavClick = () => {
    // Close sidebar on mobile when nav item is clicked
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  // Redirect to /customers on mobile if on root path
  useEffect(() => {
    if (window.innerWidth < 768 && location.pathname === '/admin') {
      navigate('/admin/customers', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sidebar */}
      <div
        className={`bg-starlink-gray text-starlink-text transition-all duration-300 overflow-hidden flex flex-col ${
          sidebarOpen ? 'w-full md:w-[220px]' : 'w-[50px]'
        } ${sidebarOpen ? 'fixed md:relative inset-0 z-50 md:z-auto' : 'fixed md:relative inset-0 z-50 md:z-auto'}`}
      >
        {/* Close button for mobile */}
        {sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden absolute top-4 right-4 text-starlink-text hover:text-starlink-text-secondary"
          >
            ✕
          </button>
        )}
        
        <div
          className="p-4 border-b border-starlink-border cursor-pointer flex items-center justify-center"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? (
            <h3 className="text-lg">Admin Portal</h3>
          ) : (
            <FaBars className="text-xl" />
          )}
        </div>

        <nav className="py-3 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `block px-4 py-3 text-starlink-text no-underline transition-all duration-200 flex items-center ${
                  isActive
                    ? 'bg-starlink-light border-l-4 border-starlink-accent'
                    : 'border-l-4 border-transparent hover:bg-starlink-light'
                } ${!sidebarOpen ? 'justify-center' : ''}`
              }
            >
              <span className="text-base">{item.icon}</span>
              {sidebarOpen && <span className="ml-3 text-sm">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Settings and Logout Buttons at Bottom */}
        <div className="border-t border-starlink-border p-2 space-y-1">
          <button
            onClick={() => {
              handleNavClick();
              navigate('/admin/settings');
            }}
            className="w-full px-3 py-2 text-starlink-text hover:bg-starlink-light rounded transition-all duration-200 cursor-pointer bg-transparent border-none flex items-center"
          >
            <span className="text-base"><FaCog /></span>
            {sidebarOpen && <span className="ml-3 text-sm">Settings</span>}
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-starlink-text hover:bg-starlink-light rounded transition-all duration-200 cursor-pointer bg-transparent border-none flex items-center"
          >
            <span className="text-base"><FaSignOutAlt /></span>
            {sidebarOpen && <span className="ml-3 text-sm">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-starlink-darker w-full">
        {/* Mobile Header - Always visible on mobile */}
        <div className="md:hidden bg-starlink-gray border-b border-starlink-border p-3 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-starlink-text text-xl"
          >
            <FaBars />
          </button>
          <h2 className="text-base font-semibold">Admin Portal</h2>
          <div className="w-6"></div>
        </div>
        
        {/* Add padding on mobile */}
        <div className="md:hidden p-4">
          <Routes>
            <Route path="/" element={<CustomerManagement />} />
            <Route path="/customers" element={<CustomerManagement />} />
            <Route path="/settings" element={<AdminSettings />} />
          </Routes>
        </div>
        <div className="hidden md:block">
          <Routes>
            <Route path="/" element={<CustomerManagement />} />
            <Route path="/customers" element={<CustomerManagement />} />
            <Route path="/settings" element={<AdminSettings />} />
          </Routes>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default AdminPortal;
