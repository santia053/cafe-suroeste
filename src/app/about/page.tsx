'use client'

import { motion } from 'framer-motion'
import { Coffee, MapPin, Leaf, ShieldCheck, Users } from 'lucide-react'
import { Navbar } from '@/components/Navbar'

export default function AboutPage() {
    return (
        <div style={{ minHeight: '100vh', background: '#131f1c', color: '#fff', overflow: 'hidden' }}>
            <Navbar />

            {/* Spacer for navbar */}
            <div style={{ height: '100px' }} />

            <main style={{ width: '100%', maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 80px 24px' }}>

                {/* Hero / Manifesto Section */}
                <section style={{ textAlign: 'center', marginBottom: '80px' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1 }}
                    >
                        <span style={{ display: 'block', color: 'var(--color-brand-primary)', fontWeight: 900, letterSpacing: '0.4em', fontSize: '10px', textTransform: 'uppercase' as const, marginBottom: '16px' }}>
                            Nuestro Manifiesto
                        </span>
                        <h1 style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)', fontWeight: 900, marginBottom: '24px', lineHeight: 0.85, letterSpacing: '-0.03em', fontStyle: 'italic' }}>
                            Corazón <br /><span style={{ color: 'var(--color-brand-primary)' }}>Andino.</span>
                        </h1>
                        <p style={{ color: '#9ca3af', maxWidth: '600px', margin: '0 auto', fontSize: '1.05rem', lineHeight: 1.7, textAlign: 'center' }}>
                            Andes es más que un municipio; es la capital cafetera donde las nubes abrazan los Farallones del Citará y el café corre por las venas de su gente.
                        </p>
                    </motion.div>
                </section>

                {/* Story Section - 2 column */}
                <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '48px', alignItems: 'center', marginBottom: '80px' }}
                    className="lg:!grid-cols-2"
                >
                    {/* Image / Visual block */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div style={{
                            position: 'relative', aspectRatio: '1', background: '#1a2c28',
                            borderRadius: '32px', overflow: 'hidden',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                        }}>
                            <img
                                src="/imagen-de-historia.png"
                                alt="Alma de Andes"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    filter: 'contrast(1.1) brightness(0.9) saturate(0.8)',
                                }}
                            />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(19,31,28,0.8) 100%)' }} />
                            <div style={{
                                position: 'absolute', bottom: '24px', left: '24px', right: '24px',
                                background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
                                padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)',
                            }}>
                                <p style={{ fontSize: '1.25rem', fontWeight: 900, fontStyle: 'italic', marginBottom: '4px' }}>
                                    "Andes es café en cada aliento."
                                </p>
                                <p style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '0.15em', opacity: 0.4 }}>
                                    Herencia Cafetera, Andes Antioquia
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Text block */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h3 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, marginBottom: '24px', fontStyle: 'italic', lineHeight: 1.05 }}>
                            Bajo la Sombra de los <span style={{ color: 'var(--color-brand-primary)' }}>Farallones.</span>
                        </h3>
                        <p style={{ color: '#9ca3af', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '20px' }}>
                            Nuestra historia nace en las faldas de los Farallones del Citará, en Andes. Aquí, el aire frío de la montaña y la pureza del río Tapartó nutren los granos que hoy llegan a tu mesa. Recorremos cada vereda, desde Santa Rita hasta Tapartó, buscando la esencia de la montaña.
                        </p>
                        <p style={{ color: '#9ca3af', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '32px' }}>
                            En Andes, el café no es solo un cultivo, es un lenguaje. Trabajamos mano a mano con familias que han perfeccionado su labor por más de un siglo, fusionando la sabiduría ancestral con procesos de especialidad que resaltan notas cítricas y dulces imposibles de replicar.
                        </p>

                        {/* Stats */}
                        <div style={{ display: 'flex', gap: '48px' }}>
                            <div>
                                <p style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ffc107', marginBottom: '4px' }}>120+</p>
                                <p style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '0.15em', opacity: 0.4 }}>Fincas Productoras</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ffc107', marginBottom: '4px' }}>88+</p>
                                <p style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '0.15em', opacity: 0.4 }}>Puntos en Taza SCA</p>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* Values Section */}
                <section style={{
                    padding: '64px 24px', background: 'rgba(255,255,255,0.03)',
                    borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)',
                    position: 'relative', overflow: 'hidden', marginBottom: '80px',
                }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', background: 'rgba(42,157,124,0.05)', filter: 'blur(100px)' }} />

                    <div style={{ position: 'relative', zIndex: 10 }}>
                        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, fontStyle: 'italic', lineHeight: 1.05 }}>
                                Identidad <br /> <span style={{ color: 'var(--color-brand-primary)' }}>Andina.</span>
                            </h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
                            {[
                                { icon: <ShieldCheck size={40} />, title: "Origen Protegido", desc: "Cada gramo proviene exclusivamente de las tierras altas de Andes, garantizando sabor de origen único." },
                                { icon: <Leaf size={40} />, title: "Cura del Citará", desc: "Cultivamos bajo sombra natural, respetando la biodiversidad de nuestra reserva forestal." },
                                { icon: <Users size={40} />, title: "Legado Familiar", desc: "Honramos el trabajo de los 'andinos' devolviendo el valor justo por su maestría cafetera." }
                            ].map((value, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ y: -8 }}
                                    style={{
                                        background: 'rgba(19, 31, 28, 0.85)', backdropFilter: 'blur(20px)',
                                        padding: '40px 28px', borderRadius: '24px',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                                        textAlign: 'center',
                                    }}
                                >
                                    <div style={{ color: 'var(--color-brand-primary)', marginBottom: '20px', display: 'inline-block' }}>
                                        {value.icon}
                                    </div>
                                    <h4 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '12px', fontStyle: 'italic' }}>
                                        {value.title}
                                    </h4>
                                    <p style={{ color: '#9ca3af', lineHeight: 1.6, fontSize: '0.85rem', opacity: 0.7 }}>
                                        {value.desc}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Location Section */}
                <section style={{ textAlign: 'center', padding: '60px 0' }}>
                    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <div style={{
                            width: '72px', height: '72px', background: 'rgba(42,157,124,0.1)',
                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 24px auto', border: '1px solid rgba(42,157,124,0.2)',
                        }}>
                            <MapPin size={32} style={{ color: 'var(--color-brand-primary)' }} />
                        </div>

                        <h3 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, marginBottom: '20px', fontStyle: 'italic', lineHeight: 1.05 }}>
                            Desde <br /> <span style={{ color: '#ffc107' }}>Andes.</span>
                        </h3>
                        <p style={{ color: '#9ca3af', marginBottom: '40px', fontSize: '0.95rem', lineHeight: 1.7, textAlign: 'center' }}>
                            Nuestra central de acopio y tostión opera desde el corazón de Andes, Antioquia. El punto donde la tradición de la 'chapolera' y el catador profesional se encuentran para crear magia.
                        </p>

                        {/* Altitude card */}
                        <div style={{
                            padding: '2px', borderRadius: '24px',
                            background: 'linear-gradient(135deg, rgba(42,157,124,0.2), transparent, rgba(199,73,56,0.2))',
                        }}>
                            <div style={{
                                background: '#1a2c28', borderRadius: '22px',
                                padding: '40px 24px', border: '1px solid rgba(255,255,255,0.05)',
                                textAlign: 'center',
                            }}>
                                <span style={{ display: 'block', color: '#ffc107', fontWeight: 900, letterSpacing: '0.4em', fontSize: '10px', textTransform: 'uppercase' as const, marginBottom: '12px' }}>
                                    Zonas de Altura
                                </span>
                                <p style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, fontStyle: 'italic', lineHeight: 1, marginBottom: '8px' }}>
                                    1,600 — 2,000 <span style={{ fontSize: '1rem', fontStyle: 'normal', opacity: 0.4 }}>msnm</span>
                                </p>
                                <p style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '0.15em', opacity: 0.4 }}>
                                    Santa Rita • Tapartó • San José • Buenos Aires
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

            </main>
        </div>
    )
}
