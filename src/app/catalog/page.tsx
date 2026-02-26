'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, SlidersHorizontal, ShoppingBag, X, Coffee, MapPin, Wind, Thermometer, ChevronRight, Package } from 'lucide-react'
import { MOCK_PRODUCTS, Product } from '@/lib/mock-data'
import { useCart } from '@/context/CartContext'
import { Navbar } from '@/components/Navbar'
import Link from 'next/link'
import { toast } from 'sonner'

import { supabase } from '@/lib/supabase'

export default function CatalogPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [showFilters, setShowFilters] = useState(false)
    const [filters, setFilters] = useState({
        process: [] as string[],
        variety: [] as string[],
        maxPrice: 150000
    })
    const { addItem } = useCart()

    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchProducts = async () => {
        setLoading(true)
        console.log('Fetching products from Supabase...')

        // Safety timeout - increased to 15s to handle potentially cold project starts
        const timeoutId = setTimeout(() => {
            if (loading) {
                console.warn('Product fetch taking longer than 15s...')
                setLoading(false)
            }
        }, 15000)

        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('is_published', true)

            if (error) {
                console.error('Supabase error fetching products:', error)
                toast.error('Error al cargar productos. Por favor intente de nuevo.')
                throw error
            }

            if (data) {
                console.log(`Successfully fetched ${data.length} products`)
                const mappedProducts: Product[] = data.map(p => ({
                    id: p.id,
                    name: p.name,
                    origin: {
                        farm: p.origin_farm,
                        municipality: p.origin_municipality,
                        altitude: p.origin_altitude
                    },
                    variety: p.variety,
                    process: p.process,
                    roast_level: p.roast_level,
                    tasting_notes: p.tasting_notes,
                    description: p.description,
                    price: p.price,
                    stock: p.stock,
                    image_url: p.image_url,
                    gramaje: p.gramaje || 340
                }))
                setProducts(mappedProducts)
            }
        } catch (err) {
            console.error('Unhandled error in fetchProducts:', err)
        } finally {
            clearTimeout(timeoutId)
            setLoading(false)
        }
    }

    const toggleFilter = (type: 'process' | 'variety', value: string) => {
        setFilters(prev => {
            const current = prev[type]
            const next = current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value]
            return { ...prev, [type]: next }
        })
    }

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.origin.municipality.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesProcess = filters.process.length === 0 || filters.process.includes(p.process)
        const matchesVariety = filters.variety.length === 0 || filters.variety.includes(p.variety)
        const matchesPrice = p.price <= filters.maxPrice

        return matchesSearch && matchesProcess && matchesVariety && matchesPrice
    })

    const allProcesses = Array.from(new Set(products.map(p => p.process)))
    const allVarieties = Array.from(new Set(products.map(p => p.variety)))

    return (
        <div style={{ minHeight: '100vh', overflow: 'hidden', background: '#131f1c', color: '#fff' }}>
            <Navbar />

            {/* Filter Overlay / Drawer */}
            <AnimatePresence>
                {showFilters && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowFilters(false)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 110 }}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            style={{
                                position: 'fixed', top: 0, right: 0, height: '100%', width: '100%', maxWidth: '360px',
                                background: '#131f1c', borderLeft: '1px solid rgba(255,255,255,0.1)',
                                zIndex: 111, display: 'flex', flexDirection: 'column', padding: '24px',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, fontStyle: 'italic' }}>Filtros</h3>
                                <button onClick={() => setShowFilters(false)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Process Filter */}
                            <div style={{ marginBottom: '32px' }}>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-brand-primary)', marginBottom: '16px' }}>Proceso</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {allProcesses.map(proc => (
                                        <button
                                            key={proc}
                                            onClick={() => toggleFilter('process', proc)}
                                            style={{
                                                padding: '8px 16px', borderRadius: '10px', fontSize: '10px', fontWeight: 700,
                                                background: filters.process.includes(proc) ? 'var(--color-brand-primary)' : 'rgba(255,255,255,0.05)',
                                                color: filters.process.includes(proc) ? '#fff' : '#9ca3af',
                                                border: '1px solid', borderColor: filters.process.includes(proc) ? 'var(--color-brand-primary)' : 'rgba(255,255,255,0.08)',
                                                cursor: 'pointer', transition: 'all 0.2s',
                                            }}
                                        >
                                            {proc}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Variety Filter */}
                            <div style={{ marginBottom: '32px' }}>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-brand-primary)', marginBottom: '16px' }}>Variedad</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {allVarieties.map(v => (
                                        <button
                                            key={v}
                                            onClick={() => toggleFilter('variety', v)}
                                            style={{
                                                padding: '8px 16px', borderRadius: '10px', fontSize: '10px', fontWeight: 700,
                                                background: filters.variety.includes(v) ? 'var(--color-brand-primary)' : 'rgba(255,255,255,0.05)',
                                                color: filters.variety.includes(v) ? '#fff' : '#9ca3af',
                                                border: '1px solid', borderColor: filters.variety.includes(v) ? 'var(--color-brand-primary)' : 'rgba(255,255,255,0.08)',
                                                cursor: 'pointer', transition: 'all 0.2s',
                                            }}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Price Limit Filter */}
                            <div style={{ marginBottom: '32px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <label style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-brand-primary)' }}>Precio Máximo</label>
                                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#fff' }}>${filters.maxPrice.toLocaleString()}</span>
                                </div>
                                <input
                                    type="range"
                                    min="30000"
                                    max="150000"
                                    step="5000"
                                    value={filters.maxPrice}
                                    onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: parseInt(e.target.value) }))}
                                    style={{ width: '100%', accentColor: 'var(--color-brand-primary)', cursor: 'pointer' }}
                                />
                            </div>

                            <button
                                onClick={() => {
                                    setFilters({ process: [], variety: [], maxPrice: 150000 })
                                    setShowFilters(false)
                                }}
                                style={{
                                    marginTop: 'auto', padding: '16px', borderRadius: '14px',
                                    background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)',
                                    fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', cursor: 'pointer',
                                }}
                            >
                                Limpiar Filtros
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Page Content - everything centered with explicit styles */}
            <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto', padding: '120px 24px 80px 24px' }}>

                {/* Header Section */}
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <span style={{ display: 'block', color: 'var(--color-brand-primary)', fontWeight: 700, letterSpacing: '0.4em', fontSize: '10px', textTransform: 'uppercase', marginBottom: '16px' }}>
                        Nuestra Colección
                    </span>
                    <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, fontStyle: 'italic', marginBottom: '24px' }}>
                        Especialidad.
                    </h1>
                    <p style={{ color: '#9ca3af', maxWidth: '480px', margin: '0 auto', fontSize: '0.95rem', lineHeight: 1.7, textAlign: 'center' }}>
                        Cada grano cuenta la historia de una familia, una montaña y un proceso único del Suroeste Antioqueño.
                    </p>
                </div>

                {/* Search & Filters */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '48px' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '520px' }}>
                        <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o municipio..."
                            style={{
                                width: '100%',
                                background: 'rgba(26, 44, 40, 0.5)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '12px',
                                padding: '14px 24px 14px 48px',
                                color: '#fff',
                                fontSize: '0.875rem',
                                outline: 'none',
                            }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={() => setShowFilters(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            padding: '10px 20px',
                            borderRadius: '12px',
                            fontWeight: 700,
                            fontSize: '10px',
                            textTransform: 'uppercase' as const,
                            letterSpacing: '0.15em',
                            color: filters.process.length > 0 || filters.variety.length > 0 ? 'var(--color-brand-primary)' : '#d1d5db',
                            cursor: 'pointer',
                        }}
                    >
                        <SlidersHorizontal size={14} />
                        {filters.process.length > 0 || filters.variety.length > 0 ? `Filtros Activos (${filters.process.length + filters.variety.length})` : 'Filtros Avanzados'}
                    </button>
                </div>

                {/* Product Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: '24px',
                    width: '100%',
                }}>
                    {loading ? (
                        [1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} style={{
                                height: '360px',
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: '16px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                overflow: 'hidden',
                                position: 'relative'
                            }}>
                                <motion.div
                                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    style={{ width: '100%', height: '180px', background: 'rgba(255,255,255,0.03)' }}
                                />
                                <div style={{ padding: '20px' }}>
                                    <div style={{ width: '60%', height: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', marginBottom: '10px' }} />
                                    <div style={{ width: '40%', height: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }} />
                                </div>
                            </div>
                        ))
                    ) : filteredProducts.length > 0 ? (
                        filteredProducts.map((product, idx) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: idx * 0.05 }}
                            >
                                <div style={{
                                    background: '#1a2c28',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: '100%',
                                }}>
                                    {/* Product Image Section */}
                                    <div
                                        onClick={() => setSelectedProduct(product)}
                                        style={{
                                            height: '200px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'rgba(0,0,0,0.2)',
                                            cursor: 'pointer',
                                            position: 'relative',
                                        }}
                                    >
                                        {product.image_url && (product.image_url.startsWith('data:') || product.image_url.startsWith('http') || product.image_url.startsWith('/products/')) ? (
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                            />
                                        ) : (
                                            <Coffee style={{ color: 'rgba(42,157,124,0.1)' }} size={60} />
                                        )}
                                        <span style={{
                                            position: 'absolute',
                                            top: '12px',
                                            left: '12px',
                                            background: 'rgba(42,157,124,0.2)',
                                            color: 'var(--color-brand-primary)',
                                            fontSize: '8px',
                                            fontWeight: 700,
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.15em',
                                            border: '1px solid rgba(42,157,124,0.2)',
                                        }}>
                                            {product.process}
                                        </span>
                                    </div>

                                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ marginBottom: '12px' }}>
                                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>{product.origin.municipality}</h2>
                                            <p style={{ color: '#6b7280', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                                                {product.name} • {product.variety} • {product.gramaje || 340}g
                                            </p>
                                        </div>

                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                                            {product.tasting_notes.slice(0, 2).map(note => (
                                                <span key={note} style={{
                                                    fontSize: '8px',
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.1em',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    color: '#9ca3af',
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                }}>
                                                    {note}
                                                </span>
                                            ))}
                                        </div>

                                        <div style={{
                                            marginTop: 'auto',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '12px',
                                            paddingTop: '16px',
                                            borderTop: '1px solid rgba(255,255,255,0.05)',
                                        }}>
                                            <span style={{ color: 'var(--color-brand-primary)', fontWeight: 700, fontSize: '1.1rem' }}>
                                                ${(product.price / 1000).toFixed(0)}k
                                            </span>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    data-testid="add-to-cart-button"
                                                    onClick={() => {
                                                        addItem(product)
                                                        toast.success(`${product.name} añadido al carrito`)
                                                    }}
                                                    style={{
                                                        width: '36px', height: '36px',
                                                        background: 'var(--color-brand-primary)', color: '#fff',
                                                        borderRadius: '8px', border: 'none',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    <ShoppingBag size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setSelectedProduct(product)}
                                                    style={{
                                                        width: '36px', height: '36px',
                                                        background: 'rgba(255,255,255,0.05)',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        borderRadius: '8px', color: '#fff',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px 0', opacity: 0.5 }}>
                            <Coffee size={48} style={{ marginBottom: '16px', color: 'var(--color-brand-primary)' }} />
                            <p>No se encontraron cafés con esos criterios.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedProduct && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
                    >
                        <div
                            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)' }}
                            onClick={() => setSelectedProduct(null)}
                        />

                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            style={{
                                background: '#1a2c28',
                                border: '1px solid rgba(255,255,255,0.1)',
                                width: '100%',
                                maxWidth: '900px',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                position: 'relative',
                                zIndex: 10,
                                display: 'grid',
                                maxHeight: '95vh',
                                margin: '20px'
                            }}
                            className="md:grid-cols-2 product-modal-container"
                        >
                            <style>{`
                                .product-modal-container {
                                    grid-template-columns: 1fr;
                                }
                                .product-modal-image {
                                    height: 300px;
                                }
                                .product-modal-content {
                                    padding: 24px;
                                    max-height: calc(95vh - 300px);
                                }
                                .product-modal-title {
                                    font-size: 1.75rem;
                                }
                                .product-modal-footer {
                                    position: sticky;
                                    bottom: -24px;
                                    margin-bottom: -24px;
                                    margin-top: auto;
                                    padding: 24px;
                                    background: #1a2c28;
                                    z-index: 20;
                                    border-top: 1px solid rgba(255,255,255,0.05);
                                }
                                @media (min-width: 768px) {
                                    .product-modal-container {
                                        grid-template-columns: 1.1fr 0.9fr;
                                        max-width: 1000px;
                                        height: 650px;
                                        max-height: 85vh;
                                    }
                                    .product-modal-image {
                                        height: 100%;
                                        min-height: 100%;
                                    }
                                    .product-modal-content {
                                        padding: 40px;
                                        max-height: 100%;
                                    }
                                    .product-modal-title {
                                        font-size: 2.5rem;
                                    }
                                    .product-modal-footer {
                                        position: static;
                                        margin: 0;
                                        padding: 0;
                                        padding-top: 24px;
                                        background: transparent;
                                        border: none;
                                    }
                                }
                            `}</style>
                            <button
                                onClick={() => setSelectedProduct(null)}
                                style={{
                                    position: 'absolute', top: '16px', right: '16px', zIndex: 30,
                                    width: '36px', height: '36px',
                                    background: 'rgba(0,0,0,0.5)', color: '#fff',
                                    borderRadius: '50%', border: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer',
                                    backdropFilter: 'blur(4px)',
                                }}
                            >
                                <X size={18} />
                            </button>

                            <div className="product-modal-image" style={{
                                background: 'rgba(0,0,0,0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0',
                                position: 'relative',
                                overflow: 'hidden',
                                borderBottom: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                {selectedProduct.image_url && (selectedProduct.image_url.startsWith('data:') || selectedProduct.image_url.startsWith('http') || selectedProduct.image_url.startsWith('/products/')) ? (
                                    <img
                                        src={selectedProduct.image_url}
                                        alt={selectedProduct.name}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            objectPosition: 'center'
                                        }}
                                    />
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                        <Coffee style={{ color: 'rgba(42,157,124,0.1)' }} size={100} />
                                        <p style={{ fontSize: '9px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Sin imagen disponible</p>
                                    </div>
                                )}
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,44,40,0.8) 0%, transparent 40%)' }} />
                            </div>

                            <div className="product-modal-content" style={{
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <div style={{ marginBottom: '8px' }}>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                                        padding: '6px 12px', borderRadius: '20px',
                                        background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)',
                                        marginBottom: '16px',
                                    }}>
                                        <Wind size={12} style={{ color: 'var(--color-brand-primary)' }} />
                                        <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--color-brand-primary)' }}>
                                            {selectedProduct.origin.altitude} M • {selectedProduct.variety}
                                        </span>
                                    </span>
                                </div>
                                <h2 className="product-modal-title" style={{ fontWeight: 900, marginBottom: '12px', letterSpacing: '-0.02em', fontStyle: 'italic' }}>{selectedProduct.name}</h2>
                                <p style={{ color: '#9ca3af', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '24px' }}>
                                    {selectedProduct.description}
                                </p>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
                                    <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <p style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#6b7280', marginBottom: '4px' }}>Ubicación</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <MapPin style={{ color: 'var(--color-brand-primary)' }} size={12} />
                                            <p style={{ fontWeight: 700, fontSize: '0.8rem' }}>{selectedProduct.origin.municipality}</p>
                                        </div>
                                    </div>
                                    <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <p style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#6b7280', marginBottom: '4px' }}>Proceso</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Wind style={{ color: 'var(--color-brand-primary)' }} size={12} />
                                            <p style={{ fontWeight: 700, fontSize: '0.8rem' }}>{selectedProduct.process}</p>
                                        </div>
                                    </div>
                                    <div style={{ gridColumn: 'span 2', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <p style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#6b7280', marginBottom: '4px' }}>Contenido</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Package style={{ color: 'var(--color-brand-primary)' }} size={12} />
                                            <p style={{ fontWeight: 700, fontSize: '0.8rem' }}>Bolsa de {selectedProduct.gramaje || 340}g</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="product-modal-footer" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '16px',
                                    borderTop: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    <div>
                                        <p style={{ fontSize: '8px', fontWeight: 700, color: '#6b7280', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Precio</p>
                                        <p style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
                                            ${selectedProduct.price.toLocaleString()}
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginLeft: '6px', opacity: 0.3 }}>cop</span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            addItem(selectedProduct);
                                            setSelectedProduct(null);
                                            toast.success(`${selectedProduct.name} añadido al carrito`)
                                        }}
                                        style={{
                                            background: 'var(--color-brand-primary)', color: '#fff',
                                            padding: '12px 24px', borderRadius: '12px',
                                            fontWeight: 900, fontSize: '0.7rem',
                                            textTransform: 'uppercase', letterSpacing: '0.2em',
                                            border: 'none', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                            boxShadow: '0 8px 20px rgba(34, 197, 94, 0.2)'
                                        }}
                                    >
                                        <ShoppingBag size={16} />
                                        Comprar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
