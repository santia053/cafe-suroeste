'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Coffee, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/Logo';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { login, loginWithGoogle } = useAuth();
    const { addItem } = useCart();
    const router = useRouter();

    const handlePostAuth = () => {
        const pendingSub = localStorage.getItem('pending_subscription');
        if (pendingSub) {
            try {
                const plan = JSON.parse(pendingSub);
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
                } as any);
                localStorage.removeItem('pending_subscription');
                router.push('/checkout');
                return;
            } catch (e) {
                console.error('Error adding pending sub:', e);
            }
        }
        router.push('/');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (!isLogin && password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            setIsLoading(false);
            return;
        }

        try {
            if (isLogin) {
                const { error: loginError } = await login(email, password);
                if (loginError) throw loginError;
                handlePostAuth();
            } else {
                // Register
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name
                        }
                    }
                });
                if (signUpError) throw signUpError;

                if (data.session) {
                    handlePostAuth();
                } else if (data.user) {
                    // Check if email confirmation is enabled (usually if no session is returned)
                    // If the user disables it, data.session might be present.
                    // For now, if no session, assume they need to check email or it's a success state.
                    setError('SUCCESS: ¡Cuenta creada exitosamente! Ya puedes iniciar sesión.');
                    setEmail('');
                    setPassword('');
                    setConfirmPassword('');
                    setName('');
                } else {
                    setError('No se pudo crear la cuenta. Inténtalo de nuevo.');
                }
            }
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error inesperado');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', background: '#131f1c', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
        }}>
            {/* Subtle background effects */}
            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '400px', height: '400px', background: 'rgba(42,157,124,0.06)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '300px', height: '300px', background: 'rgba(42,157,124,0.04)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />

            {/* Login Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{
                    width: '100%', maxWidth: '420px', margin: '0 auto',
                    padding: '24px', position: 'relative', zIndex: 10,
                }}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '48px', display: 'flex', justifyContent: 'center' }}>
                    <Logo size="xl" className="flex-col !gap-5" />
                </div>

                {/* Form Card */}
                <div style={{
                    background: 'rgba(26,44,40,0.5)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '20px', padding: '32px 28px',
                }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '24px' }}>
                        {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                    </h2>

                    {error && (
                        <div style={{
                            padding: '12px',
                            background: error.startsWith('SUCCESS:') ? 'rgba(42,157,124,0.1)' : 'rgba(239,68,68,0.1)',
                            border: error.startsWith('SUCCESS:') ? '1px solid rgba(42,157,124,0.2)' : '1px solid rgba(239,68,68,0.2)',
                            borderRadius: '10px',
                            color: error.startsWith('SUCCESS:') ? 'var(--color-brand-primary)' : '#ef4444',
                            fontSize: '0.75rem', marginBottom: '20px',
                            textAlign: 'center', fontWeight: 600
                        }}>
                            {error.replace('SUCCESS: ', '')}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Name Field (Register only) */}
                        {!isLogin && (
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: '#6b7280', marginBottom: '8px' }}>
                                    Nombre Completo
                                </label>
                                <input
                                    type="text"
                                    placeholder="Juan Valdés"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required={!isLogin}
                                    style={{
                                        width: '100%', padding: '14px 16px',
                                        background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '12px', color: '#fff', fontSize: '0.9rem',
                                        outline: 'none',
                                    }}
                                />
                            </div>
                        )}

                        {/* Email Field */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: '#6b7280', marginBottom: '8px' }}>
                                Correo Electrónico
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="email"
                                    placeholder="tu@correo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    style={{
                                        width: '100%', padding: '14px 44px 14px 16px',
                                        background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '12px', color: '#fff', fontSize: '0.9rem',
                                        outline: 'none',
                                    }}
                                />
                                <Mail size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563' }} />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: '#6b7280' }}>
                                    Contraseña
                                </label>
                                {isLogin && (
                                    <a href="#" style={{ fontSize: '10px', color: 'var(--color-brand-primary)', fontWeight: 600, textDecoration: 'none' }}>
                                        ¿Olvidaste?
                                    </a>
                                )}
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    style={{
                                        width: '100%', padding: '14px 44px 14px 16px',
                                        background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '12px', color: '#fff', fontSize: '0.9rem',
                                        outline: 'none',
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer' }}
                                >
                                    {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password Field (Register only) */}
                        {!isLogin && (
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: '#6b7280', marginBottom: '8px' }}>
                                    Confirmar Contraseña
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required={!isLogin}
                                        style={{
                                            width: '100%', padding: '14px 16px',
                                            background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)',
                                            borderRadius: '12px', color: '#fff', fontSize: '0.9rem',
                                            outline: 'none',
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                width: '100%', padding: '14px', marginTop: '12px',
                                background: isLoading ? 'rgba(42,157,124,0.5)' : 'var(--color-brand-primary)',
                                color: '#fff', border: 'none',
                                borderRadius: '12px', fontWeight: 800, fontSize: '0.8rem',
                                textTransform: 'uppercase' as const, letterSpacing: '0.15em',
                                cursor: isLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                boxShadow: isLoading ? 'none' : '0 10px 30px rgba(42,157,124,0.25)',
                            }}
                        >
                            {isLoading ? 'Cargando...' : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
                            {!isLoading && <ArrowRight size={16} />}
                        </button>

                    </form>

                    {/* Divider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                        <span style={{ fontSize: '9px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.15em' }}>O continúa con</span>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                    </div>

                    {/* Google Button */}
                    <button
                        type="button"
                        onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Google Login clicked');
                            setIsLoading(true);
                            try {
                                console.log('Calling loginWithGoogle...');
                                const { error } = await loginWithGoogle();
                                if (error) throw error;
                                console.log('Login attempt successful, redirecting...');
                            } catch (e: any) {
                                console.error('Google Login Error:', e);
                                setError('Error al iniciar sesión con Google: ' + (e.message || 'Error desconocido'));
                                setIsLoading(false);
                            }
                        }}
                        style={{
                            width: '100%', padding: '14px',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px', color: '#fff', fontWeight: 700, fontSize: '0.8rem',
                            textTransform: 'uppercase' as const, letterSpacing: '0.1em',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google
                    </button>
                </div>

                {/* Toggle Login/Register */}
                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                        {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            style={{ background: 'none', border: 'none', color: 'var(--color-brand-primary)', fontWeight: 700, cursor: 'pointer', marginLeft: '6px', fontSize: '0.8rem' }}
                        >
                            {isLogin ? 'Regístrate' : 'Inicia Sesión'}
                        </button>
                    </p>
                </div>

                {/* Back to home */}
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <Link href="/" style={{ fontSize: '0.7rem', color: '#4b5563', textDecoration: 'none', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
                        ← Volver al Inicio
                    </Link>
                </div>
            </motion.div >
        </div >
    );
}
