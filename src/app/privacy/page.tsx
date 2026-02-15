'use client'

import React from 'react';
import { Navbar } from '@/components/Navbar';
import { motion } from 'framer-motion';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background-dark text-white font-sans">
            <Navbar />
            <main className="max-w-4xl mx-auto px-6 py-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-4xl font-black mb-8 border-b border-brand-primary/20 pb-4">
                        Política de <span className="text-brand-primary">Privacidad</span>
                    </h1>

                    <div className="space-y-6 text-gray-300 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-white mb-3 uppercase tracking-wider">1. Recopilación de Información</h2>
                            <p>En Café Suroeste, recopilamos información personal básica como nombre, correo electrónico y dirección de envío únicamente para procesar sus pedidos y mejorar su experiencia de usuario.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3 uppercase tracking-wider">2. Uso de los Datos</h2>
                            <p>Sus datos son utilizados exclusivamente para la gestión de su cuenta, procesamiento de pagos certificados a través de nuestra plataforma y el envío de nuestros productos de café especial.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3 uppercase tracking-wider">3. Seguridad</h2>
                            <p>Implementamos medidas de seguridad avanzadas y cifrado SSL para proteger su información. No compartimos sus datos con terceros con fines comerciales.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3 uppercase tracking-wider">4. Cookies</h2>
                            <p>Utilizamos cookies para mantener su sesión activa y recordar sus preferencias de compra.</p>
                        </section>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
