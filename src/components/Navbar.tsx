'use client'

import { useState } from 'react'
import { Coffee, ShoppingBag, Menu, X } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { CartDrawer } from '@/components/CartDrawer'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from '@/components/Logo'

export const Navbar = () => {
    const [isCartOpen, setIsCartOpen] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
    const { totalItems } = useCart()
    const { user, logout } = useAuth()
    const pathname = usePathname()

    const navLinks = [
        { name: 'Catálogo', href: '/catalog' },
        { name: 'Suscripciones', href: '/subscriptions' },
        { name: 'Historias', href: '/about' },
    ]

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 py-4" style={{ background: 'rgba(19, 31, 28, 0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Desktop Layout */}
                    <div className="hidden md:flex items-center justify-between h-14">
                        {/* Left: Logo */}
                        <div className="flex items-center shrink-0">
                            <Logo size="md" />
                        </div>

                        {/* Center: Navigation Links */}
                        <div className="flex items-center gap-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`text-[11px] font-bold uppercase tracking-[0.2em] transition-all relative group ${pathname === link.href
                                        ? 'text-brand-accent'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {link.name}
                                    <span className={`absolute -bottom-1 left-0 h-[2px] bg-brand-primary transition-all duration-300 ${pathname === link.href ? 'w-full' : 'w-0 group-hover:w-full'
                                        }`} />
                                </Link>
                            ))}
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-4 shrink-0">
                            <button
                                onClick={() => setIsCartOpen(true)}
                                aria-label={`Abrir carrito. ${totalItems} productos.`}
                                className="flex items-center gap-2 bg-brand-primary text-white pl-4 pr-6 py-2 rounded-xl font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all relative"
                            >
                                <ShoppingBag size={14} />
                                Mi Carrito
                                {totalItems > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-black border-2 border-background-dark">
                                        {totalItems}
                                    </span>
                                )}
                            </button>

                            <div className="relative">
                                {user ? (
                                    <button
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        aria-label="Abrir menú de usuario"
                                        aria-expanded={isUserMenuOpen}
                                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-all"
                                    >
                                        <div className="w-8 h-8 bg-brand-deep rounded-full flex items-center justify-center text-brand-accent border border-white/10 text-xs font-bold">
                                            {user.full_name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="hidden lg:inline text-xs font-bold">{user.full_name}</span>
                                    </button>
                                ) : (
                                    <Link href="/login" className="text-gray-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider border border-white/10 px-4 py-2 rounded-full hover:bg-white/5">
                                        Ingresar
                                    </Link>
                                )}

                                <AnimatePresence>
                                    {isUserMenuOpen && user && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            style={{
                                                position: 'absolute',
                                                right: 0,
                                                top: '100%',
                                                marginTop: '12px',
                                                width: '200px',
                                                background: 'rgba(19, 31, 28, 0.92)',
                                                backdropFilter: 'blur(24px)',
                                                WebkitBackdropFilter: 'blur(24px)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '16px',
                                                padding: '8px',
                                                boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
                                                zIndex: 9999,
                                            }}
                                        >
                                            <Link href="/profile" style={{ display: 'block', padding: '10px 16px', fontSize: '12px', fontWeight: 700, color: '#d1d5db', borderRadius: '10px', textDecoration: 'none', transition: 'background 0.2s' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                Mi Perfil
                                            </Link>
                                            {user.role === 'admin' && (
                                                <Link href="/admin" style={{ display: 'block', padding: '10px 16px', fontSize: '12px', fontWeight: 700, color: 'var(--color-brand-primary)', borderRadius: '10px', textDecoration: 'none', transition: 'background 0.2s' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(34, 197, 94, 0.08)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                    Panel Admin
                                                </Link>
                                            )}
                                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 8px' }} />
                                            <button
                                                onClick={logout}
                                                style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '12px', fontWeight: 700, color: '#f87171', borderRadius: '10px', border: 'none', background: 'transparent', cursor: 'pointer', transition: 'background 0.2s' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.08)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                            >
                                                Cerrar Sesión
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Layout */}
                    <div className="flex md:hidden items-center justify-between h-12">
                        <div className="flex items-center gap-2 pl-12">
                            <div className="bg-brand-primary p-1.5 rounded-lg">
                                <Coffee className="text-white" size={18} />
                            </div>
                            <Link href="/" className="text-base font-black tracking-tight text-white">
                                CAFÉ<span className="text-brand-primary italic">SUROESTE</span>
                            </Link>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsCartOpen(true)}
                                aria-label={`Abrir carrito. ${totalItems} productos.`}
                                className="relative p-2 text-white"
                            >
                                <ShoppingBag size={22} />
                                {totalItems > 0 && (
                                    <span className="absolute top-0 right-0 bg-brand-primary text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                                        {totalItems}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú de navegación"}
                                aria-expanded={isMenuOpen}
                                className="text-white p-1"
                            >
                                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay - Redesigned with uniform typography */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 md:hidden"
                        style={{ background: 'rgba(19, 31, 28, 0.98)', backdropFilter: 'blur(24px)' }}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setIsMenuOpen(false)}
                            aria-label="Cerrar menú"
                            className="absolute top-6 right-6 p-2 text-white/40 hover:text-white transition-colors z-50"
                        >
                            <X size={28} />
                        </button>

                        {/* Menu content - vertically centered */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            padding: '0 32px',
                            gap: '0',
                        }}>
                            {/* Avatar + Greeting */}
                            {user && (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '32px',
                                }}>
                                    <div style={{
                                        width: '56px',
                                        height: '56px',
                                        borderRadius: '16px',
                                        background: 'rgba(34, 197, 94, 0.15)',
                                        border: '2px solid rgba(255,255,255,0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '20px',
                                        fontWeight: 700,
                                        color: 'var(--color-brand-primary)',
                                    }}>
                                        {user.full_name.charAt(0).toUpperCase()}
                                    </div>
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: 'rgba(255,255,255,0.35)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.15em',
                                    }}>
                                        Hola, {user.full_name.split(' ')[0]}
                                    </span>
                                </div>
                            )}

                            {/* Navigation items - ALL same size */}
                            <nav style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '20px',
                                marginBottom: '32px',
                            }}>
                                {user ? (
                                    <Link
                                        href="/profile"
                                        onClick={() => setIsMenuOpen(false)}
                                        style={{
                                            fontSize: '18px',
                                            fontWeight: 600,
                                            color: pathname === '/profile' ? 'var(--color-brand-primary)' : 'rgba(255,255,255,0.8)',
                                            textDecoration: 'none',
                                            transition: 'color 0.2s',
                                            letterSpacing: '-0.01em',
                                        }}
                                    >
                                        Mi Perfil
                                    </Link>
                                ) : (
                                    <Link
                                        href="/login"
                                        onClick={() => setIsMenuOpen(false)}
                                        style={{
                                            fontSize: '18px',
                                            fontWeight: 600,
                                            color: 'rgba(255,255,255,0.8)',
                                            textDecoration: 'none',
                                            transition: 'color 0.2s',
                                            letterSpacing: '-0.01em',
                                        }}
                                    >
                                        Iniciar Sesión
                                    </Link>
                                )}

                                {user?.role === 'admin' && (
                                    <Link
                                        href="/admin"
                                        onClick={() => setIsMenuOpen(false)}
                                        style={{
                                            fontSize: '18px',
                                            fontWeight: 600,
                                            color: pathname === '/admin' ? 'var(--color-brand-primary)' : 'rgba(255,255,255,0.8)',
                                            textDecoration: 'none',
                                            transition: 'color 0.2s',
                                            letterSpacing: '-0.01em',
                                        }}
                                    >
                                        Panel Admin
                                    </Link>
                                )}

                                {/* Subtle divider */}
                                <div style={{ width: '32px', height: '1px', background: 'rgba(255,255,255,0.08)' }} />

                                <Link
                                    href="/subscriptions"
                                    onClick={() => setIsMenuOpen(false)}
                                    style={{
                                        fontSize: '18px',
                                        fontWeight: 600,
                                        color: pathname === '/subscriptions' ? 'var(--color-brand-primary)' : 'rgba(255,255,255,0.8)',
                                        textDecoration: 'none',
                                        transition: 'color 0.2s',
                                        letterSpacing: '-0.01em',
                                    }}
                                >
                                    Suscripciones
                                </Link>

                                <Link
                                    href="/about"
                                    onClick={() => setIsMenuOpen(false)}
                                    style={{
                                        fontSize: '18px',
                                        fontWeight: 600,
                                        color: pathname === '/about' ? 'var(--color-brand-primary)' : 'rgba(255,255,255,0.8)',
                                        textDecoration: 'none',
                                        transition: 'color 0.2s',
                                        letterSpacing: '-0.01em',
                                    }}
                                >
                                    Historias
                                </Link>
                            </nav>

                            {/* CTA Button */}
                            <Link
                                href="/catalog"
                                onClick={() => setIsMenuOpen(false)}
                                style={{
                                    background: 'var(--color-brand-primary)',
                                    color: '#fff',
                                    padding: '14px 40px',
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                    fontSize: '13px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.15em',
                                    textDecoration: 'none',
                                    transition: 'transform 0.2s, opacity 0.2s',
                                    boxShadow: '0 8px 24px rgba(34, 197, 94, 0.25)',
                                }}
                            >
                                Ir a la Tienda
                            </Link>

                            {/* Logout */}
                            {user && (
                                <button
                                    onClick={() => {
                                        logout();
                                        setIsMenuOpen(false);
                                    }}
                                    style={{
                                        marginTop: '24px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: 'rgba(248,113,113,0.6)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.12em',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'color 0.2s',
                                    }}
                                >
                                    Cerrar Sesión
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </>
    )
}
