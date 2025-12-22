import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { FileText, CreditCard, Users, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const { user, hasPermission } = useAuth();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Welcome back, {user?.name}!</h1>
        <p className="text-gray-600 mt-2">Role: {user?.role_name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {hasPermission('canCreateBills') && (
          <Link to="/bills/create" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Quick Action</p>
                <p className="text-lg font-semibold text-gray-800">Create Bill</p>
              </div>
            </div>
          </Link>
        )}

        {hasPermission('canRecordPayments') && (
          <Link to="/payments/create" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Quick Action</p>
                <p className="text-lg font-semibold text-gray-800">Record Payment</p>
              </div>
            </div>
          </Link>
        )}

        <Link to="/bills" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">View</p>
              <p className="text-lg font-semibold text-gray-800">All Bills</p>
            </div>
          </div>
        </Link>

        <Link to="/payments" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 p-3 rounded-lg">
              <CreditCard className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">View</p>
              <p className="text-lg font-semibold text-gray-800">All Payments</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Your Permissions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user?.permissions && Object.entries(user.permissions).map(([key, value]) => (
            <div key={key} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${value ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-sm text-gray-700">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;