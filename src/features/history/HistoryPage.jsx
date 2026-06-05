import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { updateTransactionStatus } from '../../service/transactionService';

const HistoryPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedTx, setSelectedTx] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
                const res = await axios.get(`${apiURL}/orders`);
                if (res.data.status === 'success') {
                    setTransactions(res.data.data);
                }
            } catch (err) {
                console.error("Gagal mengambil riwayat transaksi:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const formatRupiah = (num) => {
        if (num === undefined || num === null) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(num).replace('Rp', 'Rp ');
    };

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

    const handleStatusChange = async (id, newStatus) => {
        try {
            await updateTransactionStatus(id, newStatus);
            setTransactions(prev => 
                prev.map(tx => tx.id === id ? { ...tx, status_pembayaran: newStatus } : tx)
            );
            
            setSelectedTx(prev => prev && prev.id === id ? { ...prev, status_pembayaran: newStatus } : prev);
        } catch (err) {
            console.error("Gagal memperbarui status transaksi:", err);
            setTransactions(prev => 
                prev.map(tx => tx.id === id ? { ...tx, status_pembayaran: newStatus } : tx)
            );
            setSelectedTx(prev => prev && prev.id === id ? { ...prev, status_pembayaran: newStatus } : prev);
        }
    };

    const filteredTransactions = [...transactions]
    .sort((a, b) => b.id - a.id)
    .filter(tx => {
        const query = searchQuery.toLowerCase();
        const invoice = String(tx.invoice || tx.id || '').toLowerCase();
        const name = String(tx.nama_pelanggan || '').toLowerCase();
        
        let servicesStr = '';
        if (tx.details && tx.details.length > 0) {
            servicesStr = tx.details.map(d => d.layanan ? d.layanan.nama : '').join(' ').toLowerCase();
        }
        
        const dateObj = formatDate(tx.created_at);
        const dateStr = String(dateObj.date || '').toLowerCase();
        const timeStr = String(dateObj.time || '').toLowerCase();
        const rawDateStr = String(tx.created_at || '').toLowerCase();

        return invoice.includes(query) || 
               name.includes(query) || 
               servicesStr.includes(query) || 
               dateStr.includes(query) || 
               timeStr.includes(query) || 
               rawDateStr.includes(query);
    });

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
            <div className="dashboard-header">
                <div className="header-title">
                    <h1>Riwayat Transaksi</h1>
                    <p>Daftar seluruh transaksi yang telah tercatat di outlet.</p>
                </div>
            </div>

            <div className="history-controls">
                <div className="search-bar-container">
                    <svg className="search-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input 
                        type="text" 
                        placeholder="Cari nama, id transaksi, tanggal..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            <div className="table-card">
                <div className="table-header">
                    <span className="table-title">Daftar Transaksi</span>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>
                        Menampilkan {filteredTransactions.length} transaksi
                    </span>
                </div>
                
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
                        Mengambil data transaksi...
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                        {searchQuery ? 'Tidak ada transaksi yang cocok dengan pencarian.' : 'Belum ada riwayat transaksi.'}
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
                                    <th style={{ fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap' }}>Tanggal & Waktu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.map((tx) => {
                                    return (
                                        <tr 
                                            key={tx.id} 
                                            onClick={() => setSelectedTx(tx)}
                                            style={{ cursor: 'pointer' }}
                                            className="clickable-row"
                                        >
                                            <td style={{ fontWeight: '600' }}>{tx.invoice || tx.id}</td>
                                            <td style={{ textTransform: 'uppercase' }}>{tx.nama_pelanggan}</td>
                                            <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={getLayananText(tx)}>
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
                                                        <span className="time-text">{formatDate(tx.created_at).time}</span>
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

            {selectedTx && (
                <div className="modal-overlay" onClick={() => setSelectedTx(null)}>
                    <div 
                        className="modal-content" 
                        onClick={(e) => e.stopPropagation()} 
                        style={{ 
                            maxWidth: '400px', 
                            width: '90%', 
                            textAlign: 'left', 
                            borderRadius: '16px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                            maxHeight: '90vh',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: '#ffffff'
                        }}
                    >
                        <div style={{ overflowY: 'auto', padding: '16px', flex: 1 }}>
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
                                fontSize: '12px',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        >
                            &times;
                        </button>
                        
                        <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginTop: 0 }}>Detail Transaksi</h2>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div>
                                <span style={{ fontSize: '10px', color: '#6b7280', display: 'block', fontWeight: '600', letterSpacing: '0.5px' }}>ID TRANSAKSI</span>
                                <span style={{ fontSize: '15px', fontWeight: '700', color: '#2563eb' }}>{selectedTx.invoice || selectedTx.id}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '10px', color: '#6b7280', display: 'block', fontWeight: '600', letterSpacing: '0.5px' }}>STATUS</span>
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

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', background: '#f9fafb', padding: '16px', borderRadius: '14px', border: '1px solid #e5e7eb' }}>
                            <div>
                                <span style={{ fontSize: '10px', color: '#6b7280', display: 'block', textTransform: 'uppercase', fontWeight: '600' }}>Pelanggan</span>
                                <span style={{ fontWeight: '700', fontSize: '14px', color: '#111827', textTransform: 'uppercase' }}>{selectedTx.nama_pelanggan}</span>
                            </div>
                            <div>
                                <span style={{ fontSize: '10px', color: '#6b7280', display: 'block', textTransform: 'uppercase', fontWeight: '600' }}>No Handphone</span>
                                <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{selectedTx.nomor_hp || '-'}</span>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <span style={{ fontSize: '10px', color: '#6b7280', display: 'block', textTransform: 'uppercase', fontWeight: '600' }}>Alamat</span>
                                <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>{selectedTx.alamat || '-'}</span>
                            </div>
                            {selectedTx.catatan && (
                                <div style={{ gridColumn: 'span 2' }}>
                                    <span style={{ fontSize: '10px', color: '#6b7280', display: 'block', textTransform: 'uppercase', fontWeight: '600' }}>Catatan</span>
                                    <span style={{ fontSize: '13px', color: '#ef4444', fontStyle: 'italic', fontWeight: '500' }}>{selectedTx.catatan}</span>
                                </div>
                            )}
                            <div>
                                <span style={{ fontSize: '10px', color: '#6b7280', display: 'block', textTransform: 'uppercase', fontWeight: '600' }}>Metode Pembayaran</span>
                                <span style={{ fontWeight: '700', fontSize: '13px', color: '#065f46', textTransform: 'uppercase' }}>{selectedTx.metode_pembayaran || 'cash'}</span>
                            </div>
                            <div>
                                <span style={{ fontSize: '10px', color: '#6b7280', display: 'block', textTransform: 'uppercase', fontWeight: '600' }}>Kasir Penginput</span>
                                <span style={{ fontWeight: '600', fontSize: '13px', color: '#111827' }}>{selectedTx.kasir || 'Siti Aminah'}</span>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <span style={{ fontSize: '10px', color: '#6b7280', display: 'block', textTransform: 'uppercase', fontWeight: '600' }}>Tanggal Masuk</span>
                                <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>
                                    {formatDate(selectedTx.created_at).date}, {formatDate(selectedTx.created_at).time}
                                </span>
                            </div>
                        </div>

                        <h3 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Detail Layanan</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', maxHeight: '150px', overflowY: 'auto' }}>
                            {(selectedTx.details || []).map((d, index) => {
                                const name = d.layanan ? d.layanan.nama : 'Layanan';
                                const qty = Math.round(d.jumlah || 1);
                                const unit = d.layanan ? d.layanan.satuan : 'kg';
                                const price = d.layanan ? d.layanan.harga : 0;
                                return (
                                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingBottom: '6px', borderBottom: '1px dashed #e5e7eb' }}>
                                        <span style={{ color: '#4b5563' }}>{name} <strong style={{ color: '#111827' }}>x{qty} {unit}</strong> <span style={{ fontSize: '11px', color: '#888' }}>({formatRupiah(price)}/{unit})</span></span>
                                        <span style={{ fontWeight: '600', color: '#111827' }}>{formatRupiah(d.subtotal || (qty * price))}</span>
                                    </div>
                                );
                            })}
                        </div>

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
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '14px', borderTop: '2px solid #e5e7eb', paddingTop: '10px', color: '#111827' }}>
                                        <span>TOTAL BAYAR</span>
                                        <span style={{ color: '#10b981', fontSize: '15px' }}>{formatRupiah(selectedTx.total_harga || selectedTx.price)}</span>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            </div>
            )}
        </div>
    );
};

export default HistoryPage;