import React from 'react';
import CardItem from './CardItem';

const OrderSummary = ({ 
    customer, 
    setCustomer, 
    cart, 
    onIncrease, 
    onDecrease, 
    onRemove, 
    onPay, 
    subtotal, 
    tax, 
    total,
    paying
}) => {

    const formatRupiah = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(num).replace('Rp', 'Rp ');
    };

    const isCartEmpty = cart.length === 0;
    const isFormIncomplete = !customer.nama.trim() || !customer.nomor.trim() || !customer.alamat.trim();

    return (
        <div className="transaction-right-panel">
            <div className="client-info-card">
                <h3 className="client-info-title">Info pelanggan</h3>
                
                <div className="form-group">
                    <input 
                        type="text" 
                        placeholder="Nama" 
                        value={customer.nama} 
                        onChange={(e) => setCustomer({ ...customer, nama: e.target.value })}
                        className="form-input"
                    />
                </div>

                <div className="form-group">
                    <input 
                        type="text" 
                        placeholder="Nomor HP" 
                        value={customer.nomor} 
                        onChange={(e) => setCustomer({ ...customer, nomor: e.target.value })}
                        className="form-input"
                    />
                </div>

                <div className="form-group">
                    <textarea 
                        placeholder="Alamat" 
                        value={customer.alamat} 
                        onChange={(e) => setCustomer({ ...customer, alamat: e.target.value })}
                        className="form-input"
                        rows="2"
                        style={{ resize: 'none', fontFamily: 'inherit' }}
                    />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                    <textarea 
                        placeholder="Catatan Laundry (Contoh: jangan dicampur, setrika licin)" 
                        value={customer.catatan || ''} 
                        onChange={(e) => setCustomer({ ...customer, catatan: e.target.value })}
                        className="form-input"
                        rows="2"
                        style={{ resize: 'none', fontFamily: 'inherit' }}
                    />
                </div>

            </div>

            <div className="cart-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                        <h3 className="cart-title" style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>keranjang</h3>
                    </div>
                    <span style={{ fontSize: '14px', color: '#000', fontWeight: '500' }}>
                        {cart.reduce((sum, item) => sum + item.quantity, 0)} item
                    </span>
                </div>

                <div className="cart-items-list">
                    {isCartEmpty ? (
                        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '24px 0', fontSize: '14px' }}>
                            Keranjang kosong
                        </div>
                    ) : (
                        cart.map(item => (
                            <CardItem 
                                key={item.id} 
                                item={item} 
                                onIncrease={() => onIncrease(item.id)}
                                onDecrease={() => onDecrease(item.id)}
                                onRemove={() => onRemove(item.id)}
                            />
                        ))
                    )}
                </div>

                <div style={{ borderTop: '1px solid #d1d5db', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#000' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                        <span>Subtotal</span>
                        <span>{formatRupiah(subtotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                        <span>Pajak (11%)</span>
                        <span>{formatRupiah(tax)}</span>
                    </div>
                    <div className="cart-total-section" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', borderTop: '1px dashed #d1d5db', paddingTop: '12px', marginTop: '4px', marginBottom: '8px' }}>
                        <span>TOTAL</span>
                        <span className="price-text" style={{ fontSize: '15px' }}>{formatRupiah(total)}</span>
                    </div>

                    {/* Metode Pembayaran */}
                    <div style={{ marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '8px' }}>Metode Pembayaran</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {['cash', 'tf', 'qris'].map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setCustomer({ ...customer, metode_pembayaran: m })}
                                    style={{
                                        flex: 1,
                                        padding: '10px 6px',
                                        borderRadius: '12px',
                                        border: customer.metode_pembayaran === m ? '2px solid #10b981' : '1px solid #d1d5db',
                                        backgroundColor: customer.metode_pembayaran === m ? '#ecfdf5' : '#ffffff',
                                        color: customer.metode_pembayaran === m ? '#065f46' : '#374151',
                                        fontWeight: '700',
                                        fontSize: '12px',
                                        textTransform: 'uppercase',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        className="pay-btn" 
                        onClick={onPay}
                        disabled={isCartEmpty || isFormIncomplete || paying}
                        style={{ 
                            width: '100%', 
                            display: 'block',
                            backgroundColor: '#a7f3d0', 
                            color: '#000', 
                            borderRadius: '24px',
                            padding: '14px',
                            fontWeight: '600',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        {paying ? 'Memproses...' : 'Selesaikan Pembayaran'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderSummary;
