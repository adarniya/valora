import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import Landingpage from './components/landing/Landingpage';
import BillList from './components/bills/BillList';
import CreateBill from './components/bills/CreateBill';
import BillDetail from './components/bills/BillDetail';
import PaymentList from './components/payments/PaymentList';
import CreatePayment from './components/payments/CreatePayment';
import LedgerView from './components/ledger/LedgerView';
import CustomerList from './components/ledger/CustomerList';
import ProductList from './components/products/ProductList';
import OrderList from './components/orders/OrderList';
import CreateOrder from './components/orders/CreateOrder';
import OrderDetail from './components/orders/OrderDetail';
import AgingReport from './components/aging/AgingReport';
import PermissionManager from './components/permissions/PermissionManager';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landingpage />} />
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />


          <Route path="/bills" element={
            <ProtectedRoute>
              <BillList />
            </ProtectedRoute>
          } />


          <Route path="/bills/create" element={
            <ProtectedRoute permission="create_bills">
              <CreateBill />
            </ProtectedRoute>
          } />

          <Route path="/bills/:id" element={
            <ProtectedRoute>
              <BillDetail />
            </ProtectedRoute>
          } />

          <Route path="/payments" element={
            <ProtectedRoute >
              <PaymentList />
            </ProtectedRoute>
          } />

          <Route path="/payments/create" element={
            <ProtectedRoute permission="create_payment">
              <CreatePayment />
            </ProtectedRoute>
          } />

          <Route path="/ledger/:userId" element={
            <ProtectedRoute>
              <LedgerView />
            </ProtectedRoute>
          } />

          <Route path="/customers" element={
            <ProtectedRoute permission="view_all_customers">
              <CustomerList />
            </ProtectedRoute>
          } />

          <Route path="/products" element={
            <ProtectedRoute permission="view_products">
              <ProductList />
            </ProtectedRoute>
          } />

          <Route path="/orders" element={
            <ProtectedRoute permission="view_all_orders">
              <OrderList />
            </ProtectedRoute>
          } />

          <Route path="/orders/create" element={
            <ProtectedRoute permission="create_all_orders">
              <CreateOrder />
            </ProtectedRoute>
          } />

          <Route path="/orders/:id" element={
            <ProtectedRoute>
              <OrderDetail />
            </ProtectedRoute>
          } />

          <Route path="/aging" element={
            <ProtectedRoute permission="view_all_aging">
              <AgingReport />
            </ProtectedRoute>
          } />

          <Route path="/permissions" element={
            <ProtectedRoute>
              <PermissionManager />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;