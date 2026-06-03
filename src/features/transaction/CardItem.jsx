import React from 'react';

const CardItem = ({ item, onIncrease, onDecrease, onRemove }) => {
    const formatRupiah = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(num).replace('Rp', 'Rp ');
    };

    const itemTotalPrice = item.price * item.quantity;

    return (
        <div className="cart-item" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 0',
            borderBottom: '1px solid #e5e7eb'
        }}>
            <div className="cart-item-info" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="cart-item-name" style={{ fontWeight: '600', fontSize: '14px', color: '#000' }}>
                    {item.name}
                </span>
                <span className="cart-item-price" style={{ fontSize: '13px', color: '#000', fontWeight: '500' }}>
                    {formatRupiah(itemTotalPrice)}
                </span>
            </div>
            
            <div className="cart-item-controls" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button className="cart-qty-btn" onClick={onDecrease} style={{ border: 'none', background: 'none', fontSize: '18px', fontWeight: '600' }}>
                    &minus;
                </button>
                <span className="cart-qty" style={{ fontSize: '14px', fontWeight: '500', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                <button className="cart-qty-btn" onClick={onIncrease} style={{ border: 'none', background: 'none', fontSize: '18px', fontWeight: '600' }}>
                    +
                </button>
                <button 
                    onClick={onRemove}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#4b5563',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        marginLeft: '8px'
                    }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default CardItem;
