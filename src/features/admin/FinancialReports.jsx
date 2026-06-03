import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FinancialReports = () => {
    const [period, setPeriod] = useState('Bulanan');
    const [searchQuery, setSearchQuery] = useState('');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Download Modal States
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadFormat, setDownloadFormat] = useState('txt');

    const mockLedger = [
        { txId: '1001', customer: 'Amri Pratama', serviceType: 'Cuci & Lipat (2 kg)', paymentMethod: 'cash', dateTime: '24 Mei 2026 - 09.15 WIB', price: 26640, status: 'SELESAI', initials: 'AP', kasir: 'Siti Aminah' },
        { txId: '1002', customer: 'Rina Saputri', serviceType: 'Setrika Saja (3 kg)', paymentMethod: 'tf', dateTime: '25 Mei 2026 - 13.45 WIB', price: 39960, status: 'DIAMBIL', initials: 'RS', kasir: 'Budi Susanto' },
        { txId: '1003', customer: 'Fajar Nugroho', serviceType: 'Cuci Kering Setrika (2 kg)', paymentMethod: 'qris', dateTime: '26 Mei 2026 - 10.30 WIB', price: 48840, status: 'SELESAI', initials: 'FN', kasir: 'Siti Aminah' },
        { txId: '1004', customer: 'Dwi Lestari', serviceType: 'Cuci & Lipat (2 kg)', paymentMethod: 'cash', dateTime: '26 Mei 2026 - 15.20 WIB', price: 33300, status: 'PROSES', initials: 'DL', kasir: 'Budi Susanto' }
    ];

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
                const res = await axios.get(`${apiURL}/orders`);
                if (res.data.status === 'success') {
                    setOrders(res.data.data);
                }
            } catch (err) {
                console.error("Gagal mengambil orders untuk laporan keuangan", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const formatRupiah = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(num).replace('Rp', 'Rp ');
    };

    const getInitials = (name) => {
        if (!name) return 'CS';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    // Formatter quantities as integers
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

    // Predefined service overhead expense mapping
    const getOverheadCost = (serviceName) => {
        const name = String(serviceName).toLowerCase();
        if (name.includes('cuci & lipat') || name.includes('cuci lipat')) return 5000;
        if (name.includes('setrika saja')) return 3500;
        if (name.includes('cuci kering setrika')) return 6000;
        if (name.includes('pembersih pakaian') || name.includes('pembersih')) return 7000;
        if (name.includes('cuci selimut') || name.includes('selimut')) return 9000;
        if (name.includes('cuci gorden') || name.includes('gorden')) return 8000;
        if (name.includes('cuci seprai') || name.includes('seprai')) return 8000;
        if (name.includes('permak pakaian') || name.includes('permak')) return 7000;
        if (name.includes('cuci bed cover') || name.includes('bed cover')) return 15000;
        if (name.includes('cuci sepatu') || name.includes('sepatu')) return 18000;
        return 4000; // safe baseline fallback cost
    };

    // Calculate dynamic profit subtracting exact overhead per item
    const calculateProjectedProfit = (txs) => {
        let totalOverhead = 0;
        const targetList = txs.length > 0 ? txs : mockLedger.map(l => ({
            total_harga: l.price,
            layanan: l.serviceType,
            details: []
        }));

        targetList.forEach(tx => {
            if (tx.details && tx.details.length > 0) {
                tx.details.forEach(d => {
                    const sName = d.layanan ? d.layanan.nama : 'Layanan';
                    const qty = Math.round(d.jumlah || 1);
                    totalOverhead += getOverheadCost(sName) * qty;
                });
            } else {
                totalOverhead += getOverheadCost(tx.layanan || 'Cuci & Lipat') * 2; // fallback average qty 2
            }
        });

        const revenue = txs.reduce((sum, item) => sum + (item.total_harga || 0), 0);
        return Math.max(revenue - totalOverhead, 0);
    };

    // Map orders to ledger objects
    const ledger = orders.length > 0 ? orders.map(tx => {
        const dateObj = new Date(tx.created_at);
        const formattedDate = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        const formattedTime = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '.') + ' WIB';
        return {
            id: tx.id,
            txId: tx.invoice || String(tx.id),
            customer: tx.nama_pelanggan,
            serviceType: getLayananText(tx),
            paymentMethod: tx.metode_pembayaran || 'cash',
            date: formattedDate,
            time: formattedTime,
            dateTime: `${formattedDate} - ${formattedTime}`,
            price: tx.total_harga,
            status: (tx.status_pembayaran || 'pending').toUpperCase(),
            initials: getInitials(tx.nama_pelanggan),
            kasir: tx.kasir || 'Siti Aminah',
            phone: tx.nomor_hp || '-',
            address: tx.alamat || '-'
        };
    }) : mockLedger.map(m => {
        const parts = m.dateTime.split(' - ');
        return { 
            ...m, 
            id: parseInt(m.txId) || 0,
            date: parts[0] || m.dateTime, 
            time: parts[1] || '',
            phone: '08123456789', 
            address: 'Tenggilis Mejoyo' 
        };
    });

    // Filter real-time monthly, quarterly, yearly based on order creation date
    const getFilteredByPeriod = (items) => {
        const now = new Date();
        return items.filter(item => {
            // Safe fallback logic if created_at is not present (e.g. mock data)
            const txDate = item.created_at ? new Date(item.created_at) : now;
            const diffMs = now - txDate;
            const diffDays = diffMs / (1000 * 60 * 60 * 24);
            
            if (period === 'Bulanan') {
                return diffDays <= 30;
            } else if (period === 'Triwulan') {
                return diffDays <= 90;
            } else if (period === 'Tahunan') {
                return diffDays <= 365;
            }
            return true;
        });
    };

    const periodFilteredOrders = getFilteredByPeriod(orders);
    const totalRevenue = periodFilteredOrders.length > 0 
        ? periodFilteredOrders.reduce((sum, item) => sum + (item.total_harga || 0), 0)
        : ledger.reduce((sum, item) => sum + item.price, 0);

    const projectedProfit = periodFilteredOrders.length > 0 
        ? calculateProjectedProfit(periodFilteredOrders)
        : calculateProjectedProfit(orders);

    const filteredLedger = ledger.filter(l => 
        l.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.txId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.dateTime.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(l.kasir || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedLedger = [...filteredLedger].sort((a, b) => b.id - a.id);

    const handleDownload = () => {
        setIsDownloading(true);
        setDownloadProgress(10);
        
        const interval = setInterval(() => {
            setDownloadProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        let content = `LAPORAN KEUANGAN - LAUNDRYINAJA\n`;
                        content += `Periode: ${period}\n`;
                        content += `Dibuat pada: ${new Date().toLocaleString('id-ID')}\n`;
                        content += `==============================================\n`;
                        content += `Total Pendapatan   : ${formatRupiah(totalRevenue)}\n`;
                        content += `Estimasi Profit Bersih: ${formatRupiah(projectedProfit)}\n\n`;
                        content += `LOG TRANSAKSI KEUANGAN:\n`;
                        filteredLedger.forEach(l => {
                            content += `${l.txId} | ${l.customer} | ${l.serviceType} | KASIR: ${l.kasir} | METODE: ${l.paymentMethod.toUpperCase()} | ${l.dateTime} | ${formatRupiah(l.price)} | ${l.status}\n`;
                        });
                        
                        const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.setAttribute("href", url);
                        link.setAttribute("download", `laporan_keuangan_${period.toLowerCase()}_${new Date().toISOString().split('T')[0]}.${downloadFormat}`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);

                        setIsDownloading(false);
                        setShowDownloadModal(false);
                        setDownloadProgress(0);
                    }, 800);
                    return 100;
                }
                return prev + 30;
            });
        }, 250);
    };

    return (
        <div>
            {/* Header Section */}
            <div className="dashboard-header">
                <div className="header-title">
                    <h1>Laporan Keuangan</h1>
                    <p>Detail keuangan dan analisis bisnis secara real-time</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '24px', padding: '2px' }}>
                        {['Bulanan', 'Triwulan', 'Tahunan'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setPeriod(t)}
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    backgroundColor: period === t ? '#ffffff' : 'transparent',
                                    color: period === t ? '#0f172a' : 'var(--text-muted)',
                                    boxShadow: period === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={() => {
                            setDownloadProgress(0);
                            setIsDownloading(false);
                            setShowDownloadModal(true);
                        }}
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
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" x2="12" y1="15" y2="3" />
                        </svg>
                        Unduh Laporan
                    </button>
                </div>
            </div>

            {/* Metrics cards (Average Order Value removed, 2-columns) */}
            <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div className="metric-card green" style={{ padding: '20px' }}>
                    <div className="metric-info">
                        <span className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            TOTAL REVENUE ({period.toUpperCase()})
                        </span>
                        <span className="metric-value" style={{ fontSize: '26px', fontWeight: '700' }}>{formatRupiah(totalRevenue)}</span>
                    </div>
                    <div className="metric-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <rect width="20" height="14" x="2" y="5" rx="2" />
                            <line x1="2" x2="22" y1="10" y2="10" />
                        </svg>
                    </div>
                </div>

                <div className="metric-card purple" style={{ padding: '20px' }}>
                    <div className="metric-info">
                        <span className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            PROJECTED NET PROFIT
                        </span>
                        <span className="metric-value" style={{ fontSize: '26px', fontWeight: '700' }}>{formatRupiah(projectedProfit)}</span>
                    </div>
                    <div className="metric-icon" style={{ background: '#ede9fe', color: '#8b5cf6' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" x2="18" y1="20" y2="10" />
                            <line x1="12" x2="12" y1="20" y2="4" />
                            <line x1="6" x2="6" y1="20" y2="14" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Transaction Ledger */}
            <div className="table-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <span className="table-title" style={{ display: 'block', fontSize: '16px', fontWeight: '600' }}>Log Transaksi Keuangan</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                            Catatan keuangan real-time dari seluruh transaksi outlet.
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="search-bar-container" style={{ width: '220px', margin: 0 }}>
                            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '13px' }}>🔍</span>
                            <input 
                                type="text" 
                                placeholder="Cari nama, ID, layanan, tanggal..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                                style={{ padding: '8px 12px 8px 34px', fontSize: '13px', borderRadius: '18px' }}
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Memuat log keuangan...</div>
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
                                {sortedLedger.map((l, index) => {
                                    const statusLower = l.status.toLowerCase();
                                    let badgeClass = statusLower;
                                    if (statusLower === 'success' || statusLower === 'diambil') badgeClass = 'diambil';
                                    else if (statusLower === 'pending' || statusLower === 'antri') badgeClass = 'antri';
                                    else if (statusLower === 'proses' || statusLower === 'process') badgeClass = 'proses';
                                    else if (statusLower === 'selesai') badgeClass = 'selesai';
                                    else if (statusLower === 'batal') badgeClass = 'batal';

                                    return (
                                        <tr key={index}>
                                            <td style={{ fontWeight: '600', color: '#0f172a' }}>{l.txId}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div 
                                                        style={{ 
                                                            width: '28px', 
                                                            height: '28px', 
                                                            borderRadius: '50%', 
                                                            backgroundColor: '#eff6ff', 
                                                            color: '#2563eb', 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            justifyContent: 'center',
                                                            fontWeight: '600',
                                                            fontSize: '11px'
                                                        }}
                                                    >
                                                        {l.initials}
                                                    </div>
                                                    <span style={{ fontWeight: '600', fontSize: '13px' }}>{l.customer}</span>
                                                </div>
                                            </td>
                                            <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.serviceType}>
                                                {l.serviceType}
                                            </td>
                                            <td>{l.phone || '-'}</td>
                                            <td>{l.address || '-'}</td>
                                            <td className="price-text" style={{ fontWeight: '600' }}>{formatRupiah(l.price)}</td>
                                            <td>
                                                <span 
                                                    className={`badge ${badgeClass}`}
                                                    style={{ fontSize: '11px', padding: '4px 10px', fontWeight: '700', textTransform: 'uppercase' }}
                                                >
                                                    {badgeClass}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="date-time-cell">
                                                    <span className="date-text">{l.date}</span>
                                                    {l.time && (
                                                        <span className="time-text" style={{ fontSize: '11px', color: '#6b7280' }}>{l.time}</span>
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

            {/* Gorgeous, Custom Download Modal Popup */}
            {showDownloadModal && (
                <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 1000 }}>
                    <div className="modal-content" style={{ 
                        maxWidth: '420px', 
                        width: '90%', 
                        textAlign: 'center', 
                        borderRadius: '24px', 
                        padding: '30px', 
                        background: '#ffffff',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                        position: 'relative'
                    }}>
                        {!isDownloading ? (
                            <>
                                <button 
                                    onClick={() => setShowDownloadModal(false)}
                                    style={{
                                        position: 'absolute',
                                        top: '16px',
                                        right: '16px',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        backgroundColor: '#f1f5f9',
                                        color: '#475569',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: '800',
                                        fontSize: '13px',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                >
                                    X
                                </button>

                                <div style={{ 
                                    width: '60px', 
                                    height: '60px', 
                                    borderRadius: '50%', 
                                    background: '#eff6ff', 
                                    color: '#2563eb',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 16px auto',
                                    fontSize: '24px'
                                }}>
                                    📥
                                </div>

                                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Ekspor Laporan Keuangan</h3>
                                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', lineHeight: '1.4' }}>Pilih format laporan untuk mengunduh riwayat keuangan ({period.toLowerCase()}) laundry Anda.</p>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                                    <button
                                        onClick={() => setDownloadFormat('txt')}
                                        style={{
                                            padding: '12px',
                                            borderRadius: '12px',
                                            border: downloadFormat === 'txt' ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                                            background: downloadFormat === 'txt' ? '#eff6ff' : '#ffffff',
                                            color: downloadFormat === 'txt' ? '#1e40af' : '#475569',
                                            fontWeight: '700',
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '4px',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <span style={{ fontSize: '18px' }}>📄</span>
                                        Berkas Teks (.txt)
                                    </button>
                                    <button
                                        onClick={() => setDownloadFormat('csv')}
                                        style={{
                                            padding: '12px',
                                            borderRadius: '12px',
                                            border: downloadFormat === 'csv' ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                                            background: downloadFormat === 'csv' ? '#eff6ff' : '#ffffff',
                                            color: downloadFormat === 'csv' ? '#1e40af' : '#475569',
                                            fontWeight: '700',
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '4px',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <span style={{ fontSize: '18px' }}>📊</span>
                                        Berkas Excel (.csv)
                                    </button>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                    <button 
                                        onClick={() => setShowDownloadModal(false)}
                                        style={{ 
                                            padding: '10px 22px', 
                                            borderRadius: '24px', 
                                            border: '1.5px solid #cbd5e1', 
                                            cursor: 'pointer', 
                                            background: '#ffffff',
                                            color: '#475569',
                                            fontWeight: '600',
                                            fontSize: '13.5px'
                                        }}
                                    >
                                        Batal
                                    </button>
                                    <button 
                                        onClick={handleDownload}
                                        style={{ 
                                            padding: '10px 24px', 
                                            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
                                            color: '#ffffff', 
                                            borderRadius: '24px', 
                                            border: 'none', 
                                            cursor: 'pointer',
                                            fontWeight: '700',
                                            fontSize: '13.5px',
                                            boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)'
                                        }}
                                    >
                                        Mulai Unduh
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ padding: '10px 0' }}>
                                <div className="download-spinner-container" style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 20px auto' }}>
                                    <div style={{
                                        boxSizing: 'border-box',
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        border: '5px solid #eff6ff',
                                        borderTopColor: '#2563eb',
                                        animation: 'spin 1s linear infinite'
                                    }} />
                                    <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '18px', fontWeight: '700', color: '#2563eb' }}>
                                        {downloadProgress}%
                                    </span>
                                </div>

                                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Menyiapkan Laporan</h3>
                                <p style={{ fontSize: '13px', color: '#64748b' }}>Sedang menyusun data audit log dan menghasilkan dokumen...</p>

                                <div style={{ 
                                    width: '100%', 
                                    height: '6px', 
                                    backgroundColor: '#f1f5f9', 
                                    borderRadius: '3px', 
                                    marginTop: '20px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ 
                                        width: `${downloadProgress}%`, 
                                        height: '100%', 
                                        backgroundColor: '#2563eb', 
                                        borderRadius: '3px',
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinancialReports;
