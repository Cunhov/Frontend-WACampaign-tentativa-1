import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Instances from './Instances';
import Templates from './Templates';
import Campaigns from './Campaigns';
import Groups from './Groups';

function Dashboard({ setIsAuthenticated }) {
  const location = useLocation();
  
  const menuItems = [
    { path: '/dashboard/instances', label: 'Instâncias', icon: '📱' },
    { path: '/dashboard/templates', label: 'Templates', icon: '📝' },
    { path: '/dashboard/groups', label: 'Grupos', icon: '👥' },
    { path: '/dashboard/campaigns', label: 'Campanhas', icon: '📢' }
  ];

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-4">
          <h1 className="text-xl font-bold text-gray-800">WhatsApp Manager</h1>
        </div>
        <nav className="mt-4">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors ${
                location.pathname === item.path ? 'bg-blue-50 border-r-4 border-blue-500' : ''
              }`}
            >
              <span className="mr-3 text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 w-64 p-4">
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Routes>
            <Route path="/" element={<Instances />} />
            <Route path="/instances" element={<Instances />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/campaigns" element={<Campaigns />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 