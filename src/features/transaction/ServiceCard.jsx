import React from 'react';

const ServiceCard = ({ id, name, price, unit, category = 'normal', onAdd }) => {
    const formatRupiah = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(num).replace('Rp', 'Rp ');
    };

    const renderIcon = () => {
        if (name.toLowerCase().includes('setrika') && !name.toLowerCase().includes('cuci')) {
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 8h11a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z" />
                    <path d="M5 8V5a2 2 0 0 1 2-2h3" />
                </svg>
            );
        }
        if (name.toLowerCase().includes('pembersih') || name.toLowerCase().includes('pakaian')) {
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.38 3.46L16 7.83l-1.42-1.42 4.38-4.38a1 1 0 0 1 1.42 0l1 1a1 1 0 0 1 0 1.43zM10.5 22h7a2.5 2.5 0 0 0 2.5-2.5V14h-10v5.5a2.5 2.5 0 0 0 2.5 2.5zM4 14h6.5v8H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z" />
                </svg>
            );
        }
        return (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="4" />
                <path d="M12 20a8 8 0 0 0 8-8" />
            </svg>
        );
    };

    return (
        <div 
            className="service-card" 
            style={{ 
                backgroundColor: '#ffffff', 
                borderRadius: '24px', 
                padding: '24px', 
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', 
                border: '1px solid #e2e8f0', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                position: 'relative', 
                textAlign: 'center'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '14px', position: 'relative' }}>
                <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '12px', 
                    backgroundColor: category.toLowerCase() === 'express' ? '#fff0e0' : '#eff6ff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: category.toLowerCase() === 'express' ? '#ff7a00' : '#2563eb' 
                }}>
                    {renderIcon()}
                </div>
            </div>

            <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', color: category.toLowerCase() === 'express' ? '#ff7a00' : '#2563eb', marginBottom: '6px' }}>
                {category}
            </span>

            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 20px 0' }}>{name}</h3>
            <div style={{ width: '100%', height: '1px', backgroundColor: '#f1f5f9', marginBottom: '16px' }}></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div style={{ textAlign: 'left' }}>
                    <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontWeight: '600', marginBottom: '2px' }}>Harga</span>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
                        {formatRupiah(price)}
                        <span style={{ fontSize: '12px', fontWeight: '500', color: '#64748b' }}>/{unit}</span>
                    </span>
                </div>
                {onAdd && (
                    <button 
                        onClick={() => onAdd(id)}
                        style={{ 
                            backgroundColor: category.toLowerCase() === 'express' ? '#ff7a00' : '#2563eb', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: '50%', 
                            width: '32px', 
                            height: '32px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: '18px', 
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    >
                        +
                    </button>
                )}
            </div>
        </div>
    );
};

export default ServiceCard;