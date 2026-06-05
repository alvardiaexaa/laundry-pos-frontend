import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProductManagementPage = () => {
    const [services, setServices] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [category, setCategory] = useState('normal'); // Default ke 'normal' sesuai tab aktif Anda
    const [draggedItemId, setDraggedItemId] = useState(null);
    const [previousServices, setPreviousServices] = useState(null);
    const [showUndoToast, setShowUndoToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Gunakan Ref untuk menghindari bug stale closure saat event HTML5 drag-and-drop
    const servicesRef = React.useRef(services);
    useEffect(() => {
        servicesRef.current = services;
    }, [services]);

    // Modal State untuk Tambah / Edit Layanan
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
    const [formData, setFormData] = useState({ nama: '', harga: '', satuan: 'kg', kategori: 'normal', status: 'AKTIF' });
    const [selectedService, setSelectedService] = useState(null);

    // State Konfirmasi Hapus
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState(null);

    const handleOpenAddModal = () => {
        setFormData({ nama: '', harga: '', satuan: 'kg', kategori: 'normal', status: 'AKTIF' });
        setModalMode('add');
        setShowModal(true);
    };

    const handleOpenEditModal = (service) => {
        setSelectedService(service);
        setFormData({
            nama: service.nama,
            harga: service.harga,
            satuan: service.satuan || 'kg',
            kategori: service.kategori || 'normal',
            status: service.status || 'AKTIF'
        });
        setModalMode('edit');
        setShowModal(true);
    };

    const handleOpenDeleteConfirm = (service) => {
        setServiceToDelete(service);
        setShowDeleteConfirm(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        try {
            if (modalMode === 'add') {
                const res = await axios.post(`${apiURL}/services`, formData);
                if (res.data.status === 'success') {
                    setServices(prev => [...prev, res.data.data]);
                }
            } else {
                const res = await axios.put(`${apiURL}/services/${selectedService.id}`, formData);
                if (res.data.status === 'success') {
                    setServices(prev => prev.map(s => s.id === selectedService.id ? res.data.data : s));
                }
            }
            setShowModal(false);
        } catch (err) {
            console.error("Gagal menyimpan layanan", err);
            alert("Gagal menyimpan layanan: " + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteConfirm = async () => {
        if (!serviceToDelete) return;
        const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        try {
            const res = await axios.delete(`${apiURL}/services/${serviceToDelete.id}`);
            if (res.data.status === 'success') {
                setServices(prev => prev.filter(s => s.id !== serviceToDelete.id));
            }
            setShowDeleteConfirm(false);
            setServiceToDelete(null);
        } catch (err) {
            console.error("Gagal menghapus layanan", err);
            alert("Gagal menghapus layanan: " + (err.response?.data?.message || err.message));
        }
    };

    const renderBadge = (index) => {
        const styles = [
            { bg: '#fef3c7', text: '#b45309', label: '1' }, // Gold
            { bg: '#e2e8f0', text: '#475569', label: '2' }, // Silver
            { bg: '#ffedd5', text: '#c2410c', label: '3' }, // Bronze
        ];
        const current = styles[index] || { bg: '#f1f5f9', text: '#64748b', label: String(index + 1) };
        return (
            <span style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                backgroundColor: current.bg, 
                color: current.text, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '12px', 
                fontWeight: '800' 
            }}>
                {current.label}
            </span>
        );
    };

    // Fallback Dummy Data jika API kosong/error (Disamakan dengan data di halaman Kasir)
    const dummyServices = [
        { id: 1, nama: 'Cuci & Lipat', harga: 10000, satuan: 'kg', kategori: 'normal', status: 'AKTIF' },
        { id: 3, nama: 'Cuci Kering Setrika', harga: 12000, satuan: 'kg', kategori: 'normal', status: 'AKTIF' },
        { id: 4, nama: 'Pembersih Pakaian', harga: 15000, satuan: 'item', kategori: 'normal', status: 'AKTIF' },
        { id: 5, nama: 'Cuci Selimut', harga: 20000, satuan: 'item', kategori: 'normal', status: 'AKTIF' },
        { id: 6, nama: 'Cuci Gorden', harga: 15000, satuan: 'kg', kategori: 'normal', status: 'AKTIF' },
        { id: 7, nama: 'Cuci Seprai', harga: 15000, satuan: 'item', kategori: 'normal', status: 'AKTIF' },
        { id: 2, nama: 'Setrika Saja', harga: 7000, satuan: 'kg', kategori: 'express', status: 'AKTIF' },
        { id: 8, nama: 'Permak Pakaian', harga: 25000, satuan: 'item', kategori: 'express', status: 'AKTIF' },
        { id: 9, nama: 'Cuci Bed Cover', harga: 37000, satuan: 'item', kategori: 'express', status: 'AKTIF' },
        { id: 10, nama: 'Cuci Sepatu', harga: 45000, satuan: 'pasang', kategori: 'express', status: 'AKTIF' },
    ];

    useEffect(() => {
        const fetchData = async () => {
            const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
            
            // 1. Ambil Data Layanan dari Backend
            try {
                const resService = await axios.get(`${apiURL}/services`);
                let rawServices = (resService.data.status === 'success' && resService.data.data.length > 0)
                    ? resService.data.data
                    : dummyServices;

                // The API now returns sorted data by urutan automatically
                setServices(rawServices);
            } catch (err) {
                console.error("Gagal memuat layanan, menggunakan data lokal", err);
                setServices(dummyServices);
            }

            // 2. Ambil Data Transaksi untuk Menghitung Popularitas Layanan
            try {
                const resTx = await axios.get(`${apiURL}/transactions`);
                if (resTx.data.status === 'success') {
                    setTransactions(resTx.data.data);
                }
            } catch (err) {
                console.error("Gagal memuat data transaksi untuk statistik popularitas", err);
                // Data simulasi jika API offline agar grafik kanan tetap tampil cantik
                setTransactions([
                    { cart: [{ name: 'Cuci & Lipat', quantity: 6 }, { name: 'Pembersih Pakaian', quantity: 2 }] },
                    { cart: [{ name: 'Cuci Kering Setrika', quantity: 3 }, { name: 'Cuci & Lipat', quantity: 0 }] }
                ]);
            }
        };
        fetchData();
    }, [category]); // Reload data ketika admin berpindah tab kategori

    // --- FITUR DRAG AND DROP (GESER KARTU) ---
    const handleDragStart = (e, id) => {
        setDraggedItemId(id);
        e.dataTransfer.effectAllowed = "move";
        setPreviousServices([...servicesRef.current]);
    };

    const handleDragOver = (e, targetId) => {
        e.preventDefault();
        if (draggedItemId === null || draggedItemId === targetId) return;

        const currentServices = servicesRef.current;
        const draggedIndex = currentServices.findIndex(item => item.id === draggedItemId);
        const targetIndex = currentServices.findIndex(item => item.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        // Validasi agar tidak menggeser antar kategori yang berbeda
        if (currentServices[draggedIndex].kategori.toLowerCase() !== currentServices[targetIndex].kategori.toLowerCase()) return;

        const updatedServices = [...currentServices];
        const [removed] = updatedServices.splice(draggedIndex, 1);
        updatedServices.splice(targetIndex, 0, removed);

        // Update ref secara sinkron dan instan untuk menghindari stale closures
        servicesRef.current = updatedServices;
        setServices(updatedServices);
    };

    const handleDragEnd = async () => {
        setDraggedItemId(null);
        
        try {
            const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
            const res = await axios.put(`${apiURL}/services/reorder`, {
                ordered_ids: servicesRef.current.map(s => s.id)
            });
            if (res.data.status === 'success') {
                setToastMessage("Urutan layanan berhasil diperbarui.");
                setShowUndoToast(true);

                if (window.undoTimeout) clearTimeout(window.undoTimeout);
                window.undoTimeout = setTimeout(() => {
                    setShowUndoToast(false);
                    setPreviousServices(null);
                }, 6000);

                // Ambil ulang data terurut dari backend untuk verifikasi mutlak
                const resService = await axios.get(`${apiURL}/services`);
                if (resService.data.status === 'success' && resService.data.data.length > 0) {
                    setServices(resService.data.data);
                    servicesRef.current = resService.data.data;
                }
            } else {
                alert("Gagal menyimpan urutan: " + res.data.message);
            }
        } catch (err) {
            console.error("Gagal menyimpan urutan ke server", err);
            alert("Gagal menyimpan urutan ke server: " + (err.response?.data?.message || err.message));
        }
    };

    const handleUndoReorder = async () => {
        if (!previousServices) return;

        setServices(previousServices);
        servicesRef.current = previousServices;
        setShowUndoToast(false);

        try {
            const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
            const res = await axios.put(`${apiURL}/services/reorder`, {
                ordered_ids: previousServices.map(s => s.id)
            });
            if (res.data.status === 'success') {
                setToastMessage("Urutan berhasil dikembalikan!");
                setShowUndoToast(true);
                setPreviousServices(null);
                setTimeout(() => {
                    setShowUndoToast(false);
                }, 3000);
            }
        } catch (err) {
            console.error("Gagal mengembalikan urutan", err);
            alert("Gagal mengembalikan urutan: " + (err.response?.data?.message || err.message));
        }
    };

    // --- FITUR HITUNG POPULARITAS LAYANAN (SEBELAH KANAN) ---
    const getPopularityData = () => {
        const counts = {};
        transactions.forEach(tx => {
            if (tx.cart && Array.isArray(tx.cart)) {
                tx.cart.forEach(item => {
                    const name = item.name || item.nama;
                    if (name) {
                        counts[name] = (counts[name] || 0) + (item.quantity || 1);
                    }
                });
            }
        });

        return Object.keys(counts)
            .map(name => ({ name, count: counts[name] }))
            .sort((a, b) => b.count - a.count);
    };

    const popularServices = getPopularityData();
    const displayedServices = services.filter(s => s.kategori.toLowerCase() === category.toLowerCase());

    const renderServiceIcon = (name, kategori = '') => {
        const isExpress = (kategori || '').toLowerCase() === 'express';
        const bgIconColor = isExpress ? '#fff0e0' : '#eff6ff';
        const iconColor = isExpress ? '#ff7a00' : '#2563eb';

        if (name.toLowerCase().includes('setrika') && !name.toLowerCase().includes('cuci')) {
            return (
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: bgIconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 8h11a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z" /><path d="M5 8V5a2 2 0 0 1 2-2h3" /></svg>
                </div>
            );
        }
        if (name.toLowerCase().includes('permak') || name.toLowerCase().includes('pakaian') || name.toLowerCase().includes('pembersih')) {
            return (
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: bgIconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46L16 7.83l-1.42-1.42 4.38-4.38a1 1 0 0 1 1.42 0l1 1a1 1 0 0 1 0 1.43zM10.5 22h7a2.5 2.5 0 0 0 2.5-2.5V14h-10v5.5a2.5 2.5 0 0 0 2.5 2.5zM4 14h6.5v8H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z" /></svg>
                </div>
            );
        }
        return (
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: bgIconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /><path d="M12 20a8 8 0 0 0 8-8" /></svg>
            </div>
        );
    };

    return (
        <div style={{ padding: '32px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2.4fr 1.2fr', gap: '32px', alignItems: 'start' }}>
                
                {/* SISI KIRI: MANAJEMEN PRODUK CARD */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Manajemen Produk</h1>
                            
                            <div style={{ display: 'flex', gap: '4px', backgroundColor: '#fff', padding: '4px', borderRadius: '9999px', border: '1px solid #e2e8f0' }}>
                                <button onClick={() => setCategory('express')} style={{ padding: '6px 20px', borderRadius: '9999px', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer', backgroundColor: category === 'express' ? '#fff0e0' : 'transparent', color: category === 'express' ? '#ff7a00' : '#64748b', transition: 'all 0.2s' }}>
                                    Express
                                </button>
                                <button onClick={() => setCategory('normal')} style={{ padding: '6px 20px', borderRadius: '9999px', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer', backgroundColor: category === 'normal' ? '#e0f2fe' : 'transparent', color: category === 'normal' ? '#0369a1' : '#64748b', transition: 'all 0.2s' }}>
                                    Normal
                                </button>
                            </div>
                        </div>

                        <button 
                            onClick={handleOpenAddModal} 
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                padding: '10px 20px', 
                                borderRadius: '12px', 
                                border: 'none', 
                                backgroundColor: '#2563eb', 
                                color: '#fff', 
                                fontSize: '13px', 
                                fontWeight: '600', 
                                cursor: 'pointer', 
                                boxShadow: '0 4px 6px -1px rgba(37,99,235,0.2)', 
                                transition: 'all 0.2s' 
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            Tambah Layanan
                        </button>
                    </div>

                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '28px' }}>💡 <i>Klik lama / Tahan dan geser (drag) kartu untuk mengatur urutan tampilan menu kasir user.</i></p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                        {displayedServices.map((service) => (
                            <div 
                                key={service.id} 
                                draggable
                                onDragStart={(e) => handleDragStart(e, service.id)}
                                onDragOver={(e) => handleDragOver(e, service.id)}
                                onDragEnd={handleDragEnd}
                                style={{ 
                                    backgroundColor: '#ffffff', borderRadius: '24px', padding: '24px', 
                                    boxShadow: draggedItemId === service.id ? '0 20px 25px -5px rgba(0,0,0,0.08)' : '0 4px 6px -1px rgba(0,0,0,0.02)', 
                                    border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', 
                                    position: 'relative', textAlign: 'center', cursor: 'grab',
                                    opacity: draggedItemId === service.id ? 0.4 : 1,
                                    transition: 'transform 0.1s ease'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '14px', position: 'relative' }}>
                                    {renderServiceIcon(service.nama, service.kategori)}
                                    
                                    <div style={{ position: 'absolute', right: '0', top: '0', display: 'flex', gap: '12px' }}>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleOpenEditModal(service); }}
                                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#f97316', padding: '4px' }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleOpenDeleteConfirm(service); }}
                                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                        </button>
                                    </div>
                                </div>

                                <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', color: service.kategori.toLowerCase() === 'express' ? '#ff7a00' : '#2563eb', marginBottom: '6px' }}>
                                    {service.kategori}
                                </span>

                                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 20px 0' }}>{service.nama}</h3>
                                <div style={{ width: '100%', height: '1px', backgroundColor: '#f1f5f9', marginBottom: '16px' }}></div>

                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontWeight: '600', marginBottom: '2px' }}>Harga</span>
                                        <span style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
                                            Rp {service.harga.toLocaleString('id-ID')}
                                            <span style={{ fontSize: '12px', fontWeight: '500', color: '#64748b' }}>/{service.satuan}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ 
                    backgroundColor: '#ffffff', 
                    borderRadius: '24px', 
                    padding: '28px', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02), 0 4px 6px -2px rgba(0,0,0,0.02)', 
                    marginTop: '80px' 
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '10px', 
                            backgroundColor: '#ffedd5', 
                            color: '#ea580c', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                        }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z"/></svg>
                        </div>
                        <div>
                            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Popularitas Layanan</h2>
                        </div>
                    </div>
                    
                    <div style={{ width: '100%', height: '1px', backgroundColor: '#f1f5f9', margin: '20px 0' }}></div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {popularServices.length === 0 ? (
                            <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>Belum ada rekapan data transaksi.</p>
                        ) : (
                            popularServices.map((item, index) => {
                                const maxCount = popularServices[0]?.count || 1;
                                const widthPercentage = Math.min(100, (item.count / maxCount) * 100);

                                let progressGradient = 'linear-gradient(90deg, #64748b 0%, #94a3b8 100%)';
                                if (index === 0) progressGradient = 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)';
                                else if (index === 1) progressGradient = 'linear-gradient(90deg, #10b981 0%, #34d399 100%)';
                                else if (index === 2) progressGradient = 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)';

                                return (
                                    <div 
                                        key={index} 
                                        style={{ 
                                            backgroundColor: '#f8fafc', 
                                            borderRadius: '16px', 
                                            padding: '16px', 
                                            border: '1px solid #f1f5f9',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '10px',
                                            transition: 'transform 0.2s',
                                            cursor: 'default'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {renderBadge(index)}
                                                <span style={{ fontSize: '14px', fontWeight: '700', color: '#334155' }}>
                                                    {item.name}
                                                </span>
                                            </div>
                                            <span style={{ fontSize: '11px', fontWeight: '800', color: index === 0 ? '#2563eb' : index === 1 ? '#059669' : index === 2 ? '#d97706' : '#64748b', backgroundColor: index === 0 ? '#eff6ff' : index === 1 ? '#ecfdf5' : index === 2 ? '#fffbeb' : '#f1f5f9', padding: '4px 10px', borderRadius: '999px' }}>
                                                {item.count}x order
                                            </span>
                                        </div>
                                        <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                                            <div style={{ 
                                                width: `${widthPercentage}%`, 
                                                height: '100%', 
                                                background: progressGradient,
                                                borderRadius: '999px',
                                                transition: 'width 1s ease-in-out'
                                            }}></div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {popularServices.length > 0 && (
                        <div style={{ 
                            marginTop: '24px', 
                            padding: '16px', 
                            borderRadius: '16px', 
                            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div>
                                <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Total Volume Layanan</span>
                                <h4 style={{ fontSize: '18px', fontWeight: '800', margin: '2px 0 0 0' }}>{popularServices.reduce((sum, item) => sum + item.count, 0)} Order</h4>
                            </div>
                            <div style={{ 
                                width: '40px', 
                                height: '40px', 
                                borderRadius: '12px', 
                                backgroundColor: 'rgba(255,255,255,0.1)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                color: '#3b82f6'
                            }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* MODAL TAMBAH & EDIT LAYANAN */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.4)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }}>
                    <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '24px',
                        padding: '32px',
                        width: '100%',
                        maxWidth: '480px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                        border: '1px solid #e2e8f0',
                        position: 'relative',
                        animation: 'fadeIn 0.2s ease-out'
                    }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginBottom: '24px' }}>
                            {modalMode === 'edit' ? '✏️ Edit Layanan' : '✨ Tambah Layanan Baru'}
                        </h2>
                        <form onSubmit={handleFormSubmit}>
                            <div style={{ marginBottom: '18px' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Nama Layanan</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={formData.nama} 
                                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                    placeholder="Contoh: Cuci Kering Setrika"
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', boxSizing: 'border-box', transition: 'border 0.2s' }}
                                />
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px', marginBottom: '18px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Harga (Rp)</label>
                                    <input 
                                        type="number" 
                                        required 
                                        min="0"
                                        value={formData.harga} 
                                        onChange={(e) => setFormData({ ...formData, harga: parseInt(e.target.value) || 0 })}
                                        placeholder="Contoh: 10000"
                                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Satuan</label>
                                    <select 
                                        value={formData.satuan} 
                                        onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', backgroundColor: '#fff', boxSizing: 'border-box' }}
                                    >
                                        <option value="kg">kg</option>
                                        <option value="item">item</option>
                                        <option value="pasang">pasang</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '28px' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Kategori</label>
                                <select 
                                    value={formData.kategori} 
                                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', backgroundColor: '#fff', boxSizing: 'border-box' }}
                                >
                                    <option value="normal">Normal</option>
                                    <option value="express">Express</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)}
                                    style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: 'transparent', color: '#64748b', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit"
                                    style={{ 
                                        padding: '12px 24px', 
                                        borderRadius: '12px', 
                                        border: 'none', 
                                        backgroundColor: formData.kategori === 'express' ? '#ff7a00' : '#2563eb', 
                                        color: '#fff', 
                                        fontWeight: '700', 
                                        cursor: 'pointer', 
                                        fontSize: '14px',
                                        boxShadow: formData.kategori === 'express' ? '0 4px 12px rgba(255,122,0,0.25)' : '0 4px 12px rgba(37,99,235,0.25)',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Simpan Layanan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL KONFIRMASI HAPUS */}
            {showDeleteConfirm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.4)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }}>
                    <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '24px',
                        padding: '32px',
                        width: '100%',
                        maxWidth: '400px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                        border: '1px solid #e2e8f0',
                        textAlign: 'center',
                        animation: 'fadeIn 0.2s ease-out'
                    }}>
                        <div style={{ 
                            width: '56px', 
                            height: '56px', 
                            borderRadius: '50%', 
                            backgroundColor: '#fee2e2', 
                            color: '#ef4444', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            margin: '0 auto 20px auto'
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>Hapus Layanan?</h3>
                        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }}>
                            Apakah Anda yakin ingin menghapus layanan <strong>{serviceToDelete?.nama}</strong>? Tindakan ini akan menghapusnya secara permanen dari daftar kasir.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button 
                                onClick={() => setShowDeleteConfirm(false)}
                                style={{ flex: 1, padding: '12px 0', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: 'transparent', color: '#64748b', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
                            >
                                Batal
                            </button>
                            <button 
                                onClick={handleDeleteConfirm}
                                style={{ flex: 1, padding: '12px 0', borderRadius: '12px', border: 'none', backgroundColor: '#ef4444', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 12px rgba(239,68,68,0.2)' }}
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showUndoToast && (
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    backgroundColor: '#1e293b',
                    color: '#ffffff',
                    padding: '12px 20px',
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    zIndex: 10000,
                    animation: 'slideUp 0.3s ease-out',
                    border: '1px solid #334155'
                }}>
                    <span style={{ fontSize: '13.5px', fontWeight: '500' }}>{toastMessage}</span>
                    {previousServices && (
                        <button 
                            onClick={handleUndoReorder}
                            style={{
                                backgroundColor: '#3b82f6',
                                color: '#ffffff',
                                border: 'none',
                                padding: '6px 14px',
                                borderRadius: '10px',
                                fontSize: '12.5px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                        >
                            Undo
                        </button>
                    )}
                </div>
            )}

            {/* KEYFRAME ANIMATIONS STYLE */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes slideUp {
                    from { transform: translateY(100px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default ProductManagementPage;