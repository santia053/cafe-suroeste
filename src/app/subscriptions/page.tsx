'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Coffee, Zap, Trophy, ArrowRight, AlertCircle, CalendarDays, Loader2 } from 'lucide-react'
import { MOCK_SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/lib/mock-data'
import { Navbar } from '@/components/Navbar'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { supabase } from '@/lib/supabase'

export default function SubscriptionsPage() {
    const { isAuthenticated, user, loading } = useAuth()
    const { addItem } = useCart()
    const router = useRouter()
    const [activeSub, setActiveSub] = useState<any>(null)
    const [loadingSub, setLoadingSub] = useState(true)

    const [plans, setPlans] = useState<SubscriptionPlan[]>([])
    const [loadingPlans, setLoadingPlans] = useState(true)

    // Fetch subscription plans with Realtime updates
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const { data, error } = await supabase
                    .from('subscription_plans')
                    .select('*')
                    .eq('is_active', true)
                    .order('price_monthly', { ascending: true })

                if (error) throw error
                setPlans(data || [])
            } catch (error) {
                console.error('Error fetching plans:', error)
            } finally {
                setLoadingPlans(false)
            }
        }

        fetchPlans()

        // Realtime subscription
        const channel = supabase
            .channel('public:subscription_plans')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'subscription_plans' }, (payload) => {
                console.log('Realtime update received:', payload)
                fetchPlans()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    // Check if user already has an active subscription — run on every mount
    useEffect(() => {
        const checkSubscription = async () => {
            if (loading) return // Wait for auth to finish

            if (!user) {
                setActiveSub(null)
                setLoadingSub(false)
                return
            }

            console.log('[Subscriptions] Checking active sub for user:', user.id)
            try {
                const { data, error } = await supabase
                    .from('subscriptions')
                    .select('*, subscription_plans!subscriptions_plan_id_fkey(name, price_monthly, bags_count)')
                    .eq('user_id', user.id)
                    .eq('status', 'ACTIVE')
                    .maybeSingle()

                console.log('[Subscriptions] Active sub result:', data, error)
                setActiveSub(data)
            } catch (err) {
                console.error('[Subscriptions] Error checking sub:', err)
            } finally {
                setLoadingSub(false)
            }
        }
        checkSubscription()
    }, [user, loading])

    const handleSelectPlan = (plan: any) => {
        if (!isAuthenticated) {
            localStorage.setItem('pending_subscription', JSON.stringify(plan))
            router.push('/login?redirect=/subscriptions')
            return
        }

        // If user already has the same plan active, block
        if (activeSub && activeSub.plan_id === plan.id) {
            return // Already on this plan
        }

        // If upgrading/changing plan, save as pending upgrade
        if (activeSub) {
            handleUpgrade(plan)
            return
        }

        // New subscription - add to cart
        addItem({
            id: plan.id,
            name: `Suscripción: ${plan.name}`,
            price: plan.price_monthly,
            image_url: '/icons/subscription-package.png',
            origin: { farm: 'Varios', municipality: 'Suroeste Antioqueño', altitude: 0 },
            variety: 'Rotativa',
            process: 'Especial',
            roast_level: 'Variable',
            tasting_notes: plan.features.slice(0, 3),
            description: plan.description,
            stock: 999
        } as any)

        router.push('/checkout')
    }

    const handleUpgrade = async (plan: any) => {
        // Schedule upgrade for next billing cycle
        const { error } = await supabase
            .from('subscriptions')
            .update({ pending_plan_id: plan.id })
            .eq('id', activeSub.id)

        if (!error) {
            setActiveSub({ ...activeSub, pending_plan_id: plan.id })
            alert(`¡Tu plan se actualizará a "${plan.name}" en tu próximo ciclo de facturación (${activeSub.next_billing_date})!`)
        } else {
            alert('Error al programar el cambio de plan: ' + error.message)
        }
    }

    const isCurrentPlan = (planId: string) => activeSub?.plan_id === planId
    const isPendingUpgrade = (planId: string) => activeSub?.pending_plan_id === planId

    return (
        <div style={{ minHeight: '100vh', background: '#131f1c', color: '#fff', overflow: 'hidden' }}>
            <Navbar />

            {/* Spacer for fixed navbar */}
            <div style={{ height: '100px' }} />

            {/* Page Content */}
            <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 80px 24px' }}>

                {/* Header */}
                <header style={{ textAlign: 'center', marginBottom: '64px' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span style={{ display: 'block', color: 'var(--color-brand-primary)', fontWeight: 900, letterSpacing: '0.4em', fontSize: '10px', textTransform: 'uppercase' as const, marginBottom: '16px' }}>
                            Membresías Exclusivas
                        </span>
                        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, marginBottom: '24px', lineHeight: 0.9, letterSpacing: '-0.03em', fontStyle: 'italic' }}>
                            Club Selecto.
                        </h1>
                        <p style={{ color: '#9ca3af', maxWidth: '560px', margin: '0 auto', fontSize: '1rem', lineHeight: 1.7, textAlign: 'center' }}>
                            Recibe lo mejor del suroeste antioqueño en tu puerta. Selecciones de autor y microlotes que nunca llegan al mercado comercial.
                        </p>
                    </motion.div>
                </header>

                {/* Active Subscription Banner */}
                {activeSub && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: 'rgba(42,157,124,0.1)',
                            border: '1px solid rgba(42,157,124,0.25)',
                            borderRadius: '16px',
                            padding: '20px 28px',
                            marginBottom: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            flexWrap: 'wrap',
                        }}
                    >
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(42,157,124,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Coffee size={20} style={{ color: 'var(--color-brand-primary)' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '4px' }}>
                                Ya tienes el plan <span style={{ color: 'var(--color-brand-primary)' }}>{activeSub.subscription_plans?.name}</span> activo
                            </p>
                            <p style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                                <CalendarDays size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                                Próximo cobro: {activeSub.next_billing_date} · Si deseas mejorar tu plan, el cambio se aplicará en tu próximo ciclo.
                            </p>
                        </div>
                        <Link href="/profile" style={{
                            padding: '10px 20px', borderRadius: '10px',
                            background: 'var(--color-brand-primary)', color: '#fff', fontWeight: 800, fontSize: '0.7rem',
                            textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                        }}>
                            Gestionar
                        </Link>
                    </motion.div>
                )}

                {/* Plans Grid */}
                {loadingPlans ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                        <Loader2 className="animate-spin text-brand-primary" size={32} />
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '80px' }}>
                        {plans.map((plan, idx) => {
                            const isCurrent = isCurrentPlan(plan.id)
                            const isPending = isPendingUpgrade(plan.id)
                            const isDisabled = isCurrent || loadingSub

                            return (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, y: 40 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                                >
                                    <div style={{
                                        position: 'relative',
                                        background: '#1a2c28',
                                        borderRadius: '24px',
                                        padding: '40px 28px',
                                        border: isCurrent ? '2px solid var(--color-brand-primary)' :
                                            plan.is_popular ? '1px solid rgba(42,157,124,0.3)' : '1px solid rgba(255,255,255,0.05)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        height: '100%',
                                        boxShadow: isCurrent ? '0 0 40px rgba(42,157,124,0.15)' :
                                            plan.is_popular ? '0 0 60px rgba(42,157,124,0.08)' : 'none',
                                        opacity: isCurrent ? 0.7 : 1,
                                    }}>
                                        {/* Current plan badge */}
                                        {isCurrent && (
                                            <div style={{
                                                position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                                                background: 'var(--color-brand-primary)', color: '#fff',
                                                padding: '5px 16px', borderRadius: '20px',
                                                fontSize: '9px', fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase' as const,
                                                whiteSpace: 'nowrap',
                                            }}>
                                                ✓ Tu Plan Actual
                                            </div>
                                        )}

                                        {/* Pending upgrade badge */}
                                        {isPending && !isCurrent && (
                                            <div style={{
                                                position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                                                background: '#eab308', color: '#000',
                                                padding: '5px 16px', borderRadius: '20px',
                                                fontSize: '9px', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase' as const,
                                                whiteSpace: 'nowrap',
                                            }}>
                                                Próximo Mes
                                            </div>
                                        )}

                                        {/* Recommended badge (only if not current) */}
                                        {plan.is_popular && !isCurrent && !isPending && (
                                            <div style={{
                                                position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)',
                                                background: 'var(--color-brand-primary)', color: '#fff',
                                                padding: '6px 20px', borderRadius: '20px',
                                                fontSize: '9px', fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase' as const,
                                                boxShadow: '0 10px 30px rgba(42,157,124,0.3)',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                Recomendado
                                            </div>
                                        )}

                                        {/* Icon */}
                                        <div style={{
                                            width: '64px', height: '64px', borderRadius: '16px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            marginBottom: '24px',
                                            background: plan.id === '10000000-0000-0000-0000-000000000001' ? 'rgba(42,157,124,0.1)' :
                                                plan.id === '20000000-0000-0000-0000-000000000002' ? 'rgba(199,73,56,0.1)' : 'rgba(255,193,7,0.1)',
                                            color: plan.id === '10000000-0000-0000-0000-000000000001' ? 'var(--color-brand-primary)' :
                                                plan.id === '20000000-0000-0000-0000-000000000002' ? '#c74938' : '#ffc107',
                                        }}>
                                            {plan.id === '10000000-0000-0000-0000-000000000001' ? <Coffee size={32} /> :
                                                plan.id === '20000000-0000-0000-0000-000000000002' ? <Zap size={32} /> : <Trophy size={32} />}
                                        </div>

                                        {/* Plan Name & Description */}
                                        <h3 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '8px', fontStyle: 'italic', lineHeight: 1 }}>
                                            {plan.name}
                                        </h3>
                                        <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginBottom: '24px', lineHeight: 1.5, opacity: 0.7 }}>
                                            {plan.description}
                                        </p>

                                        {/* Price */}
                                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px', marginBottom: '28px' }}>
                                            <span style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
                                                ${(plan.price_monthly / 1000).toFixed(0)}k
                                            </span>
                                            <span style={{ color: '#6b7280', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.15em' }}>
                                                / mes
                                            </span>
                                        </div>

                                        {/* Features List */}
                                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0', width: '100%', textAlign: 'left' }}>
                                            {plan.features.map(feature => (
                                                <li key={feature} style={{
                                                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                                                    fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)',
                                                    marginBottom: '14px',
                                                }}>
                                                    <div style={{
                                                        marginTop: '2px', width: '16px', height: '16px', borderRadius: '50%',
                                                        background: 'rgba(42,157,124,0.1)', color: 'var(--color-brand-primary)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        flexShrink: 0,
                                                    }}>
                                                        <Check size={10} />
                                                    </div>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>

                                        {/* CTA Button */}
                                        <button
                                            onClick={() => handleSelectPlan(plan)}
                                            disabled={isDisabled}
                                            style={{
                                                marginTop: 'auto', width: '100%',
                                                padding: '18px', borderRadius: '16px',
                                                fontWeight: 900, fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase' as const,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                                cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                border: 'none',
                                                background: isCurrent ? 'rgba(42,157,124,0.2)' :
                                                    isPending ? 'rgba(234,179,8,0.2)' :
                                                        activeSub ? 'rgba(59,130,246,0.15)' :
                                                            plan.is_popular ? 'var(--color-brand-primary)' : 'rgba(255,255,255,0.05)',
                                                color: isCurrent ? 'var(--color-brand-primary)' : isPending ? '#eab308' : '#fff',
                                                boxShadow: !isDisabled && plan.is_popular ? '0 10px 30px rgba(42,157,124,0.2)' : 'none',
                                                opacity: isDisabled ? 0.6 : 1,
                                            }}>
                                            {isCurrent ? '✓ Plan Actual' :
                                                isPending ? '⏳ Cambio Programado' :
                                                    activeSub ? 'Mejorar a Este Plan' :
                                                        'Seleccionar Experiencia'}
                                            {!isCurrent && !isPending && <ArrowRight size={16} />}
                                        </button>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                )}

                {/* Benefits Section */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '48px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '32px' }}>
                        {[
                            { title: 'Sin Compromiso', desc: 'Cancela o pausa tu suscripción en cualquier momento desde tu perfil digital.' },
                            { title: 'Envío Prioritario', desc: 'Todos nuestros planes incluyen envío refrigerado y seguimiento en tiempo real.' },
                            { title: 'Fresco de Verdad', desc: 'Tostamos cada lote solo 48 horas antes de que llegue a tu puerta.' },
                            { title: 'Impacto Real', desc: 'Conoce la historia detrás de cada productor y cómo tu compra mejora su vida.' },
                        ].map((benefit, i) => (
                            <div key={i} style={{ textAlign: 'center' }}>
                                <h4 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '12px', fontStyle: 'italic' }}>
                                    {benefit.title}
                                </h4>
                                <p style={{ color: '#9ca3af', fontSize: '0.8rem', lineHeight: 1.6, opacity: 0.7 }}>
                                    {benefit.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
