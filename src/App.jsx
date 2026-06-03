import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';
import './App.css'
import Dashboard from './features/dashboard/DashboardPage';
import AdminDashboard from './features/dashboard/AdminDashboard'; 
import Transaction from './features/transaction/TransactionPage';
import History from './features/history/HistoryPage';
import Success from './features/transaction/SuccessPage';
import Login from './features/auth/LoginPage';
import Navbar from './components/Navbar';

// IMPORT HALAMAN BARU ADMIN (Sesuaikan path jika perlu)
import FinancialReports from './features/admin/FinancialReports';
import ProductManagement from './features/admin/ProductManagement';
import UserManagement from './features/admin/UserManagement';
import CustomerDatabase from './features/admin/CustomerDatabase';
import AdminHistoryPage from './features/admin/AdminHistoryPage';

function App() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Authenticated layout including the Sidebar Navbar
  const ProtectedLayout = () => {
    const isLoggedIn = localStorage.getItem('cashier_logged_in') === 'true';

    if (!isLoggedIn) {
      return <Navigate to="/login" replace />;
    }

    return (
      <div className="app-container">
        <Navbar onLogoutClick={() => setShowLogoutModal(true)} />
        <main className="main-content">
          <Outlet context={{ setShowLogoutModal }} />
        </main>
      </div>
    );
  };

  const handleConfirmLogout = async () => {
    try {
      const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const name = localStorage.getItem('cashier_name');
      if (name) {
        await axios.post(`${apiURL}/logout`, { name });
      }
    } catch (e) {
      console.warn("Failed to notify backend of logout:", e);
    }
    localStorage.removeItem('cashier_logged_in');
    localStorage.removeItem('cashier_name');
    localStorage.removeItem('cashier_outlet');
    localStorage.removeItem('user_role'); 
    setShowLogoutModal(false);
    window.location.href = '/login';
  };

  const HomeRoute = () => {
    const role = localStorage.getItem('user_role');
    return role === 'admin' ? <AdminDashboard /> : <Dashboard />;
  };

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<HomeRoute />} /> 
            <Route path="/dashboard/AdminDashboard" element={<AdminDashboard />} />
            <Route path="/transaksi" element={<Transaction />} />
            <Route path="/riwayat" element={<History />} />
            <Route path="/success" element={<Success />} />

            {/* RUTE TAMBAHAN UNTUK MENU-MENU ADMIN */}
            <Route path="/admin/financial-reports" element={<FinancialReports />} />
            <Route path="/admin/product-management" element={<ProductManagement />} />
            <Route path="/admin/user-management" element={<UserManagement />} />
            <Route path="/admin/customer-database" element={<CustomerDatabase />} />
            <Route path="/admin/riwayat" element={<AdminHistoryPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      {/* Global Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              maxWidth: '360px', 
              padding: '32px 24px', 
              borderRadius: '20px', 
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
            }}
          >
            {/* Elegant warning icon */}
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#fef2f2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" x2="9" y1="12" y2="12" />
              </svg>
            </div>
            
            <h3 className="modal-title" style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#111827' }}>Konfirmasi Logout</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 24px' }}>Apakah Anda yakin ingin keluar dari sistem? Anda harus masuk kembali untuk menginput transaksi baru.</p>
            
            <div className="modal-buttons" style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="modal-btn no" 
                onClick={() => setShowLogoutModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '24px',
                  backgroundColor: '#f3f4f6',
                  color: '#4b5563',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'background-color 0.2s',
                  width: 'auto'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              >
                Batal
              </button>
              <button 
                className="modal-btn yes" 
                onClick={handleConfirmLogout}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '24px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'background-color 0.2s',
                  width: 'auto'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;