import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  CreditCard, 
  BookOpen, 
  Users,
  Package,
  TrendingUp
} from 'lucide-react';

const Sidebar = () => {
  const { user, hasPermission } = useAuth();
  const location = useLocation();

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      show: true
    },
    {
      name: 'Bills',
      path: '/bills',
      icon: FileText,
      show: true
    },
    {
      name: 'Create Bill',
      path: '/bills/create',
      icon: FileText,
      show: hasPermission('canCreateBills')
    },
    {
      name: 'Payments',
      path: '/payments',
      icon: CreditCard,
      show: true
    },
    {
      name: 'Record Payment',
      path: '/payments/create',
      icon: CreditCard,
      show: hasPermission('canRecordPayments')
    },
    {
      name: 'My Ledger',
      path: `/ledger/${user?.id}`,
      icon: BookOpen,
      show: !hasPermission('canViewAllLedgers')
    },
    {
      name: 'All Customers',
      path: '/customers',
      icon: Users,
      show: hasPermission('canViewAllLedgers')
    },
    {
      name: 'Products',
      path: '/products',
      icon: Package,
      show: hasPermission('canManageProducts')
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: TrendingUp,
      show: hasPermission('canViewReports')
    }
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 bg-white shadow-lg min-h-screen">
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.filter(item => item.show).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;