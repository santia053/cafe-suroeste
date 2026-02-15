'use client'

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { ArrowRight, Coffee, ShoppingBag } from 'lucide-react';
import { ImageSequence } from '@/components/ImageSequence';

export default function Home() {
  return (
    <div style={{ background: '#131f1c', color: '#fff', height: '100vh', width: '100%', overflow: 'hidden', position: 'relative' }}>
      {/* Background Image & Overlay */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <ImageSequence
          folder="timelapsehome"
          prefix="Cinematic_timelapse_of_1080p_202602132045_"
          totalFrames={80}
          extension="jpg"
          fps={12}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.7 }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.2), rgba(19,31,28,0.95))' }} />
      </div>

      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'flex-end', padding: '0 24px 48px 24px' }}>

        {/* Hero Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ width: '100%', maxWidth: '600px', margin: '0 auto', textAlign: 'center', marginBottom: '40px' }}
        >
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.4em', fontWeight: 700, color: 'var(--color-brand-primary)', textTransform: 'uppercase' as const, marginBottom: '16px' }}>
            Café Especial del Suroeste
          </p>
          <h1 style={{ fontSize: 'clamp(2.5rem, 7vw, 4.5rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', textShadow: '0 4px 30px rgba(0,0,0,0.4)', marginBottom: '20px', fontStyle: 'italic' }}>
            Origen<br />y Alma.
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#d1d5db', fontWeight: 500, maxWidth: '360px', margin: '0 auto', lineHeight: 1.7, textShadow: '0 2px 10px rgba(0,0,0,0.4)', textAlign: 'center' }}>
            Descubre el sabor auténtico de las montañas de Antioquia en cada taza.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ display: 'flex', gap: '12px', justifyContent: 'center', width: '100%', maxWidth: '420px', margin: '0 auto' }}
        >
          <Link href="/catalog" style={{
            flex: 1, padding: '16px 20px',
            background: 'var(--color-brand-primary)', color: '#fff',
            borderRadius: '14px', textDecoration: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase' as const,
            boxShadow: '0 10px 30px rgba(42,157,124,0.3)',
          }}>
            <Coffee size={18} />
            Comprar Café
          </Link>
          <Link href="/subscriptions" style={{
            flex: 1, padding: '16px 20px',
            background: 'rgba(255,255,255,0.1)', color: '#fff',
            borderRadius: '14px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase' as const,
            backdropFilter: 'blur(10px)',
          }}>
            <ShoppingBag size={18} />
            Suscripciones
          </Link>
        </motion.div>

        {/* Footer badge */}
        <div style={{ marginTop: '32px', textAlign: 'center', opacity: 0.3, fontSize: '9px', letterSpacing: '0.25em', fontWeight: 600, textTransform: 'uppercase' as const }}>
          Hecho con ♥ en Antioquia
        </div>
      </div>
    </div>
  );
}
