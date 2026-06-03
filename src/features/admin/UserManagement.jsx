import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserManagement = () => {
    const [employees, setEmployees] = useState([
        { name: 'Siti Aminah', email: 'test@example.com', role: 'KASIR', status: 'Online', initials: 'SA' },
        { name: 'Budi Susanto', email: 'budi@example.com', role: 'KASIR', status: 'Online', initials: 'BS' },
        { name: 'admin kelompok 10', email: 'admin@example.com', role: 'ADMINISTRATOR', status: 'Online', initials: 'AK' }
    ]);

    useEffect(() => {
        const fetchCashiers = async () => {
            try {
                const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
                const res = await axios.get(`${apiURL}/cashiers`);
                if (res.data.status === 'success') {
                    const fetched = res.data.data.map(emp => ({
                        name: emp.name,
                        email: emp.email,
                        role: emp.role,
                        status: emp.status === 'Online' ? 'Online' : 'Offline',
                        initials: emp.initials
                    }));
                    const adminUser = { name: 'admin kelompok 10', email: 'admin@example.com', role: 'ADMINISTRATOR', status: 'Online', initials: 'AK' };
                    setEmployees([adminUser, ...fetched]);
                }
            } catch (e) {
                console.error("Gagal mengambil data kasir", e);
            }
        };
        fetchCashiers();
    }, []);

    const [roleFilter, setRoleFilter] = useState('Semua Role');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState('KASIR');

    const handleAddEmployee = (e) => {
        e.preventDefault();
        if (!newName.trim() || !newEmail.trim()) return;

        const initials = newName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        const newEmp = {
            name: newName,
            email: newEmail,
            role: newRole,
            status: 'Online',
            initials: initials
        };

        setEmployees([...employees, newEmp]);
        setNewName('');
        setNewEmail('');
        setNewRole('KASIR');
        setShowAddModal(false);
    };

    const handleDeleteEmployee = (name) => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus karyawan ${name}?`)) {
            setEmployees(employees.filter(emp => emp.name !== name));
        }
    };

    const totalAdmin = employees.filter(emp => emp.role === 'ADMINISTRATOR').length;
    const totalCashier = employees.filter(emp => emp.role === 'KASIR' || emp.role === 'KASIR').length;

    const filteredEmployees = employees.filter(emp => {
        const matchesRole = roleFilter === 'Semua Role' || 
                            (roleFilter === 'Administrator' && emp.role === 'ADMINISTRATOR') ||
                            (roleFilter === 'Kasir' && emp.role === 'KASIR');
        const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              emp.email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesRole && matchesSearch;
    });

    return (
        <div>
            <div className="dashboard-header">
                <div className="header-title">
                    <h1>Manajemen Karyawan / User</h1>
                    <p>Kelola data karyawan dan hak akses sistem.</p>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)}
                    style={{
                        padding: '10px 20px',
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '24px',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                    }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="19" x2="19" y1="8" y2="14" />
                        <line x1="16" x2="22" y1="11" y2="11" />
                    </svg>
                    Tambah Karyawan
                </button>
            </div>

            {/* Metrics cards (Only Total Admin and Total Cashier, taking full space) */}
            <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div className="metric-card" style={{ background: '#2563eb', color: '#ffffff', borderColor: '#2563eb', padding: '16px 20px' }}>
                    <div className="metric-info">
                        <span className="metric-label" style={{ color: '#93c5fd', fontSize: '11px', letterSpacing: '0.5px' }}>TOTAL ADMINISTRATOR</span>
                        <span className="metric-value" style={{ color: '#ffffff', fontSize: '28px', fontWeight: '700' }}>{totalAdmin} Admin</span>
                    </div>
                    <div className="metric-icon" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    </div>
                </div>

                <div className="metric-card orange" style={{ padding: '16px 20px' }}>
                    <div className="metric-info">
                        <span className="metric-label" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>TOTAL KASIR</span>
                        <span className="metric-value" style={{ fontSize: '28px', fontWeight: '700' }}>{totalCashier} Kasir</span>
                    </div>
                    <div className="metric-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <rect width="20" height="14" x="2" y="5" rx="2" />
                            <line x1="2" x2="22" y1="10" y2="10" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Employee List Section */}
            <div className="table-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="table-title" style={{ fontSize: '16px', fontWeight: '600' }}>Daftar Karyawan</span>
                        <span style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>
                            {filteredEmployees.length} Total
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Search bar */}
                        <div className="search-bar-container" style={{ width: '220px', margin: 0 }}>
                            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '13px' }}>🔍</span>
                            <input 
                                type="text" 
                                placeholder="Cari nama karyawan..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                                style={{ padding: '8px 12px 8px 34px', fontSize: '13px', borderRadius: '18px' }}
                            />
                        </div>
                        
                        <select 
                            value={roleFilter} 
                            onChange={(e) => setRoleFilter(e.target.value)}
                            style={{
                                padding: '8px 14px',
                                borderRadius: '18px',
                                border: '1px solid var(--border-color)',
                                fontSize: '13px',
                                outline: 'none',
                                cursor: 'pointer',
                                backgroundColor: '#ffffff',
                                fontWeight: '500'
                            }}
                        >
                            <option value="Semua Role">Semua Role</option>
                            <option value="Administrator">Administrator</option>
                            <option value="Kasir">Kasir</option>
                        </select>
                    </div>
                </div>

                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>NAMA KARYAWAN</th>
                                <th>ALAMAT EMAIL</th>
                                <th>ROLE SISTEM</th>
                                <th>STATUS AKUN</th>
                                <th style={{ textAlign: 'center' }}>AKSI</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.map((emp, index) => (
                                <tr key={index}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div 
                                                style={{ 
                                                    width: '36px', 
                                                    height: '36px', 
                                                    borderRadius: '50%', 
                                                    backgroundColor: emp.role === 'ADMINISTRATOR' ? '#dbeafe' : '#ede9fe', 
                                                    color: emp.role === 'ADMINISTRATOR' ? '#2563eb' : '#8b5cf6', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                    fontWeight: '600',
                                                    fontSize: '13px'
                                                }}
                                            >
                                                {emp.initials}
                                            </div>
                                            <span style={{ fontWeight: '600', fontSize: '14px' }}>{emp.name}</span>
                                        </div>
                                    </td>
                                    <td>{emp.email}</td>
                                    <td>
                                        <span 
                                            style={{ 
                                                fontSize: '11px', 
                                                padding: '4px 10px', 
                                                borderRadius: '6px', 
                                                fontWeight: '700', 
                                                background: emp.role === 'ADMINISTRATOR' ? '#dbeafe' : '#f3f4f6', 
                                                color: emp.role === 'ADMINISTRATOR' ? '#2563eb' : '#4b5563',
                                                letterSpacing: '0.3px'
                                            }}
                                        >
                                            {emp.role}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500', color: emp.status === 'Online' ? '#10b981' : '#6b7280' }}>
                                            <span 
                                                style={{ 
                                                    width: '8px', 
                                                    height: '8px', 
                                                    borderRadius: '50%', 
                                                    backgroundColor: emp.status === 'Online' ? '#10b981' : '#cbd5e1'
                                                }}
                                            />
                                            {emp.status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button 
                                            onClick={() => handleDeleteEmployee(emp.name)}
                                            style={{ 
                                                padding: '4px', 
                                                background: 'none', 
                                                border: 'none', 
                                                cursor: 'pointer',
                                                color: '#ef4444'
                                            }}
                                            title="Hapus karyawan"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'left', borderRadius: '20px', padding: '24px' }}>
                        <h3 className="modal-title" style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '700' }}>Tambah Karyawan Baru</h3>
                        <form onSubmit={handleAddEmployee}>
                            <div className="form-group" style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Nama</label>
                                <input 
                                    type="text" 
                                    value={newName} 
                                    onChange={(e) => setNewName(e.target.value)} 
                                    className="form-input" 
                                    required 
                                    placeholder="Masukkan nama lengkap karyawan"
                                    style={{ background: '#ffffff', border: '1px solid #d1d5db' }}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Email</label>
                                <input 
                                    type="email" 
                                    value={newEmail} 
                                    onChange={(e) => setNewEmail(e.target.value)} 
                                    className="form-input" 
                                    required 
                                    placeholder="Masukkan alamat email"
                                    style={{ background: '#ffffff', border: '1px solid #d1d5db' }}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Role Sistem</label>
                                <select 
                                    value={newRole} 
                                    onChange={(e) => setNewRole(e.target.value)} 
                                    className="form-input"
                                    style={{ background: '#ffffff', border: '1px solid #d1d5db' }}
                                >
                                    <option value="KASIR">KASIR</option>
                                    <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                                </select>
                            </div>
                            <div className="modal-buttons" style={{ justifyContent: 'flex-end', gap: '8px', display: 'flex' }}>
                                <button type="button" className="modal-btn no" onClick={() => setShowAddModal(false)} style={{ width: 'auto', padding: '10px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer' }}>Batal</button>
                                <button type="submit" className="modal-btn yes" style={{ width: 'auto', padding: '10px 20px', background: '#2563eb', color: '#fff', borderRadius: '20px', border: 'none', cursor: 'pointer' }}>Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;