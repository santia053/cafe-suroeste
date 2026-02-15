'use client'

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import {
    LogOut, Package, Truck, CheckCircle, Coffee, CalendarDays,
    CreditCard, MessageCircle, ChevronRight, Repeat, Loader2,
    Calendar, Filter, Search, X, Clock
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface SubscriptionData {
    id: string;
    status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
    next_billing_date: string;
    subscription_plans: {
        name: string;
        price_monthly: number;
        bags_count: number;
    }
}

interface OrderItem {
    product_name: string;
    quantity: number;
}

interface OrderData {
    id: string;
    created_at: string;
    total_amount: number;
    order_status: string;
    order_items: OrderItem[];
}

export default function ProfilePage() {
    const { user, logout, loading } = useAuth();
    const router = useRouter();

    // Subscriptions State
    const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
    const [loadingSub, setLoadingSub] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Orders State
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(true);

    // Filtering State
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [activeFilterTab, setActiveFilterTab] = useState<'all' | '30d' | 'year'>('all');

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
            return;
        }

        if (user) {
            fetchSubscription();
            fetchOrders();
        }
    }, [user, loading, router]);

    const fetchSubscription = async () => {
        try {
            setLoadingSub(true);
            const { data, error } = await supabase
                .from('subscriptions')
                .select(`
                    id,
                    status,
                    start_date,
                    next_billing_date,
                    subscription_plans!subscriptions_plan_id_fkey (
                        name,
                        price_monthly,
                        bags_count
                    )
                `)
                .eq('user_id', user?.id)
                .eq('status', 'ACTIVE')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;
            setSubscription(data as any);
        } catch (error: any) {
            console.error('Error fetching subscription:', error.message);
        } finally {
            setLoadingSub(false);
        }
    };

    const fetchOrders = async () => {
        try {
            setLoadingOrders(true);
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    id,
                    created_at,
                    total_amount,
                    order_status,
                    order_items (
                        product_name,
                        quantity
                    )
                `)
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data as OrderData[]);
        } catch (error: any) {
            console.error('Error fetching orders:', error.message);
        } finally {
            setLoadingOrders(false);
        }
    };

    const filteredOrders = useMemo(() => {
        let result = [...orders];

        // Quick Filters logic
        if (activeFilterTab === '30d') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            result = result.filter(order => new Date(order.created_at) >= thirtyDaysAgo);
        } else if (activeFilterTab === 'year') {
            const currentYearStart = new Date(new Date().getFullYear(), 0, 1);
            result = result.filter(order => new Date(order.created_at) >= currentYearStart);
        }

        // Custom Date Range
        if (startDate) {
            const start = new Date(startDate);
            result = result.filter(order => new Date(order.created_at) >= start);
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            result = result.filter(order => new Date(order.created_at) <= end);
        }

        return result;
    }, [orders, activeFilterTab, startDate, endDate]);

    const handleToggleStatus = async () => {
        if (!subscription || isActionLoading) return;

        const currentStatus = (subscription.status || '').toUpperCase();
        const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
        setIsActionLoading(true);

        try {
            const { error } = await supabase
                .from('subscriptions')
                .update({ status: newStatus })
                .eq('id', subscription.id);

            if (error) throw error;

            setSubscription({ ...subscription, status: newStatus as any });
            toast.success(newStatus === 'PAUSED' ? 'Suscripción pausada con éxito' : 'Suscripción reactivada');
        } catch (error: any) {
            toast.error('Error al actualizar: ' + error.message);
        } finally {
            setIsActionLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('es-CO', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }).format(date);
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: '#131f1c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                    <Coffee size={40} style={{ color: 'var(--color-brand-primary)' }} />
                </motion.div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div style={{ minHeight: '100vh', background: '#131f1c', color: '#fff', overflowX: 'hidden' }}>
            <Navbar />
            <div style={{ height: '100px' }} />

            <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '20px 24px 80px 24px' }}>

                {/* User Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}
                >
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '16px',
                        background: 'rgba(42,157,124,0.15)', border: '2px solid rgba(42,157,124,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-brand-primary)',
                    }}>
                        {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '2px' }}>
                            Hola, {user.full_name}
                        </h1>
                        <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                            {user.email} • ID: {user.id.substring(0, 8)}
                        </p>
                    </div>
                    <button
                        onClick={logout}
                        style={{
                            padding: '10px 16px', borderRadius: '12px',
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                            color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                            fontSize: '0.75rem', fontWeight: 700,
                        }}
                    >
                        <LogOut size={14} />
                        Salir
                    </button>
                </motion.div>

                {/* ──── MY SUBSCRIPTION ──── */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    style={{ marginBottom: '40px' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '0.9rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Repeat size={16} style={{ color: 'var(--color-brand-primary)' }} />
                            Mis Suscripciones
                        </h2>
                        <Link href="/subscriptions" style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-brand-primary)', textDecoration: 'none' }}>
                            Ver planes →
                        </Link>
                    </div>

                    <div style={{
                        background: '#1a2c28', borderRadius: '20px',
                        border: '1px solid rgba(42,157,124,0.2)', padding: '24px',
                        position: 'relative', overflow: 'hidden', minHeight: '180px',
                        display: 'flex', flexDirection: 'column',
                    }}>
                        {loadingSub ? (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Loader2 size={24} className="animate-spin text-brand-primary" />
                            </div>
                        ) : subscription ? (
                            <>
                                {/* Active badge */}
                                <div style={{
                                    position: 'absolute', top: '16px', right: '16px',
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '4px 12px', borderRadius: '8px',
                                    background: (subscription.status || '').toUpperCase() === 'ACTIVE' ? 'rgba(42,157,124,0.15)' : 'rgba(255,193,7,0.1)',
                                    border: `1px solid ${(subscription.status || '').toUpperCase() === 'ACTIVE' ? 'rgba(42,157,124,0.2)' : 'rgba(255,193,7,0.2)'}`,
                                    fontSize: '9px', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.1em',
                                    color: (subscription.status || '').toUpperCase() === 'ACTIVE' ? 'var(--color-brand-primary)' : '#ffc107',
                                }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: (subscription.status || '').toUpperCase() === 'ACTIVE' ? 'var(--color-brand-primary)' : '#ffc107' }} />
                                    {(subscription.status || '').toUpperCase() === 'ACTIVE' ? 'Activa' : 'Pausada'}
                                </div>

                                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                    {/* Coffee icon */}
                                    <div style={{
                                        width: '56px', height: '64px', borderRadius: '12px',
                                        background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <Coffee size={24} style={{ color: 'rgba(42,157,124,0.4)' }} />
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, fontStyle: 'italic', marginBottom: '4px' }}>
                                            Plan {subscription.subscription_plans.name}
                                        </h3>
                                        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '16px' }}>
                                            {subscription.subscription_plans.bags_count} x 340g • Origen Rotativo • Mensual
                                        </p>

                                        <div style={{ display: 'flex', gap: '32px' }}>
                                            <div>
                                                <p style={{ fontSize: '9px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '4px' }}>
                                                    Próxima Entrega
                                                </p>
                                                <p style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <CalendarDays size={14} style={{ color: 'var(--color-brand-primary)' }} />
                                                    {subscription.next_billing_date || 'Pendiente'}
                                                </p>
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '9px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '4px' }}>
                                                    Total Mensual
                                                </p>
                                                <p style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <CreditCard size={14} style={{ color: 'var(--color-brand-primary)' }} />
                                                    ${Number(subscription.subscription_plans.price_monthly).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <button
                                        onClick={handleToggleStatus}
                                        disabled={isActionLoading}
                                        style={{
                                            padding: '8px 16px', borderRadius: '8px',
                                            background: 'none', border: '1px solid rgba(255,255,255,0.08)',
                                            color: (subscription.status || '').toUpperCase() === 'ACTIVE' ? '#ffc107' : 'var(--color-brand-primary)',
                                            cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700,
                                            display: 'flex', alignItems: 'center', gap: '6px'
                                        }}
                                    >
                                        {isActionLoading && <Loader2 size={12} className="animate-spin" />}
                                        {(subscription.status || '').toUpperCase() === 'ACTIVE' ? 'Pausar Suscripción' : 'Reanudar Suscripción'}
                                    </button>
                                    <Link
                                        href="/subscriptions"
                                        style={{
                                            padding: '8px 16px', borderRadius: '8px',
                                            background: 'rgba(42,157,124,0.1)', border: '1px solid rgba(42,157,124,0.2)',
                                            color: 'var(--color-brand-primary)', textDecoration: 'none', fontSize: '0.7rem', fontWeight: 700
                                        }}
                                    >
                                        Gestionar
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                <div style={{ marginBottom: '12px', opacity: 0.3 }}>
                                    <Repeat size={40} />
                                </div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '4px' }}>Sin suscripción activa</h3>
                                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '16px', maxWidth: '240px' }}>
                                    Únete al club y recibe los mejores granos de Andes en tu puerta cada mes.
                                </p>
                                <Link
                                    href="/subscriptions"
                                    style={{
                                        background: 'var(--color-brand-primary)', color: '#fff',
                                        padding: '10px 20px', borderRadius: '10px',
                                        fontSize: '0.75rem', fontWeight: 800, textDecoration: 'none'
                                    }}
                                >
                                    Elegir un Plan
                                </Link>
                            </div>
                        )}
                    </div>
                </motion.section>

                {/* ──── PURCHASE HISTORY ──── */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ marginBottom: '40px' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
                        <div>
                            <h2 style={{ fontSize: '0.9rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <Package size={16} style={{ color: 'var(--color-brand-primary)' }} />
                                Historial de Compras
                            </h2>
                            <p style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                {filteredOrders.length} pedidos encontrados
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                style={{
                                    width: '36px', height: '36px', borderRadius: '10px',
                                    background: showFilters ? 'rgba(42,157,124,0.15)' : 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${showFilters ? 'rgba(42,157,124,0.3)' : 'rgba(255,255,255,0.05)'}`,
                                    color: showFilters ? 'var(--color-brand-primary)' : '#9ca3af',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                                }}
                            >
                                <Filter size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                style={{ overflow: 'hidden', marginBottom: '24px' }}
                            >
                                <div style={{
                                    padding: '20px', borderRadius: '16px', background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.05)', display: 'flex',
                                    flexDirection: 'column', gap: '20px'
                                }}>
                                    {/* Quick Tabs */}
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {[
                                            { id: 'all', label: 'Todo' },
                                            { id: '30d', label: 'Últimos 30 días' },
                                            { id: 'year', label: 'Este año' }
                                        ].map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => {
                                                    setActiveFilterTab(tab.id as any);
                                                    setStartDate('');
                                                    setEndDate('');
                                                }}
                                                style={{
                                                    padding: '6px 14px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700,
                                                    background: activeFilterTab === tab.id ? 'rgba(42,157,124,0.1)' : 'transparent',
                                                    border: `1px solid ${activeFilterTab === tab.id ? 'rgba(42,157,124,0.3)' : 'rgba(255,255,255,0.05)'}`,
                                                    color: activeFilterTab === tab.id ? 'var(--color-brand-primary)' : '#6b7280', cursor: 'pointer'
                                                }}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Custom Range */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '9px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Desde</label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="date"
                                                    value={startDate}
                                                    onChange={(e) => {
                                                        setStartDate(e.target.value);
                                                        setActiveFilterTab('all');
                                                    }}
                                                    style={{
                                                        width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)',
                                                        borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '0.8rem', outline: 'none'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '9px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Hasta</label>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => {
                                                    setEndDate(e.target.value);
                                                    setActiveFilterTab('all');
                                                }}
                                                style={{
                                                    width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)',
                                                    borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '0.8rem', outline: 'none'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {(startDate || endDate || activeFilterTab !== 'all') && (
                                        <button
                                            onClick={() => {
                                                setStartDate('');
                                                setEndDate('');
                                                setActiveFilterTab('all');
                                            }}
                                            style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#6b7280', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        >
                                            <X size={12} /> Limpiar filtros
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Orders List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {loadingOrders ? (
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <Loader2 size={32} className="animate-spin text-brand-primary mx-auto mb-4" />
                                <p style={{ fontSize: '0.8rem', color: '#4b5563' }}>Cargando historial...</p>
                            </div>
                        ) : filteredOrders.length > 0 ? (
                            filteredOrders.map((order) => (
                                <motion.div
                                    layout
                                    key={order.id}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '16px 20px', borderRadius: '16px',
                                        background: '#1a2c28', border: '1px solid rgba(255,255,255,0.05)',
                                        cursor: 'pointer', transition: 'all 0.2s',
                                    }}
                                    whileHover={{ background: 'rgba(26,44,40,1.2)', borderColor: 'rgba(42,157,124,0.3)' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{
                                            width: '44px', height: '44px', borderRadius: '12px',
                                            background: 'rgba(255,255,255,0.02)',
                                            color: order.order_status === 'ENTREGADO' ? 'var(--color-brand-primary)' : '#ffc107',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            border: '1px solid rgba(255,255,255,0.04)'
                                        }}>
                                            {order.order_status === 'ENTREGADO' ? <CheckCircle size={20} /> : <Clock size={20} />}
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>#{order.id.split('-')[0].toUpperCase()}</span>
                                                <span style={{
                                                    fontSize: '9px', fontWeight: 800,
                                                    color: order.order_status === 'ENTREGADO' ? 'var(--color-brand-primary)' : '#ffc107',
                                                    padding: '2px 8px', borderRadius: '6px',
                                                    background: order.order_status === 'ENTREGADO' ? 'rgba(42,157,124,0.1)' : 'rgba(255,193,7,0.1)',
                                                    textTransform: 'uppercase', letterSpacing: '0.05em'
                                                }}>
                                                    {order.order_status}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px', fontWeight: 600 }}>
                                                {order.order_items.map(i => `${i.product_name} x${i.quantity}`).join(', ')}
                                            </p>
                                            <p style={{ fontSize: '0.65rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Calendar size={10} /> {formatDate(order.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '1rem', fontWeight: 900, color: '#fff' }}>
                                            ${Number(order.total_amount).toLocaleString()}
                                        </span>
                                        <ChevronRight size={18} style={{ color: '#4b5563' }} />
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div style={{
                                padding: '60px 40px', textAlign: 'center', background: 'rgba(0,0,0,0.1)',
                                borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.05)'
                            }}>
                                <Search size={32} style={{ color: '#4b5563', margin: '0 auto 16px', opacity: 0.5 }} />
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#9ca3af', marginBottom: '4px' }}>No hay pedidos</h3>
                                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Prueba ajustando el rango de fechas.</p>
                            </div>
                        )}
                    </div>
                </motion.section>

                {/* ──── HELP BANNER ──── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    style={{
                        padding: '20px', borderRadius: '16px',
                        background: 'linear-gradient(135deg, #1a2c28, #131f1c)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                >
                    <div>
                        <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>¿Necesitas ayuda?</p>
                        <p style={{ fontSize: '0.7rem', color: '#6b7280' }}>Contáctanos por WhatsApp</p>
                    </div>
                    <button style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: 'rgba(37,211,102,0.15)', border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#25D366', cursor: 'pointer',
                    }}>
                        <MessageCircle size={20} />
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
