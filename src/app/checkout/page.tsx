'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/Navbar'
import {
    ArrowLeft, ShoppingBag, MapPin, Truck, CreditCard, CheckCircle,
    Package, Shield, Clock, Minus, Plus, Trash2, Coffee, ChevronRight
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function CheckoutPage() {
    const { items, totalPrice, clearCart, updateQuantity, removeItem, syncPrices } = useCart()
    const { user } = useAuth()
    const router = useRouter()
    const [step, setStep] = useState(1) // 1: Review, 2: Shipping, 3: Payment, 4: Success
    const [isProcessing, setIsProcessing] = useState(false)

    // Shipping form
    const [shipping, setShipping] = useState({
        name: user?.full_name || '',
        email: user?.email || '',
        phone: '',
        address: '',
        city: '',
        department: 'Antioquia',
        notes: '',
    })

    const shippingCost = totalPrice >= 100000 ? 0 : 8000
    const finalTotal = totalPrice + shippingCost

    const handlePayment = async () => {
        setIsProcessing(true)

        try {
            // ─── 0. Validate Prices (Realtime Check) ───
            const planItems = items.filter(i => i.id.includes('0000-0000') || i.id.startsWith('plan-'))
            // Note: For now we only strictly validate Plans as requested, but structure supports products too if needed.

            if (planItems.length > 0) {
                const planIds = planItems.map(i => i.id)
                const { data: dbPlans, error: plansError } = await supabase
                    .from('subscription_plans')
                    .select('id, price_monthly, name')
                    .in('id', planIds)

                if (plansError) throw plansError

                const updates: { id: string, price: number }[] = []
                let priceChanged = false

                planItems.forEach(item => {
                    const dbPlan = dbPlans?.find(p => p.id === item.id)
                    if (dbPlan && dbPlan.price_monthly !== item.price) {
                        updates.push({ id: item.id, price: dbPlan.price_monthly })
                        priceChanged = true
                    }
                })

                if (priceChanged) {
                    syncPrices(updates)
                    toast.warning('Los precios de algunos planes han cambiado. El carrito se ha actualizado.', {
                        duration: 5000,
                    })
                    setIsProcessing(false)
                    return // Stop payment processing to let user review new total
                }
            }

            // Separate subscription items from regular product items
            const isSubscriptionItem = (item: any) =>
                item.id.includes('0000-0000') || item.id.startsWith('plan-')

            const subscriptionItems = items.filter(isSubscriptionItem)
            const productItems = items.filter(item => !isSubscriptionItem(item))

            // ─── 1. Handle regular product orders ───
            if (productItems.length > 0) {
                const productTotal = productItems.reduce((sum, item) => sum + item.price * item.quantity, 0) + shippingCost

                const { data: order, error: orderError } = await supabase
                    .from('orders')
                    .insert([{
                        user_id: user?.id || null,
                        customer_email: user?.email || shipping.email,
                        total_amount: productTotal,
                        shipping_address: shipping,
                        payment_status: 'APPROVED',
                        order_status: 'RECIBIDO'
                    }])
                    .select()
                    .single()

                if (orderError) throw orderError

                const orderItemsData = productItems.map(item => ({
                    order_id: order.id,
                    product_id: item.id,
                    quantity: item.quantity,
                    unit_price: item.price,
                    product_name: item.name
                }))

                const { error: itemsError } = await supabase
                    .from('order_items')
                    .insert(orderItemsData)

                if (itemsError) throw itemsError

                // ─── 1.1 Update Stock for bought products ───
                for (const item of productItems) {
                    const { data: currentProduct } = await supabase
                        .from('products')
                        .select('stock, status')
                        .eq('id', item.id)
                        .single()

                    if (currentProduct) {
                        const newStock = Math.max(0, currentProduct.stock - item.quantity)
                        let newStatus = currentProduct.status

                        // If stock hits 0, it becomes Agotado (unless it was already Pausado)
                        if (newStock <= 0 && newStatus !== 'Pausado') {
                            newStatus = 'Agotado'
                        }

                        await supabase
                            .from('products')
                            .update({
                                stock: newStock,
                                status: newStatus,
                                is_published: newStatus !== 'Pausado'
                            })
                            .eq('id', item.id)
                    }
                }
            }

            // ─── 2. Handle subscription activations (one per user) ───
            if (subscriptionItems.length > 0 && user) {
                const planItem = subscriptionItems[subscriptionItems.length - 1]

                // Check for existing active subscription
                const { data: existingSub } = await supabase
                    .from('subscriptions')
                    .select('id, plan_id')
                    .eq('user_id', user.id)
                    .eq('status', 'ACTIVE')
                    .maybeSingle()

                if (existingSub && existingSub.plan_id === planItem.id) {
                    // Already on this exact plan — skip, do nothing
                    console.log('User already has this plan active, skipping.')
                } else {
                    // Cancel existing active subscription if any
                    if (existingSub) {
                        await supabase
                            .from('subscriptions')
                            .update({ status: 'CANCELLED' })
                            .eq('id', existingSub.id)
                    }

                    // Activate the new subscription
                    const today = new Date()
                    const nextMonth = new Date()
                    nextMonth.setMonth(nextMonth.getMonth() + 1)

                    const { error: subError } = await supabase
                        .from('subscriptions')
                        .insert([{
                            user_id: user.id,
                            plan_id: planItem.id,
                            status: 'ACTIVE',
                            start_date: today.toISOString().split('T')[0],
                            next_billing_date: nextMonth.toISOString().split('T')[0]
                        }])

                    if (subError) {
                        console.error('Subscription insert error:', subError)
                        throw subError
                    }
                }
            }

            // 3. Success!
            clearCart()
            setStep(4)
        } catch (error: any) {
            console.error('Checkout error:', error)
            alert('Error al procesar el pedido: ' + error.message)
        } finally {
            setIsProcessing(false)
        }
    }

    const canProceedToShipping = items.length > 0
    const canProceedToPayment = shipping.name && shipping.phone && shipping.address && shipping.city && (user || shipping.email)

    // Step labels
    const steps = [
        { num: 1, label: 'Carrito', icon: <ShoppingBag size={14} /> },
        { num: 2, label: 'Envío', icon: <Truck size={14} /> },
        { num: 3, label: 'Pago', icon: <CreditCard size={14} /> },
    ]

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '14px 16px', borderRadius: '12px',
        background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)',
        color: '#fff', fontSize: '0.85rem', outline: 'none',
        transition: 'border-color 0.2s',
    }
    const labelStyle: React.CSSProperties = {
        display: 'block', fontSize: '10px', fontWeight: 700,
        textTransform: 'uppercase' as const, letterSpacing: '0.12em',
        color: '#6b7280', marginBottom: '6px',
    }

    // ─── SUCCESS PAGE ───
    if (step === 4) {
        return (
            <div style={{ minHeight: '100vh', background: '#131f1c', color: '#fff' }}>
                <Navbar />
                <div style={{ height: '100px' }} />
                <div style={{ maxWidth: '480px', margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: 'rgba(42,157,124,0.15)', border: '2px solid var(--color-brand-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 24px',
                        }}
                    >
                        <CheckCircle size={40} style={{ color: 'var(--color-brand-primary)' }} />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{ fontSize: '2rem', fontWeight: 900, fontStyle: 'italic', marginBottom: '12px' }}
                    >
                        ¡Pedido Exitoso!
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        style={{ color: '#6b7280', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '8px' }}
                    >
                        Gracias por apoyar al café del suroeste antioqueño.
                    </motion.p>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        style={{ color: '#4b5563', fontSize: '0.75rem', marginBottom: '40px' }}
                    >
                        Recibirás un correo de confirmación con los detalles de tu compra.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                    >
                        <Link href="/catalog" style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            padding: '16px', borderRadius: '14px',
                            background: 'var(--color-brand-primary)', color: '#fff', border: 'none',
                            fontWeight: 800, fontSize: '0.8rem', textDecoration: 'none',
                            letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                            boxShadow: '0 8px 25px rgba(42,157,124,0.3)',
                        }}>
                            <Coffee size={16} /> Seguir Comprando
                        </Link>
                        <Link href="/profile" style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            padding: '16px', borderRadius: '14px',
                            background: 'transparent', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)',
                            fontWeight: 700, fontSize: '0.75rem', textDecoration: 'none',
                            letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                        }}>
                            <Package size={14} /> Ver Mis Pedidos
                        </Link>
                    </motion.div>
                </div>
            </div>
        )
    }

    // ─── MAIN CHECKOUT ───
    return (
        <div style={{ minHeight: '100vh', background: '#131f1c', color: '#fff' }}>
            <Navbar />
            <div style={{ height: '100px' }} />

            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px 24px 80px' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                    <button
                        onClick={() => step > 1 ? setStep(step - 1) : router.back()}
                        style={{
                            width: '40px', height: '40px', borderRadius: '12px',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                            color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                        }}
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <span style={{ display: 'block', color: 'var(--color-brand-primary)', fontWeight: 800, fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase' as const, marginBottom: '4px' }}>
                            Checkout
                        </span>
                        <h1 style={{ fontSize: '1.3rem', fontWeight: 900, fontStyle: 'italic' }}>
                            {step === 1 ? 'Tu Carrito' : step === 2 ? 'Datos de Envío' : 'Confirmar y Pagar'}
                        </h1>
                    </div>
                </div>

                {/* Stepper */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0',
                    marginBottom: '32px', padding: '16px 20px',
                    background: '#1a2c28', borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.05)',
                }}>
                    {steps.map((s, i) => (
                        <div key={s.num} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
                            <div
                                onClick={() => s.num < step && setStep(s.num)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    cursor: s.num < step ? 'pointer' : 'default',
                                }}
                            >
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '10px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: step >= s.num ? 'rgba(42,157,124,0.15)' : 'rgba(255,255,255,0.03)',
                                    color: step >= s.num ? 'var(--color-brand-primary)' : '#4b5563',
                                    border: step >= s.num ? '1px solid rgba(42,157,124,0.3)' : '1px solid rgba(255,255,255,0.05)',
                                    transition: 'all 0.3s',
                                }}>
                                    {step > s.num ? <CheckCircle size={14} /> : s.icon}
                                </div>
                                <span style={{
                                    fontSize: '11px', fontWeight: 700,
                                    color: step >= s.num ? '#d1d5db' : '#4b5563',
                                    letterSpacing: '0.05em', textTransform: 'uppercase' as const,
                                }}>
                                    {s.label}
                                </span>
                            </div>
                            {i < steps.length - 1 && (
                                <div style={{
                                    flex: 1, height: '2px', margin: '0 16px',
                                    background: step > s.num ? 'var(--color-brand-primary)' : 'rgba(255,255,255,0.05)',
                                    borderRadius: '1px', transition: 'background 0.3s',
                                }} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>

                    {/* ─── STEP 1: CART REVIEW ─── */}
                    {step === 1 && (
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                            {items.length === 0 ? (
                                <div style={{
                                    textAlign: 'center', padding: '60px 24px',
                                    background: '#1a2c28', borderRadius: '16px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                }}>
                                    <ShoppingBag size={48} style={{ color: 'var(--color-brand-primary)', opacity: 0.3, margin: '0 auto 16px' }} />
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px' }}>Tu carrito está vacío</h3>
                                    <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '24px' }}>
                                        Explora nuestro catálogo y agrega productos de café premium.
                                    </p>
                                    <Link href="/catalog" style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                                        padding: '12px 24px', borderRadius: '12px',
                                        background: 'var(--color-brand-primary)', color: '#fff', textDecoration: 'none',
                                        fontWeight: 700, fontSize: '0.8rem',
                                    }}>
                                        <Coffee size={16} /> Ir al Catálogo
                                    </Link>
                                </div>
                            ) : (
                                <div style={{
                                    background: '#1a2c28', borderRadius: '16px',
                                    border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden',
                                }}>
                                    {/* Items */}
                                    {items.map((item, idx) => (
                                        <div key={item.id} style={{
                                            display: 'flex', alignItems: 'center', gap: '16px',
                                            padding: '20px',
                                            borderBottom: idx < items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                        }}>
                                            {/* Product image placeholder */}
                                            <div style={{
                                                width: '64px', height: '64px', borderRadius: '12px',
                                                background: 'rgba(42,157,124,0.1)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)',
                                            }}>
                                                {item.image_url ? (
                                                    <img
                                                        src={item.image_url}
                                                        alt={item.name}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <Coffee size={24} style={{ color: 'var(--color-brand-primary)', opacity: 0.6 }} />
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>{item.name}</h4>
                                                <p style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                                    {item.origin.municipality} • {item.variety}
                                                </p>
                                                <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffc107', marginTop: '6px' }}>
                                                    ${item.price.toLocaleString()}
                                                </p>
                                            </div>

                                            {/* Quantity controls */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    style={{
                                                        width: '32px', height: '32px', borderRadius: '8px',
                                                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                                                        color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 800, minWidth: '24px', textAlign: 'center' }}>
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    style={{
                                                        width: '32px', height: '32px', borderRadius: '8px',
                                                        background: 'rgba(42,157,124,0.1)', border: '1px solid rgba(42,157,124,0.2)',
                                                        color: 'var(--color-brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>

                                            {/* Subtotal + Delete */}
                                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                <p style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '4px' }}>
                                                    ${(item.price * item.quantity).toLocaleString()}
                                                </p>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    style={{
                                                        background: 'none', border: 'none', color: '#ef4444',
                                                        cursor: 'pointer', padding: '4px', opacity: 0.6,
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Summary */}
                                    <div style={{ padding: '20px', background: 'rgba(0,0,0,0.15)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} productos)</span>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>${totalPrice.toLocaleString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Envío</span>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: shippingCost === 0 ? 'var(--color-brand-primary)' : '#d1d5db' }}>
                                                {shippingCost === 0 ? '¡Gratis!' : `$${shippingCost.toLocaleString()}`}
                                            </span>
                                        </div>
                                        {shippingCost === 0 && (
                                            <p style={{ fontSize: '0.65rem', color: 'var(--color-brand-primary)', textAlign: 'right', marginBottom: '12px' }}>
                                                Envío gratis por compras mayores a $100,000
                                            </p>
                                        )}
                                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>Total</span>
                                            <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ffc107' }}>${finalTotal.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Continue Button */}
                            {items.length > 0 && (
                                <button
                                    onClick={() => setStep(2)}
                                    style={{
                                        width: '100%', marginTop: '20px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        padding: '16px', borderRadius: '14px',
                                        background: 'var(--color-brand-primary)', color: '#fff', border: 'none',
                                        fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
                                        letterSpacing: '0.08em', textTransform: 'uppercase' as const,
                                        boxShadow: '0 8px 25px rgba(42,157,124,0.3)',
                                    }}
                                >
                                    Continuar al Envío <ChevronRight size={16} />
                                </button>
                            )}
                        </motion.div>
                    )}

                    {/* ─── STEP 2: SHIPPING ─── */}
                    {step === 2 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div style={{
                                background: '#1a2c28', borderRadius: '16px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                padding: '28px',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                                    <MapPin size={18} style={{ color: 'var(--color-brand-primary)' }} />
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Dirección de Entrega</h3>
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: typeof window !== 'undefined' && window.innerWidth < 640 ? '1fr' : '1fr 1fr',
                                    gap: '16px'
                                }}>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={labelStyle}>Nombre Completo</label>
                                        <input
                                            style={inputStyle}
                                            value={shipping.name}
                                            onChange={e => setShipping(p => ({ ...p, name: e.target.value }))}
                                            placeholder="Tu nombre completo"
                                        />
                                    </div>
                                    {!user && (
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label style={labelStyle}>Correo Electrónico</label>
                                            <input
                                                style={inputStyle}
                                                type="email"
                                                value={shipping.email}
                                                onChange={e => setShipping(p => ({ ...p, email: e.target.value }))}
                                                placeholder="tu@email.com"
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <label style={labelStyle}>Teléfono</label>
                                        <input
                                            style={inputStyle}
                                            value={shipping.phone}
                                            onChange={e => setShipping(p => ({ ...p, phone: e.target.value }))}
                                            placeholder="300 123 4567"
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Departamento</label>
                                        <select
                                            style={{ ...inputStyle, cursor: 'pointer' }}
                                            value={shipping.department}
                                            onChange={e => setShipping(p => ({ ...p, department: e.target.value }))}
                                        >
                                            <option value="Antioquia">Antioquia</option>
                                            <option value="Cundinamarca">Cundinamarca</option>
                                            <option value="Valle del Cauca">Valle del Cauca</option>
                                            <option value="Santander">Santander</option>
                                            <option value="Risaralda">Risaralda</option>
                                            <option value="Caldas">Caldas</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Ciudad</label>
                                        <input
                                            style={inputStyle}
                                            value={shipping.city}
                                            onChange={e => setShipping(p => ({ ...p, city: e.target.value }))}
                                            placeholder="Medellín"
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Dirección</label>
                                        <input
                                            style={inputStyle}
                                            value={shipping.address}
                                            onChange={e => setShipping(p => ({ ...p, address: e.target.value }))}
                                            placeholder="Calle 10 #5-23, Apt 402"
                                        />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={labelStyle}>Notas de Entrega (Opcional)</label>
                                        <input
                                            style={inputStyle}
                                            value={shipping.notes}
                                            onChange={e => setShipping(p => ({ ...p, notes: e.target.value }))}
                                            placeholder="Ej: Dejar en portería, timbre 3..."
                                        />
                                    </div>
                                </div>

                                {/* Delivery estimate */}
                                <div style={{
                                    marginTop: '20px', padding: '16px',
                                    background: 'rgba(42,157,124,0.06)', borderRadius: '12px',
                                    border: '1px solid rgba(42,157,124,0.1)',
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                }}>
                                    <Truck size={20} style={{ color: 'var(--color-brand-primary)', flexShrink: 0 }} />
                                    <div>
                                        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-brand-primary)' }}>Envío Estándar</p>
                                        <p style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                            Entrega estimada en 2–4 días hábiles
                                            {shippingCost === 0 && ' • ¡GRATIS!'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Continue Button */}
                            <button
                                onClick={() => canProceedToPayment && setStep(3)}
                                disabled={!canProceedToPayment}
                                style={{
                                    width: '100%', marginTop: '20px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    padding: '16px', borderRadius: '14px',
                                    background: canProceedToPayment ? 'var(--color-brand-primary)' : 'rgba(42,157,124,0.2)',
                                    color: canProceedToPayment ? '#fff' : '#4b5563', border: 'none',
                                    fontWeight: 800, fontSize: '0.8rem', cursor: canProceedToPayment ? 'pointer' : 'not-allowed',
                                    letterSpacing: '0.08em', textTransform: 'uppercase' as const,
                                    boxShadow: canProceedToPayment ? '0 8px 25px rgba(42,157,124,0.3)' : 'none',
                                    opacity: canProceedToPayment ? 1 : 0.6,
                                }}
                            >
                                Continuar al Pago <ChevronRight size={16} />
                            </button>
                        </motion.div>
                    )}

                    {/* ─── STEP 3: PAYMENT ─── */}
                    {step === 3 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            {/* Order Summary */}
                            <div style={{
                                background: '#1a2c28', borderRadius: '16px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                padding: '24px', marginBottom: '16px',
                            }}>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Package size={16} style={{ color: 'var(--color-brand-primary)' }} /> Resumen del Pedido
                                </h3>
                                {items.map(item => (
                                    <div key={item.id} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '10px 0',
                                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '8px',
                                                background: 'rgba(255,255,255,0.05)', overflow: 'hidden',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0, border: '1px solid rgba(255,255,255,0.05)',
                                            }}>
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <Coffee size={14} style={{ color: 'var(--color-brand-primary)', opacity: 0.4 }} />
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '0.7rem', color: '#6b7280', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '6px' }}>
                                                    x{item.quantity}
                                                </span>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{item.name}</span>
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                                            ${(item.price * item.quantity).toLocaleString()}
                                        </span>
                                    </div>
                                ))}

                                <div style={{ marginTop: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#6b7280', marginBottom: '6px' }}>
                                        <span>Subtotal</span>
                                        <span>${totalPrice.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#6b7280', marginBottom: '6px' }}>
                                        <span>Envío</span>
                                        <span style={{ color: shippingCost === 0 ? 'var(--color-brand-primary)' : '#d1d5db' }}>
                                            {shippingCost === 0 ? 'Gratis' : `$${shippingCost.toLocaleString()}`}
                                        </span>
                                    </div>
                                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 800, fontSize: '1rem' }}>Total a Pagar</span>
                                        <span style={{ fontWeight: 900, fontSize: '1.4rem', color: '#ffc107' }}>${finalTotal.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Shipping summary */}
                            <div style={{
                                background: '#1a2c28', borderRadius: '16px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                padding: '20px', marginBottom: '16px',
                                display: 'flex', alignItems: 'center', gap: '12px',
                            }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '10px',
                                    background: 'rgba(42,157,124,0.1)', color: 'var(--color-brand-primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <MapPin size={18} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '2px' }}>{shipping.name}</p>
                                    <p style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                        {shipping.address}, {shipping.city}, {shipping.department}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setStep(2)}
                                    style={{
                                        background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#6b7280', padding: '6px 12px', borderRadius: '8px',
                                        fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                                        textTransform: 'uppercase' as const, letterSpacing: '0.1em',
                                    }}
                                >
                                    Editar
                                </button>
                            </div>

                            {/* Payment Button */}
                            <button
                                onClick={handlePayment}
                                disabled={isProcessing}
                                style={{
                                    width: '100%', marginTop: '8px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    padding: '18px', borderRadius: '14px',
                                    background: isProcessing ? 'rgba(42,157,124,0.4)' : 'linear-gradient(135deg, var(--color-brand-primary) 0%, #22c55e 100%)',
                                    color: '#fff', border: 'none',
                                    fontWeight: 800, fontSize: '0.85rem', cursor: isProcessing ? 'wait' : 'pointer',
                                    letterSpacing: '0.08em', textTransform: 'uppercase' as const,
                                    boxShadow: '0 8px 30px rgba(42,157,124,0.35)',
                                    transition: 'all 0.3s',
                                }}
                            >
                                {isProcessing ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                            style={{
                                                width: '18px', height: '18px', borderRadius: '50%',
                                                border: '2px solid rgba(255,255,255,0.3)',
                                                borderTopColor: '#fff',
                                            }}
                                        />
                                        Procesando Pago...
                                    </>
                                ) : (
                                    <>
                                        <Shield size={16} /> Confirmar y Pagar ${finalTotal.toLocaleString()}
                                    </>
                                )}
                            </button>

                            {/* Security badges */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px',
                                marginTop: '16px',
                            }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: '#4b5563' }}>
                                    <Shield size={10} /> Pago seguro SSL
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: '#4b5563' }}>
                                    <Clock size={10} /> Garantía de entrega
                                </span>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    )
}
