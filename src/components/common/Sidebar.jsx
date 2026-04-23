import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, FileText, CreditCard, BookOpen,
  Users, Package, ShoppingCart, Clock, Shield,
  ChevronDown, ChevronRight, TrendingUp
} from 'lucide-react';

const Sidebar = () => {
  const { user, hasPermission } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState({});

  const toggle = (key) => setOpen(prev => ({ ...prev, [key]: !prev[key] }));

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const groups = [
    {
      key: 'dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      show: true,
      single: true
    },
    {
      key: 'bills',
      name: 'Bills',
      icon: FileText,
      show: hasPermission('view_all_bills') || hasPermission('view_own_bills') || hasPermission('create_bills'),
      children: [
        { name: 'View All Bills', path: '/bills', show: hasPermission('view_all_bills') },
        { name: 'My Bills', path: `/bills?own=true`, show: hasPermission('view_own_bills') && !hasPermission('view_all_bills') },
        { name: 'Create Bill', path: '/bills/create', show: hasPermission('create_bills') },
      ]
    },
    {
      key: 'payments',
      name: 'Payments',
      icon: CreditCard,
      show: hasPermission('view_all_payments') || hasPermission('view_own_payment') || hasPermission('create_payment'),
      children: [
        { name: 'All Payments', path: '/payments', show: hasPermission('view_all_payments') },
        { name: 'My Payments', path: '/payments?own=true', show: hasPermission('view_own_payment') && !hasPermission('view_all_payments') },
        { name: 'Record Payment', path: '/payments/create', show: hasPermission('create_payment') },
      ]
    },
    {
      key: 'ledger',
      name: 'Ledger',
      icon: BookOpen,
      show: hasPermission('view_all_ledger') || hasPermission('view_own_ledger') || hasPermission('view_all_customers'),
      children: [
        { name: 'All Customers', path: '/customers', show: hasPermission('view_all_customers') },
      { name: 'My Ledger', path: `/ledger/${user?.id}`, show: hasPermission('view_own_ledger') && !hasPermission('view_all_ledger') },
      ]
    },
    {
      key: 'orders',
      name: 'Orders',
      icon: ShoppingCart,
      show: hasPermission('view_all_orders') || hasPermission('view_own_orders') || hasPermission('create_all_orders') || hasPermission('create_own_orders'),
      children: [
        { name: 'All Orders', path: '/orders', show: hasPermission('view_all_orders') },
        { name: 'My Orders', path: '/orders?own=true', show: hasPermission('view_own_orders') && !hasPermission('view_all_orders') },
        { name: 'Create Order', path: '/orders/create', show: hasPermission('create_all_orders') || hasPermission('create_own_orders') },
      ],
    },
    {
      key: 'products',
      name: 'Products',
      icon: Package,
      show: hasPermission('view_products'),
      single: true,
      path: '/products'
    },
    {
      key: 'aging',
      name: 'Aging Report',
      icon: Clock,
      show: hasPermission('view_all_aging') || hasPermission('view_own_aging'),
      children: [
        { name: 'All Aging', path: '/aging', show: hasPermission('view_all_aging') },
        { name: 'My Aging', path: '/aging?own=true', show: hasPermission('view_own_aging') && !hasPermission('view_all_aging') },
      ]
    },
    {
      key: 'reports',
      name: 'Reports',
      icon: TrendingUp,
      show: hasPermission('view_all_aging'),
      single: true,
      path: '/reports'
    },
    {
      key: 'permissions',
      name: 'Permissions',
      icon: Shield,
      show: user?.role_id === 1,
      single: true,
      path: '/permissions'
    }
  ];

  return (
    <aside className="w-64 bg-white shadow-lg min-h-screen">
      <nav className="p-4">
        <ul className="space-y-1">
          {groups.filter(g => g.show).map((group) => {
            const Icon = group.icon;

            if (group.single) {
              const active = isActive(group.path);
              return (
                <li key={group.key}>
                  <Link
                    to={group.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      active ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{group.name}</span>
                  </Link>
                </li>
              );
            }

            const isGroupActive = group.children?.some(c => c.show && location.pathname === c.path);
            const isOpen = open[group.key] || isGroupActive;
            const visibleChildren = group.children?.filter(c => c.show) || [];

            return (
              <li key={group.key}>
                <button
                  onClick={() => toggle(group.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isGroupActive ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1 text-left">{group.name}</span>
                  {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                {isOpen && (
                  <ul className="ml-9 mt-1 space-y-1">
                    {visibleChildren.map(child => {
                      const active = location.pathname === child.path.split('?')[0];
                      return (
                        <li key={child.path}>
                          <Link
                            to={child.path}
                            className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                              active ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {child.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;