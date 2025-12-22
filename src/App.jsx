import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import BillList from './components/bills/BillList';
import CreateBill from './components/bills/CreateBill';
import BillDetail from './components/bills/BillDetail';
import PaymentList from './components/payments/PaymentList';
import CreatePayment from './components/payments/CreatePayment';
import LedgerView from './components/ledger/LedgerView';
import CustomerList from './components/ledger/CustomerList';
import ProductList from './components/products/ProductList';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
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
            <ProtectedRoute permission="canCreateBills">
              <CreateBill />
            </ProtectedRoute>
          } />
          
          <Route path="/bills/:id" element={
            <ProtectedRoute>
              <BillDetail />
            </ProtectedRoute>
          } />
          
          <Route path="/payments" element={
            <ProtectedRoute>
              <PaymentList />
            </ProtectedRoute>
          } />
          
          <Route path="/payments/create" element={
            <ProtectedRoute permission="canRecordPayments">
              <CreatePayment />
            </ProtectedRoute>
          } />
          
          <Route path="/ledger/:userId" element={
            <ProtectedRoute>
              <LedgerView />
            </ProtectedRoute>
          } />
          <Route path="/products" element={
  <ProtectedRoute>
    <ProductList />
  </ProtectedRoute>
} />
          
          <Route path="/customers" element={
            <ProtectedRoute permission="canViewAllLedgers">
              <CustomerList />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;