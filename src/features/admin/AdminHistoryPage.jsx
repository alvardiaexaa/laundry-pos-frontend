import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { updateTransactionStatus } from '../../service/transactionService';

const AdminHistoryPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedTx, setSelectedTx] = useState(null);

    // Edit states
    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchHistory = async () => {
        try {
            const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
            const res = await axios.get(`${apiURL}/orders`);
            if (res.data.status === 'success') {
                setTransactions(res.data.data);
            }
        } catch (err) {
            console.error("Gagal mengambil riwayat transaksi admin:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    // Format Rupiah
    const formatRupiah = (num) => {
        if (num === undefined || num === null) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(num).replace('Rp', 'Rp ');
    };

    // Format Tanggal & Waktu
    const formatDate = (dateStr) => {
        if (!dateStr) return { date: '-', time: '' };
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return { date: dateStr, time: '' };
        
        const dateOptions = { day: 'numeric', month: 'short', year: 'numeric' };
        const formattedDate = date.toLocaleDateString('id-ID', dateOptions);
        
        const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
        const formattedTime = date.toLocaleTimeString('id-ID', timeOptions).replace(':', '.') + ' WIB';
        
        return { date: formattedDate, time: formattedTime };
    };

    // Handle status change
    const handleStatusChange = async (id, newStatus) => {
        try {
            await updateTransactionStatus(id, newStatus);
            setTransactions(prev => 
                prev.map(tx => tx.id === id ? { ...tx, status_pembayaran: newStatus } : tx)
            );
            
            // Sync selected transaction modal if open
            setSelectedTx(prev => prev && prev.id === id ? { ...prev, status_pembayaran: newStatus } : prev);
        } catch (err) {
            console.error("Gagal memperbarui status transaksi:", err);
            // Fallback update
            setTransactions(prev => 
                prev.map(tx => tx.id === id ? { ...tx, status_pembayaran: newStatus } : tx)
            );
            setSelectedTx(prev => prev && prev.id === id ? { ...prev, status_pembayaran: newStatus } : prev);
        }
    };

    // Handle delete transaction
    const handleDeleteTx = async (id) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus riwayat transaksi ini secara permanen?")) return;
        
        try {
            const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
            await axios.delete(`${apiURL}/orders/${id}`);
            setTransactions(prev => prev.filter(tx => tx.id !== id));
            setSelectedTx(null);
            alert("Transaksi berhasil dihapus.");
        } catch (err) {
            console.error("Gagal menghapus transaksi:", err);
            alert("Gagal menghapus transaksi dari server.");
        }
    };

    // Handle update customer info
    const handleSaveCustomerInfo = async (e) => {
        e.preventDefault();
        if (!editName.trim() || !editPhone.trim() || !editAddress.trim()) return;

        setSaving(true);
        try {
            const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
            const res = await axios.put(`${apiURL}/orders/${selectedTx.id}/customer-info`, {
                nama: editName,
                nomor: editPhone,
                alamat: editAddress
            });

            if (res.data.status === 'success') {
                const updatedTx = {
                    ...selectedTx,
                    nama_pelanggan: editName,
                    nomor_hp: editPhone,
                    alamat: editAddress
                };
                
                // Update lists
                setTransactions(prev => prev.map(tx => tx.id === selectedTx.id ? updatedTx : tx));
                setSelectedTx(updatedTx);
                setIsEditingInfo(false);
                alert("Informasi pelanggan berhasil diperbarui.");
            }
        } catch (err) {
            console.error("Gagal memperbarui info pelanggan:", err);
            alert("Gagal menyimpan perubahan ke server.");
        } finally {
            setSaving(false);
        }
    };

    // Open edit mode
    const handleStartEdit = () => {
        setEditName(selectedTx.nama_pelanggan || '');
        setEditPhone(selectedTx.nomor_hp || '');
        setEditAddress(selectedTx.alamat || '');
        setIsEditingInfo(true);
    };

    // Filter pencarian: hanya id transaksi, nama pelanggan, nama kasir, dan status
    const filteredTransactions = transactions.filter(tx => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        
        const invoice = String(tx.invoice || tx.id || '').toLowerCase();
        const name = String(tx.nama_pelanggan || '').toLowerCase();
        const kasir = String(tx.kasir || '').toLowerCase();
        const status = String(tx.status_pembayaran || '').toLowerCase();

        return invoice.includes(query) || 
               name.includes(query) || 
               kasir.includes(query) || 
               status.includes(query);
    });

    // Helper untuk detail layanan
    const getLayananText = (tx) => {
        if (tx.details && tx.details.length > 0) {
            return tx.details.map(d => {
                const name = d.layanan ? d.layanan.nama : 'Layanan';
                const qty = Math.round(d.jumlah || 1);
                const unit = d.layanan ? d.layanan.satuan : 'kg';
                return `${name} (${qty} ${unit})`;
            }).join(', ');
        }
        return tx.layanan || 'Cuci Kering Setrika';
    };

    return (
        <div>
            {/* Header Section */}
            <div className="dashboard-header">
                <div className="header-title">
                    <h1>Riwayat Transaksi (Admin)</h1>
                    <p>Audit, hapus, dan perbarui data riwayat transaksi masuk secara real-time.</p>
                </div>
            </div>

            {/* Search Controls */}
            <div className="history-controls">
                <div className="search-bar-container">
                    <svg className="search-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input 
                        type="text" 
                        placeholder="Cari ID transaksi, pelanggan, kasir, atau status..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            {/* Table Card (Same structure and style as userAuth HistoryPage) */}
            <div className="table-card">
                <div className="table-header">
                    <span className="table-title">Daftar Transaksi</span>
                    <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                        Menampilkan {filteredTransactions.length} transaksi
                    </span>
                </div>
                
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
                        Mengambil data audit ledger...
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                        {searchQuery ? 'Tidak ada data yang cocok dengan kriteria pencarian.' : 'Belum ada transaksi terekam.'}
                    </div>
                ) : (
                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ fontWeight: '800', color: '#0f172a' }}>ID Transaksi</th>
                                    <th style={{ fontWeight: '800', color: '#0f172a' }}>Pelanggan</th>
                                    <th style={{ fontWeight: '800', color: '#0f172a' }}>Layanan</th>
                                    <th style={{ fontWeight: '800', color: '#0f172a' }}>No Handphone</th>
                                    <th style={{ fontWeight: '800', color: '#0f172a' }}>Alamat</th>
                                    <th style={{ fontWeight: '800', color: '#0f172a' }}>Total Harga</th>
                                    <th style={{ fontWeight: '800', color: '#0f172a' }}>Status Proses</th>
                                    <th style={{ fontWeight: '800', color: '#0f172a' }}>Tanggal & Waktu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...filteredTransactions].sort((a, b) => b.id - a.id).map((tx) => {
                                    return (
                                        <tr 
                                            key={tx.id} 
                                            onClick={() => {
                                                setSelectedTx(tx);
                                                setIsEditingInfo(false);
                                            }}
                                            style={{ cursor: 'pointer' }}
                                            className="clickable-row"
                                        >
                                            <td style={{ fontWeight: '700', color: '#2563eb' }}>{tx.invoice || tx.id}</td>
                                            <td>{tx.nama_pelanggan}</td>
                                            <td style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={getLayananText(tx)}>
                                                {getLayananText(tx)}
                                            </td>
                                            <td>{tx.nomor_hp || '-'}</td>
                                            <td>{tx.alamat || '-'}</td>
                                            <td className="price-text" style={{ fontWeight: '600' }}>{formatRupiah(tx.total_harga)}</td>
                                            <td>
                                                <select 
                                                    value={tx.status_pembayaran}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        handleStatusChange(tx.id, e.target.value);
                                                    }}
                                                    className={`status-select ${tx.status_pembayaran}`}
                                                >
                                                    <option value="antri">antri</option>
                                                    <option value="proses">proses</option>
                                                    <option value="selesai">selesai</option>
                                                    <option value="diambil">diambil</option>
                                                    <option value="batal">batal</option>
                                                </select>
                                            </td>
                                            <td>
                                                <div className="date-time-cell">
                                                    <span className="date-text">{formatDate(tx.created_at).date}</span>
                                                    {formatDate(tx.created_at).time && (
                                                        <span className="time-text" style={{ fontSize: '11px', color: '#6b7280' }}>{formatDate(tx.created_at).time}</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Admin Popup Detail Card - Sized down to maxWidth: '440px' */}
            {selectedTx && (
                <div className="modal-overlay" onClick={() => setSelectedTx(null)}>
                    <div 
                        className="modal-content" 
                        onClick={(e) => e.stopPropagation()} 
                        style={{ 
                            maxWidth: '400px', 
                            width: '90%', 
                            textAlign: 'left', 
                            padding: '16px',
                            borderRadius: '16px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                            position: 'relative',
                            maxHeight: '90vh',
                            overflowY: 'auto'
                        }}
                    >
                        <button 
                            onClick={() => setSelectedTx(null)}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: '#f3f4f6',
                                color: '#1f2937',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '800',
                                fontSize: '12px'
                            }}
                        >
                            &times;
                        </button>
                        
                        <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '12px', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginTop: 0 }}>Detail Transaksi</h2>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div>
                                <span style={{ fontSize: '10px', color: '#6b7280', display: 'block', fontWeight: '700', letterSpacing: '0.5px' }}>ID TRANSAKSI</span>
                                <span style={{ fontSize: '15px', fontWeight: '800', color: '#2563eb' }}>{selectedTx.invoice || selectedTx.id}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '10px', color: '#6b7280', display: 'block', fontWeight: '700', letterSpacing: '0.5px' }}>STATUS</span>
                                <span className={`badge ${selectedTx.status_pembayaran}`} style={{ 
                                    fontSize: '11px', 
                                    padding: '3px 10px', 
                                    fontWeight: '700', 
                                    borderRadius: '20px',
                                    backgroundColor: String(selectedTx.status_pembayaran).toLowerCase() === 'selesai' ? '#dbeafe' : (String(selectedTx.status_pembayaran).toLowerCase() === 'proses' || String(selectedTx.status_pembayaran).toLowerCase() === 'process' ? '#fef9c3' : (String(selectedTx.status_pembayaran).toLowerCase() === 'antri' || String(selectedTx.status_pembayaran).toLowerCase() === 'pending' ? '#fee2e2' : (String(selectedTx.status_pembayaran).toLowerCase() === 'diambil' ? '#d1fae5' : '#1f2937'))),
                                    color: String(selectedTx.status_pembayaran).toLowerCase() === 'selesai' ? '#2563eb' : (String(selectedTx.status_pembayaran).toLowerCase() === 'proses' || String(selectedTx.status_pembayaran).toLowerCase() === 'process' ? '#ca8a04' : (String(selectedTx.status_pembayaran).toLowerCase() === 'antri' || String(selectedTx.status_pembayaran).toLowerCase() === 'pending' ? '#ef4444' : (String(selectedTx.status_pembayaran).toLowerCase() === 'diambil' ? '#10b981' : '#ffffff')))
                                }}>
                                    {selectedTx.status_pembayaran}
                                </span>
                            </div>
                        </div>

                        {/* Customer Information View/Edit Mode */}
                        {!isEditingInfo ? (
                            <div style={{ background: '#f9fafb', padding: '14px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '14px', position: 'relative' }}>
                                <button 
                                    onClick={handleStartEdit}
                                    style={{
                                        position: 'absolute',
                                        top: '10px',
                                        right: '10px',
                                        background: '#eff6ff',
                                        color: '#2563eb',
                                        border: 'none',
                                        padding: '4px 8px',
                                        borderRadius: '8px',
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Edit Info
                                </button>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <span style={{ fontSize: '9px', color: '#6b7280', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Pelanggan</span>
                                        <span style={{ fontWeight: '700', fontSize: '13px', color: '#111827', textTransform: 'uppercase' }}>{selectedTx.nama_pelanggan}</span>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '9px', color: '#6b7280', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>No Handphone</span>
                                        <span style={{ fontWeight: '600', fontSize: '13px', color: '#111827' }}>{selectedTx.nomor_hp || '-'}</span>
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <span style={{ fontSize: '9px', color: '#6b7280', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Alamat</span>
                                        <span style={{ fontSize: '12px', color: '#374151', fontWeight: '500' }}>{selectedTx.alamat || '-'}</span>
                                    </div>
                                    {selectedTx.catatan && (
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <span style={{ fontSize: '9px', color: '#6b7280', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Catatan</span>
                                            <span style={{ fontSize: '12px', color: '#ef4444', fontStyle: 'italic', fontWeight: '500' }}>{selectedTx.catatan}</span>
                                        </div>
                                    )}
                                    <div>
                                        <span style={{ fontSize: '9px', color: '#6b7280', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Metode</span>
                                        <span style={{ fontWeight: '700', fontSize: '12px', color: '#065f46', textTransform: 'uppercase' }}>{selectedTx.metode_pembayaran || 'cash'}</span>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '9px', color: '#6b7280', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Kasir</span>
                                        <span style={{ fontWeight: '600', fontSize: '12px', color: '#111827' }}>{selectedTx.kasir || 'Siti Aminah'}</span>
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <span style={{ fontSize: '9px', color: '#6b7280', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Tanggal Masuk</span>
                                        <span style={{ fontSize: '12px', color: '#374151', fontWeight: '500' }}>
                                            {formatDate(selectedTx.created_at).date}, {formatDate(selectedTx.created_at).time}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSaveCustomerInfo} style={{ background: '#eff6ff', padding: '14px', borderRadius: '12px', border: '1px solid #bfdbfe', marginBottom: '14px' }}>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: '700', color: '#1e40af' }}>Edit Informasi Pelanggan</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                                    <input 
                                        type="text" 
                                        placeholder="Nama Pelanggan" 
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
                                        required
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Nomor Handphone" 
                                        value={editPhone}
                                        onChange={(e) => setEditPhone(e.target.value)}
                                        style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
                                        required
                                    />
                                    <textarea 
                                        placeholder="Alamat" 
                                        value={editAddress}
                                        onChange={(e) => setEditAddress(e.target.value)}
                                        style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', height: '50px', resize: 'none' }}
                                        required
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsEditingInfo(false)}
                                        style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px', border: 'none', background: '#e2e8f0', color: '#475569', cursor: 'pointer' }}
                                    >
                                        Batal
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={saving}
                                        style={{ padding: '4px 12px', fontSize: '11px', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: '700', cursor: 'pointer' }}
                                    >
                                        {saving ? "Menyimpan..." : "Simpan"}
                                    </button>
                                </div>
                            </form>
                        )}

                        <h3 style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Detail Layanan</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px', maxHeight: '120px', overflowY: 'auto' }}>
                            {(selectedTx.details || []).map((d, index) => {
                                const name = d.layanan ? d.layanan.nama : 'Layanan';
                                const qty = Math.round(d.jumlah || 1);
                                const unit = d.layanan ? d.layanan.satuan : 'kg';
                                const price = d.layanan ? d.layanan.harga : 0;
                                return (
                                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', paddingBottom: '4px', borderBottom: '1px dashed #e5e7eb' }}>
                                        <span style={{ color: '#4b5563' }}>{name} <strong style={{ color: '#111827' }}>x{qty} {unit}</strong> <span style={{ fontSize: '10px', color: '#888' }}>({formatRupiah(price)}/{unit})</span></span>
                                        <span style={{ fontWeight: '600', color: '#111827' }}>{formatRupiah(d.subtotal || (qty * price))}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Tax calculation 11% justified */}
                        {(() => {
                            const details = selectedTx.details || [];
                            const subtotalCalc = details.length > 0
                                ? details.reduce((sum, d) => sum + (d.subtotal || (Math.round(d.jumlah || 1) * (d.layanan ? d.layanan.harga : 0))), 0)
                                : Math.round((selectedTx.total_harga || selectedTx.price || 0) / 1.11);
                            const taxCalc = details.length > 0
                                ? Math.round(subtotalCalc * 0.11)
                                : (selectedTx.total_harga || selectedTx.price || 0) - subtotalCalc;
                            const totalCalc = subtotalCalc + taxCalc;
                            return (
                                <>
                                    <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569' }}>
                                            <span>Subtotal</span>
                                            <span style={{ fontWeight: '600' }}>{formatRupiah(subtotalCalc)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569' }}>
                                            <span>Pajak (11%)</span>
                                            <span style={{ fontWeight: '600' }}>{formatRupiah(taxCalc)}</span>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '14px', borderTop: '2px solid #e5e7eb', paddingTop: '10px', color: '#111827', marginBottom: '16px' }}>
                                        <span>TOTAL BAYAR</span>
                                        <span style={{ color: '#10b981', fontSize: '15px' }}>{formatRupiah(selectedTx.total_harga || selectedTx.price)}</span>
                                    </div>
                                </>
                            );
                        })()}

                        {/* Admin Action Buttons (Hapus) */}
                        {!isEditingInfo && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: '14px' }}>
                                <button 
                                    onClick={() => handleDeleteTx(selectedTx.id)}
                                    style={{
                                        padding: '8px 16px',
                                        background: '#fef2f2',
                                        color: '#ef4444',
                                        border: '1px solid #fee2e2',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                    Hapus Riwayat
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminHistoryPage;
