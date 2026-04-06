import React, { useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import CustomerManagement from './CustomerManagement.tsx';
import AdminSettings from './AdminSettings.tsx';

const AdminPortal: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { path: '/admin/customers', label: 'Customer Management' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sidebar */}
      <div
        className={`bg-starlink-gray text-starlink-text transition-all duration-300 overflow-hidden flex flex-col ${
          sidebarOpen ? 'w-full md:w-[250px]' : 'w-[60px]'
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
          className="p-5 border-b border-starlink-border cursor-pointer"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <h3 className={`m-0 text-lg ${sidebarOpen ? 'text-lg' : 'text-2xl'}`}>
            {sidebarOpen ? 'Admin Portal' : 'AP'}
          </h3>
        </div>

        <nav className="py-3 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `block px-5 py-4 text-starlink-text no-underline transition-all duration-200 ${
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

        {/* Settings and Logout Buttons at Bottom */}
        <div className="border-t border-starlink-border p-3 space-y-2">
          <button
            onClick={() => navigate('/admin/settings')}
            className="w-full px-4 py-3 text-starlink-text hover:bg-starlink-light rounded transition-all duration-200 cursor-pointer bg-transparent border-none text-left"
          >
            {sidebarOpen && <span>Settings</span>}
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 text-starlink-text hover:bg-starlink-light rounded transition-all duration-200 cursor-pointer bg-transparent border-none text-left"
          >
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-starlink-darker w-full">
        {/* Mobile Header */}
        <div className="md:hidden bg-starlink-gray border-b border-starlink-border p-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-starlink-text text-2xl"
          >
            ☰
          </button>
          <h2 className="text-lg font-semibold">Admin Portal</h2>
          <div className="w-8"></div>
        </div>
        
        <Routes>
          <Route path="/" element={<CustomerManagement />} />
          <Route path="/customers" element={<CustomerManagement />} />
          <Route path="/settings" element={<AdminSettings />} />
        </Routes>
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
