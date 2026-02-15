'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, Coffee } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import Link from 'next/link'

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
    const { items, removeItem, updateQuantity, totalPrice, totalItems, clearCart } = useCart()

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100 }}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{
                            position: 'fixed', top: 0, right: 0, height: '100%',
                            width: '100%', maxWidth: '400px',
                            background: '#131f1c', borderLeft: '1px solid rgba(255,255,255,0.1)',
                            zIndex: 101, display: 'flex', flexDirection: 'column',
                            boxShadow: '-20px 0 60px rgba(0,0,0,0.4)',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: typeof window !== 'undefined' && window.innerWidth < 480 ? '16px 20px' : '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: 'var(--color-primary)', padding: '8px', borderRadius: '10px' }}>
                                    <ShoppingBag style={{ color: '#fff' }} size={18} />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '1.1rem', fontWeight: 900, fontStyle: 'italic' }}>Mi Carrito</h2>
                                    <p style={{ fontSize: '10px', color: '#6b7280', fontWeight: 700 }}>
                                        {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                {items.length > 2 && (
                                    <button
                                        onClick={clearCart}
                                        aria-label="Vaciar carrito de compras"
                                        style={{
                                            fontSize: '9px', fontWeight: 800, color: '#ef4444',
                                            textTransform: 'uppercase', letterSpacing: '0.1em',
                                            background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)',
                                            padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'
                                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.1)'
                                        }}
                                    >
                                        Vaciar Canasta
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    aria-label="Cerrar carrito"
                                    style={{
                                        width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none',
                                        color: '#9ca3af', cursor: 'pointer',
                                    }}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Items List */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
                            {items.length === 0 ? (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', opacity: 0.3 }}>
                                    <ShoppingBag size={60} strokeWidth={1} style={{ color: 'var(--color-primary)', marginBottom: '16px' }} />
                                    <p style={{ fontSize: '1.25rem', fontWeight: 900, fontStyle: 'italic', marginBottom: '8px' }}>Vacío</p>
                                    <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.15em' }}>Explora nuestra colección</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {items.map((item) => (
                                        <div key={item.id} style={{
                                            display: 'flex', gap: '14px',
                                            padding: '16px', borderRadius: '16px',
                                            background: 'rgba(26,44,40,0.5)', border: '1px solid rgba(255,255,255,0.05)',
                                        }}>
                                            {/* Product Icon */}
                                            <div style={{
                                                width: '64px', height: '64px', borderRadius: '12px',
                                                background: 'rgba(0,0,0,0.2)', flexShrink: 0,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)',
                                            }}>
                                                {item.image_url ? (
                                                    <img
                                                        src={item.image_url}
                                                        alt={item.name}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <Coffee style={{ color: 'rgba(42,157,124,0.3)' }} size={28} />
                                                )}
                                            </div>

                                            {/* Product Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                    <div style={{ minWidth: 0 }}>
                                                        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {item.name}
                                                        </h4>
                                                        <p style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#6b7280' }}>
                                                            {item.origin.municipality} • {item.variety}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        aria-label={`Eliminar ${item.name} del carrito`}
                                                        style={{
                                                            width: '28px', height: '28px', borderRadius: '8px',
                                                            border: '1px solid rgba(255,255,255,0.05)', background: 'none',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            color: '#6b7280', cursor: 'pointer', flexShrink: 0,
                                                        }}
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>

                                                {/* Quantity & Price Row */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{
                                                        display: 'flex', alignItems: 'center',
                                                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                                                        borderRadius: '10px', overflow: 'hidden',
                                                    }}>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                            aria-label="Disminuir cantidad"
                                                            style={{
                                                                width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer',
                                                            }}
                                                        >
                                                            <Minus size={12} />
                                                        </button>
                                                        <span style={{ width: '28px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 900 }}>
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            aria-label="Aumentar cantidad"
                                                            style={{
                                                                width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer',
                                                            }}
                                                        >
                                                            <Plus size={12} />
                                                        </button>
                                                    </div>
                                                    <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '1rem' }}>
                                                        ${(item.price * item.quantity).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer / Checkout */}
                        <div style={{ padding: typeof window !== 'undefined' && window.innerWidth < 480 ? '16px 20px' : '20px 24px', borderTop: '1px solid rgba(255,255,255,0.1)', background: '#131f1c' }}>
                            {/* Subtotal */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div>
                                    <p style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.2em', color: '#6b7280', marginBottom: '2px' }}>
                                        Subtotal
                                    </p>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
                                        ${totalPrice.toLocaleString()}
                                        <span style={{ fontSize: '0.7rem', fontWeight: 700, marginLeft: '6px', opacity: 0.3, textTransform: 'uppercase' as const }}>COP</span>
                                    </p>
                                </div>
                                {items.length > 0 && (
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '9px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
                                            Envío
                                        </p>
                                        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)' }}>Gratis</p>
                                    </div>
                                )}
                            </div>

                            {/* Checkout Button */}
                            <Link
                                href="/checkout"
                                onClick={onClose}
                                aria-label="Proceder al pago seguro"
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                                    width: '100%', padding: '16px', borderRadius: '14px',
                                    background: items.length === 0 ? '#333' : 'var(--color-primary)',
                                    color: '#fff', fontWeight: 900, fontSize: '0.75rem',
                                    textTransform: 'uppercase' as const, letterSpacing: '0.2em',
                                    textDecoration: 'none', border: 'none', cursor: items.length === 0 ? 'not-allowed' : 'pointer',
                                    opacity: items.length === 0 ? 0.3 : 1,
                                    boxShadow: items.length > 0 ? '0 10px 30px rgba(34, 197, 94, 0.2)' : 'none',
                                }}
                            >
                                Finalizar Pedido
                                <ArrowRight size={16} />
                            </Link>

                            <p style={{ fontSize: '8px', fontWeight: 700, textAlign: 'center', color: '#6b7280', marginTop: '12px', textTransform: 'uppercase' as const, letterSpacing: '0.3em', opacity: 0.4 }}>
                                Pago 100% Seguro • Wompi • SSL
                            </p>
                        </div>
                    </motion.div>
                </>
            )
            }
        </AnimatePresence >
    )
}
