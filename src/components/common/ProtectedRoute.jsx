import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const ProtectedRoute = ({ children, permission }) => {
  const { isAuthenticated, hasPermission, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check token expire on mount
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiry = payload.exp * 1000;
        
        if (Date.now() >= expiry) {
          // Token dead - logout
          logout(); // This should clear localStorage and set isAuthenticated = false
          navigate('/login');
        }
      } catch (e) {
        // Bad token - logout
        logout();
        navigate('/login');
      }
    }
  }, [logout, navigate]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 p-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-red-800 mb-2">Access Denied</h2>
              <p className="text-red-600">You don't have permission to access this page.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ProtectedRoute;