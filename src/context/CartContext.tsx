'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Product } from '@/lib/mock-data'

export interface CartItem extends Product {
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    addItem: (product: Product) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    syncPrices: (updates: { id: string, price: number }[]) => void;
    totalItems: number;
    totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<CartItem[]>([])
    const [isLoaded, setIsLoaded] = useState(false)

    // Load cart from localStorage
    useEffect(() => {
        const savedCart = localStorage.getItem('cart')
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart))
            } catch (e) {
                console.error('Failed to parse cart', e)
            }
        }
        setIsLoaded(true)
    }, [])

    // Save cart to localStorage
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('cart', JSON.stringify(items))
        }
    }, [items, isLoaded])

    const isSubscription = (id: string) =>
        id.includes('0000-0000') || id.startsWith('plan-')

    const addItem = (product: Product) => {
        // Safety check: Don't add if out of stock
        if (product.status === 'Agotado' || product.stock <= 0) {
            console.warn(`Attempted to add out-of-stock product: ${product.name}`)
            return
        }

        setItems(prev => {
            // If adding a subscription, remove any other subscription first
            if (isSubscription(product.id)) {
                const withoutSubs = prev.filter(item => !isSubscription(item.id))
                return [...withoutSubs, { ...product, quantity: 1 }]
            }

            const existing = prev.find(item => item.id === product.id)
            if (existing) {
                return prev.map(item =>
                    item.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } : item
                )
            }
            return [...prev, { ...product, quantity: 1 }]
        })
    }

    const removeItem = (productId: string) => {
        setItems(prev => prev.filter(item => item.id !== productId))
    }

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeItem(productId)
            return
        }
        // Subscriptions always stay at quantity 1
        if (isSubscription(productId)) return
        setItems(prev =>
            prev.map(item => item.id === productId ? { ...item, quantity } : item)
        )
    }

    const clearCart = () => setItems([])

    const syncPrices = (updates: { id: string, price: number }[]) => {
        setItems(prev => prev.map(item => {
            const update = updates.find(u => u.id === item.id)
            if (update && update.price !== item.price) {
                return { ...item, price: update.price }
            }
            return item
        }))
    }

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
    const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    return (
        <CartContext.Provider value={{
            items,
            addItem,
            removeItem,
            updateQuantity,
            clearCart,
            syncPrices, // New method
            totalItems,
            totalPrice
        }}>
            {children}
        </CartContext.Provider>
    )
}

export const useCart = () => {
    const context = useContext(CartContext)
    if (!context) throw new Error('useCart must be used within CartProvider')
    return context
}
