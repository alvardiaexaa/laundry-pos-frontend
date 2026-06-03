import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { postTransaction } from '../../service/transactionService';
import ServiceCard from './ServiceCard';
import OrderSummary from './OrderSummary';

const TransactionPage = () => {
    const navigate = useNavigate();
    const [customer, setCustomer] = useState({ nama: '', nomor: '', alamat: '', catatan: '', metode_pembayaran: 'cash' });
    const [category, setCategory] = useState('normal'); // Default awal tab normal sesuai gambar user
    const [cart, setCart] = useState([]);
    const [paying, setPaying] = useState(false);
    const [services, setServices] = useState([]);

    // Data cadangan lokal disamakan strukturnya dengan database backend (menggunakan id, nama, harga, satuan, kategori)
    const servicesData = {
        normal: [
            { id: 1, nama: 'Cuci & Lipat', harga: 10000, satuan: 'kg', kategori: 'normal' },
            { id: 3, nama: 'Cuci Kering Setrika', harga: 12000, satuan: 'kg', kategori: 'normal' },
            { id: 4, nama: 'Pembersih Pakaian', harga: 15000, satuan: 'item', kategori: 'normal' },
            { id: 5, nama: 'Cuci Selimut', harga: 20000, satuan: 'item', kategori: 'normal' },
            { id: 6, nama: 'Cuci Gorden', harga: 15000, satuan: 'kg', kategori: 'normal' },
            { id: 7, nama: 'Cuci Seprai', harga: 15000, satuan: 'item', kategori: 'normal' },
        ],
        express: [
            { id: 6, nama: 'Cuci Gorden', harga: 22000, satuan: 'kg', kategori: 'express' },
            { id: 7, nama: 'Cuci Seprai', harga: 22000, satuan: 'item', kategori: 'express' },
            { id: 8, nama: 'Permak Pakaian', harga: 25000, satuan: 'item', kategori: 'express' },
            { id: 9, nama: 'Cuci Bed Cover', harga: 37000, satuan: 'item', kategori: 'express' },
            { id: 10, nama: 'Cuci Sepatu', harga: 45000, satuan: 'pasang', kategori: 'express' },
            { id: 2, nama: 'Setrika Saja', harga: 7000, satuan: 'kg', kategori: 'express' },
        ]
    };

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
                const res = await axios.get(`${apiURL}/services`);
                if (res.data.status === 'success' && res.data.data.length > 0) {
                    setServices(res.data.data);
                }
            } catch (err) {
                console.error("Gagal mengambil data layanan dari backend, menggunakan fallback lokal", err);
            }
        };
        fetchServices();

        // Sinkronisasi otomatis saat kasir memfokuskan kembali tab halaman ini
        window.addEventListener('focus', fetchServices);
        return () => {
            window.removeEventListener('focus', fetchServices);
        };
    }, [category]);

    // --- LOGIKA UTAMA SINKRONISASI URUTAN ---
    const getOrderedServices = () => {
        // Gunakan data API yang sudah disortir berdasarkan urutan dari backend
        if (services.length > 0) {
            return services.filter(s => s.kategori.toLowerCase() === category.toLowerCase());
        }
        return servicesData[category] || [];
    };

    const activeServices = getOrderedServices();

    const handleAddService = (serviceId) => {
        const service = activeServices.find(s => s.id === serviceId);
        if (!service) return;

        setCart(prevCart => {
            const existing = prevCart.find(item => item.id === serviceId);
            if (existing) {
                return prevCart.map(item =>
                    item.id === serviceId ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            // Petakan ke penamaan cart yang dibaca oleh komponen OrderSummary Anda
            return [
                ...prevCart,
                { id: service.id, name: service.nama, price: service.harga, unit: service.satuan, quantity: 1 }
            ];
        });
    };

    const handleIncreaseQty = (itemId) => {
        setCart(prevCart => prevCart.map(item => item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item));
    };

    const handleDecreaseQty = (itemId) => {
        setCart(prevCart => prevCart.map(item => item.id === itemId ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item));
    };

    const handleRemoveItem = (itemId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== itemId));
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = Math.round(subtotal * 0.11);
    const total = subtotal + tax;

    const handleBayar = async () => {
        if (cart.length === 0) return;
        setPaying(true);
        try {
            const payload = {
                nama: customer.nama, nomor: customer.nomor, alamat: customer.alamat,
                total: total, cart: cart, catatan: customer.catatan, metode_pembayaran: customer.metode_pembayaran,
                kasir: localStorage.getItem('cashier_name') || 'Admin'
            };
            const res = await postTransaction(payload);
            if (res.status === 'success') {
                const receiptDetails = {
                    invoice: res.data.invoice || '1007', nama_pelanggan: customer.nama, nomor_hp: customer.nomor,
                    alamat: customer.alamat, catatan: customer.catatan, metode_pembayaran: customer.metode_pembayaran,
                    kasir: localStorage.getItem('cashier_name') || 'Admin', subtotal: subtotal, tax: tax, total: total, cart: cart,
                    created_at: new Date().toISOString()
                };
                localStorage.setItem('last_receipt', JSON.stringify(receiptDetails));
                navigate('/success');
            }
        } catch (err) {
            console.error("Gagal melakukan transaksi", err);
            alert("Gagal memproses pembayaran. Coba lagi.");
        } finally {
            setPaying(false);
        }
    };

    return (
        <div>
            <div className="dashboard-header" style={{ marginBottom: '20px' }}>
                <div className="header-title">
                    <h1>Transaksi baru</h1>
                    <p>Pilih layanan dan proses pembayaran pelanggan.</p>
                </div>
                <button onClick={() => navigate('/')} style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px' }}>
                    X
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '24px', alignItems: 'stretch', zoom: 0.85 }}>
                <div style={{ background: '#ffffff', borderRadius: '14px', padding: '24px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexShrink: 0 }}>
                        <span style={{ fontWeight: '600', fontSize: '15px' }}>pilih layanan</span>
                        <div style={{ display: 'flex', gap: '4px', backgroundColor: '#fff', padding: '4px', borderRadius: '9999px', border: '1px solid #e2e8f0', marginBottom: 0 }}>
                            <button 
                                onClick={() => setCategory('express')} 
                                style={{ padding: '6px 20px', borderRadius: '9999px', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer', backgroundColor: category === 'express' ? '#fff0e0' : 'transparent', color: category === 'express' ? '#ff7a00' : '#64748b', transition: 'all 0.2s' }}
                            >
                                Express
                            </button>
                            <button 
                                onClick={() => setCategory('normal')} 
                                style={{ padding: '6px 20px', borderRadius: '9999px', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer', backgroundColor: category === 'normal' ? '#e0f2fe' : 'transparent', color: category === 'normal' ? '#0369a1' : '#64748b', transition: 'all 0.2s' }}
                            >
                                Normal
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', flexGrow: 1, paddingRight: '4px' }}>
                        {activeServices.map(service => (
                            <ServiceCard
                                key={service.id}
                                id={service.id}
                                name={service.nama} 
                                price={service.harga} 
                                unit={service.satuan}
                                category={service.kategori}
                                onAdd={handleAddService}
                            />
                        ))}
                    </div>
                </div>

                <OrderSummary customer={customer} setCustomer={setCustomer} cart={cart} onIncrease={handleIncreaseQty} onDecrease={handleDecreaseQty} onRemove={handleRemoveItem} onPay={handleBayar} subtotal={subtotal} tax={tax} total={total} paying={paying} />
            </div>
        </div>
    );
};

export default TransactionPage;