'use client'

import React from 'react';
import { Navbar } from '@/components/Navbar';
import { motion } from 'framer-motion';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background-dark text-white font-sans">
            <Navbar />
            <main className="max-w-4xl mx-auto px-6 py-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-4xl font-black mb-8 border-b border-brand-primary/20 pb-4">
                        Condiciones del <span className="text-brand-primary">Servicio</span>
                    </h1>

                    <div className="space-y-6 text-gray-300 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-white mb-3 uppercase tracking-wider">1. Aceptación de Términos</h2>
                            <p>Al acceder y utilizar este sitio web, usted acepta estar sujeto a los términos y condiciones aquí descritos.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3 uppercase tracking-wider">2. Productos y Envíos</h2>
                            <p>Café Suroeste se compromete a entregar café de especialidad de alta calidad. Los tiempos de envío pueden variar según la ubicación en Antioquia o el resto del país.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3 uppercase tracking-wider">3. Pagos</h2>
                            <p>Todos los pagos se procesan de forma segura. El usuario es responsable de proporcionar información de pago precisa.</p>
                        </section>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
