'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Package, Users, ShoppingBag, TrendingUp, Plus, Search,
    Edit, Trash2, Coffee, MapPin, DollarSign, BarChart3,
    ArrowUpRight, ArrowDownRight, X, Save, Upload, ImageIcon, Loader2,
    Phone, User, Truck, Check
} from 'lucide-react'
import { MOCK_PRODUCTS, Product } from '@/lib/mock-data'
import { Navbar } from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const emptyProduct = {
    name: '',
    variety: '',
    process: 'Lavado',
    roast_level: 'Media',
    description: '',
    price: 0,
    stock: 0,
    farm: '',
    municipality: '',
    altitude: 1800,
    tasting_notes: '',
    status: 'Activo',
    image_url: '',
    gramaje: 340,
    is_published: true,
}

export default function AdminDashboard() {
    console.log('Admin Dashboard v2.0 Loaded')
    const [activeTab, setActiveTab] = useState('products')
    const [searchQuery, setSearchQuery] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [products, setProducts] = useState<Product[]>([])
    const [orders, setOrders] = useState<any[]>([])
    const [customers, setCustomers] = useState<any[]>([])
    const [subscriptions, setSubscriptions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState({ ...emptyProduct })
    const [selectedStat, setSelectedStat] = useState<string | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadStatus, setUploadStatus] = useState<'compressing' | 'uploading' | null>(null)
    const [selectedOrder, setSelectedOrder] = useState<any>(null)
    const [showOrderDetails, setShowOrderDetails] = useState(false)
    const [plans, setPlans] = useState<any[]>([])
    const [editingPlan, setEditingPlan] = useState<any>(null)
    const [showPlanModal, setShowPlanModal] = useState(false)
    const { isAdmin, loading: authLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!authLoading && !isAdmin) {
            router.push('/')
        }
    }, [isAdmin, authLoading, router])

    useEffect(() => {
        if (isAdmin) {
            fetchAllData()

            // Realtime subscription for Plans
            const plansChannel = supabase
                .channel('admin:subscription_plans')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'subscription_plans' }, (payload) => {
                    console.log('Realtime plan update received:', payload)
                    fetchPlans() // Refresh plans on any change
                })
                .subscribe()

            return () => {
                supabase.removeChannel(plansChannel)
            }
        }
    }, [isAdmin])

    const fetchAllData = async () => {
        console.log('Starting fetchAllData (Sequential)...')
        setLoading(true)

        // Safety timeout to ensure loading doesn't stick forever
        const timeoutId = setTimeout(() => {
            console.warn('fetchAllData timed out - forcing loading false')
            setLoading(false)
        }, 10000)

        try {
            console.log('Fetching products...')
            await fetchProducts()
            console.log('Products fetched.')

            console.log('Fetching orders...')
            await fetchOrders()
            console.log('Orders fetched.')

            console.log('Fetching customers...')
            await fetchCustomers()
            console.log('Customers fetched.')

            console.log('Fetching subscriptions...')
            await fetchSubscriptions()
            console.log('Subscriptions fetched.')

            console.log('Fetching plans...')
            await fetchPlans()
            console.log('Plans fetched.')

            console.log('fetchAllData completed successfully')
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
            toast.error('Error al cargar datos del dashboard')
        } finally {
            clearTimeout(timeoutId)
            console.log('Setting loading to false')
            setLoading(false)
        }
    }

    const fetchProducts = async () => {
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
        if (error) {
            console.error('Error fetching products:', error)
            return
        }
        if (data) setProducts(data.map(p => ({
            id: p.id,
            name: p.name,
            origin: { farm: p.origin_farm, municipality: p.origin_municipality, altitude: p.origin_altitude },
            variety: p.variety,
            process: p.process,
            roast_level: p.roast_level,
            tasting_notes: p.tasting_notes || [],
            description: p.description,
            price: p.price,
            stock: p.stock,
            image_url: p.image_url,
            gramaje: p.gramaje || 340,
            status: p.status || 'Activo',
            is_published: p.is_published ?? true
        })))
    }

    const fetchOrders = async () => {
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .order('created_at', { ascending: false })
        if (error) {
            console.error('Error fetching orders:', error)
            return
        }
        if (data) setOrders(data)
    }

    const fetchCustomers = async () => {
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
        if (error) {
            console.error('Error fetching customers:', error)
            return
        }
        if (data) setCustomers(data)
    }

    const fetchSubscriptions = async () => {
        const { data, error } = await supabase
            .from('subscriptions')
            .select(`
                *,
                profiles (full_name),
                subscription_plans!subscriptions_plan_id_fkey (name, price_monthly, bags_count)
            `)
            .order('created_at', { ascending: false })
        if (error) {
            console.error('Error fetching subscriptions:', error)
            return
        }
        if (data) setSubscriptions(data)
    }

    const fetchPlans = async () => {
        try {
            const { data, error } = await supabase
                .from('subscription_plans')
                .select('*')
                .order('price_monthly', { ascending: true })
            if (error) {
                console.error('Error fetching plans:', error)
                return
            }
            if (data) setPlans(data)
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('Fetch plans aborted')
            } else {
                console.error('Unexpected error fetching plans:', error)
            }
        }
    }

    const handleUpdatePlan = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingPlan) return

        try {
            // Convert features string to array if it's a string (from textarea)
            let featuresArray = editingPlan.features
            if (typeof editingPlan.features === 'string') {
                featuresArray = editingPlan.features.split('\n').filter((f: string) => f.trim() !== '')
            }

            // Senior Developer Fix: Use atomic RPC update (v2)
            const { error } = await supabase.rpc('update_plan_v2', {
                p_id: editingPlan.id,
                p_name: editingPlan.name,
                p_price: editingPlan.price_monthly,
                p_features: featuresArray,
                p_description: editingPlan.description,
                p_is_active: editingPlan.is_active,
                p_is_popular: editingPlan.is_popular
            })

            if (error) throw error

            toast.success('Plan actualizado correctamente')
            setShowPlanModal(false)
            fetchPlans()
        } catch (error: any) {
            console.error('Error updating plan:', error)
            toast.error(`Error al actualizar: ${error.message || 'Error desconocido'}`)
        }
    }

    const formatTimeAgo = (dateStr: string) => {
        try {
            const date = new Date(dateStr)
            const now = new Date()
            const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

            if (diffInSeconds < 0) return 'En el futuro'
            if (diffInSeconds < 60) return 'Ahora mismo'
            if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`

            const isToday = date.toDateString() === now.toDateString()
            if (isToday) {
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }

            const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString()
            if (isYesterday) return 'Ayer'

            return date.toLocaleDateString([], { day: 'numeric', month: 'short' })
        } catch (e) {
            return 'Fecha inválida'
        }
    }

    // --- Dynamic Calculations ---
    const stats = useMemo(() => [
        {
            id: 'ventas',
            label: 'Ventas Totales',
            value: `$${orders.reduce((acc, o) => acc + (o.payment_status === 'APPROVED' ? o.total_amount : 0), 0).toLocaleString()}`,
            icon: <DollarSign size={18} />,
            trend: orders.length > 0 ? '+100%' : '0%', // Simplified trend
            up: true
        },
        {
            id: 'pedidos',
            label: 'Pedidos Totales',
            value: orders.length.toString(),
            icon: <ShoppingBag size={18} />,
            trend: orders.length.toString(),
            up: true
        },
        {
            id: 'clientes',
            label: 'Clientes',
            value: customers.length.toString(),
            icon: <Users size={18} />,
            trend: customers.length.toString(),
            up: true
        },
        {
            id: 'stock',
            label: 'Stock Bajo',
            value: products.filter(p => p.stock < 15).length.toString(),
            icon: <Package size={18} />,
            trend: 'Alerta',
            up: false
        },
    ], [orders, customers, products])

    const recentSales = useMemo(() => orders.slice(0, 8).map(o => ({
        customer: (o.customer_email || 'Cliente').split('@')[0],
        product: o.order_items?.[0]?.product_name || 'Pedido',
        amount: `$${o.total_amount.toLocaleString()}`,
        time: formatTimeAgo(o.created_at)
    })), [orders])

    const todayTotal = useMemo(() => {
        const now = new Date()
        const todayStr = now.toDateString()
        return orders
            .filter(o => {
                const oDate = new Date(o.created_at)
                return oDate.toDateString() === todayStr && o.payment_status === 'APPROVED'
            })
            .reduce((sum, o) => sum + o.total_amount, 0)
    }, [orders])

    const dailySales = useMemo(() => {
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
        const now = new Date()
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date()
            d.setDate(now.getDate() - (6 - i))
            return {
                day: days[d.getDay()],
                date: d.toISOString().split('T')[0],
                amount: 0,
                orders: 0
            }
        })

        orders.forEach(o => {
            const oDate = new Date(o.created_at).toISOString().split('T')[0]
            const dayBucket = last7Days.find(d => d.date === oDate)
            if (dayBucket && o.payment_status === 'APPROVED') {
                dayBucket.amount += o.total_amount
                dayBucket.orders += 1
            }
        })

        return last7Days
    }, [orders])

    const maxSale = Math.max(...dailySales.map(d => d.amount), 1)
    const bestDay = useMemo(() => {
        const best = [...dailySales].sort((a, b) => b.amount - a.amount)[0]
        const fullDays: { [key: string]: string } = {
            'Dom': 'Domingo', 'Lun': 'Lunes', 'Mar': 'Martes', 'Mié': 'Miércoles',
            'Jue': 'Jueves', 'Vie': 'Viernes', 'Sáb': 'Sábado'
        }
        return best.amount > 0 ? fullDays[best.day] : 'N/A'
    }, [dailySales])

    const todayOrders = useMemo(() => {
        const now = new Date()
        const todayStr = now.toDateString()
        return orders
            .filter(o => new Date(o.created_at).toDateString() === todayStr)
            .map(o => ({
                id: `#${(o.id || '').substring(0, 5).toUpperCase()}`,
                client: (o.customer_email || 'Cliente').split('@')[0],
                items: o.order_items?.map((i: any) => `${i.product_name || 'Producto'} x${i.quantity || 1}`).join(', ') || 'Sin items',
                total: `$${(o.total_amount || 0).toLocaleString()}`,
                status: o.order_status || 'RECIBIDO',
                statusColor: o.order_status === 'ENTREGADO' ? '#22c55e' :
                    o.order_status === 'CANCELADO' ? '#ef4444' :
                        o.order_status === 'EN_CAMINO' ? '#3b82f6' : '#f59e0b',
                time: o.created_at ? new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00'
            }))
    }, [orders])

    const todayStats = useMemo(() => {
        return [
            { label: 'Entregados', v: todayOrders.filter(o => o.status === 'ENTREGADO').length, c: '#22c55e' },
            { label: 'Recibidos', v: todayOrders.filter(o => o.status === 'RECIBIDO').length, c: '#3182ce' },
            { label: 'En camino', v: todayOrders.filter(o => o.status === 'EN_CAMINO').length, c: '#f59e0b' }
        ]
    }, [todayOrders])

    const allCustomers = useMemo(() => {
        // 1. Registered users from profiles
        const registered = customers.map(c => {
            const userOrders = orders.filter(o => o.user_id === c.id)
            const userSub = subscriptions.find(s => s.user_id === c.id && s.status === 'ACTIVE')
            const totalSpent = userOrders.reduce((sum, o) => sum + (o.payment_status === 'APPROVED' ? o.total_amount : 0), 0)
            return {
                id: c.id,
                name: c.full_name || (c.email || 'Cliente').split('@')[0],
                initial: (c.full_name || 'U').charAt(0),
                email: c.email || 'N/A',
                orders: userOrders.length,
                total: `$${totalSpent.toLocaleString()}`,
                sub: userSub ? 'Suscriptor' : 'Registrado',
                subActive: !!userSub,
                since: c.created_at || new Date().toISOString(),
                type: userSub ? 'subscriber' : 'registered'
            }
        })

        // 2. Guest buyers (orders with no user_id)
        const guestOrders = orders.filter(o => !o.user_id)
        const guestMap = new Map<string, any>()
        guestOrders.forEach(o => {
            const email = o.customer_email || 'invitado@desconocido.com'
            const existing = guestMap.get(email)
            const amount = o.payment_status === 'APPROVED' ? o.total_amount : 0
            if (existing) {
                existing.orders += 1
                existing.total = `$${(parseInt(existing.total.replace(/[$,]/g, '')) + amount).toLocaleString()}`
            } else {
                guestMap.set(email, {
                    id: `guest-${email}`,
                    name: o.shipping_address?.name || email.split('@')[0],
                    initial: (o.shipping_address?.name || email).charAt(0).toUpperCase(),
                    email: email,
                    orders: 1,
                    total: `$${amount.toLocaleString()}`,
                    sub: 'Invitado',
                    subActive: false,
                    since: o.created_at || new Date().toISOString(),
                    type: 'guest'
                })
            }
        })

        return [...registered, ...Array.from(guestMap.values())]
    }, [customers, orders, subscriptions])

    const allSubscriptionsList = useMemo(() => subscriptions.map(s => {
        const statusMap: Record<string, { label: string, color: string }> = {
            'ACTIVE': { label: 'ACTIVA', color: '#22c55e' },
            'PAUSED': { label: 'PAUSADA', color: '#eab308' },
            'CANCELLED': { label: 'CANCELADA', color: '#ef4444' },
            'EXPIRED': { label: 'EXPIRADA', color: '#6b7280' },
        }
        const statusInfo = statusMap[s.status] || { label: s.status || 'INACTIVA', color: '#6b7280' }
        return {
            id: s.id,
            client: s.profiles?.full_name || (s.profiles?.email || 'Cliente').split('@')[0],
            email: s.profiles?.email || 'N/A',
            plan: s.subscription_plans?.name || 'Plan Estándar',
            status: statusInfo.label,
            statusColor: statusInfo.color,
            startDate: s.start_date || s.created_at?.split('T')[0] || 'N/A',
            nextBilling: s.next_billing_date || 'N/A',
            created: s.created_at || new Date().toISOString()
        }
    }), [subscriptions])

    const lowStockProducts = useMemo(() => products.filter(p => p.stock < 30).sort((a: any, b: any) => a.stock - b.stock), [products])

    const allOrdersList = useMemo(() => orders.map(o => {
        const isSubscription = o.order_items?.some((i: any) =>
            (i.product_name || '').toLowerCase().includes('suscripción') ||
            (i.product_name || '').toLowerCase().includes('plan')
        )
        return {
            id: o.id || '',
            client: (o.customer_email || 'Cliente').split('@')[0],
            email: o.customer_email || 'N/A',
            items: o.order_items?.map((i: any) => `${i.product_name || 'Producto'} x${i.quantity || 1}`).join(', ') || 'Sin items',
            itemsRaw: o.order_items || [],
            total: `$${(o.total_amount || 0).toLocaleString()}`,
            status: o.order_status || 'RECIBIDO',
            statusColor: o.order_status === 'ENTREGADO' ? '#22c55e' :
                o.order_status === 'CANCELADO' ? '#ef4444' :
                    o.order_status === 'EN_CAMINO' ? '#3b82f6' : '#f59e0b',
            paymentStatus: o.payment_status || 'PENDING',
            shippingAddress: o.shipping_address || {},
            isSubscription: !!isSubscription,
            date: o.created_at || new Date().toISOString()
        }
    }), [orders])

    const exportToExcel = () => {
        const headers = ['ID Pedido', 'Cliente', 'Email', 'Productos', 'Total', 'Estado', 'Fecha']
        const csvRows = [
            headers.join(','),
            ...allOrdersList.map(o => [
                o.id,
                o.client,
                o.email,
                `"${o.items}"`,
                o.total.replace('$', '').replace(',', ''),
                o.status,
                o.date
            ].join(','))
        ]

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `pedidos_cafe_origen_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success('Excel exportado correctamente')
    }

    const q = (searchQuery || '').toLowerCase()
    const filteredProducts = products.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.origin?.municipality || '').toLowerCase().includes(q) ||
        (p.variety || '').toLowerCase().includes(q)
    )
    const filteredOrders = allOrdersList.filter(o =>
        (o.email || '').toLowerCase().includes(q) ||
        (o.id || '').toLowerCase().includes(q) ||
        (o.status || '').toLowerCase().includes(q) ||
        (o.client || '').toLowerCase().includes(q)
    )
    const filteredCustomers = allCustomers.filter(c =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.sub || '').toLowerCase().includes(q)
    )
    const filteredSubscriptions = allSubscriptionsList.filter(s =>
        (s.client || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.plan || '').toLowerCase().includes(q)
    )

    const openNewProduct = () => {
        setForm({ ...emptyProduct })
        setEditingId(null)
        setImagePreview(null)
        setShowModal(true)
    }

    const openEditProduct = (product: Product) => {
        setForm({
            name: product.name,
            variety: product.variety,
            process: product.process,
            roast_level: product.roast_level,
            description: product.description,
            price: product.price,
            stock: product.stock,
            farm: product.origin.farm,
            municipality: product.origin.municipality,
            altitude: product.origin.altitude,
            tasting_notes: product.tasting_notes.join(', '),
            status: product.status || 'Activo',
            image_url: product.image_url || '',
            gramaje: product.gramaje || 340,
            is_published: product.is_published ?? true,
        })
        setImagePreview(product.image_url || null)
        setEditingId(product.id)
        setShowModal(true)
    }

    const handleSave = async () => {
        // Auto-status logic: if stock is 0 and not paused, it's exhausted.
        let finalStatus = form.status;
        const stockNum = Number(form.stock);
        if (stockNum <= 0 && finalStatus !== 'Pausado') {
            finalStatus = 'Agotado';
        }

        const productData = {
            name: form.name,
            origin_farm: form.farm,
            origin_municipality: form.municipality,
            origin_altitude: form.altitude,
            variety: form.variety,
            process: form.process,
            roast_level: form.roast_level,
            tasting_notes: Array.isArray(form.tasting_notes)
                ? form.tasting_notes
                : typeof form.tasting_notes === 'string'
                    ? form.tasting_notes.split(',').map(n => n.trim()).filter(Boolean)
                    : [],
            description: form.description,
            price: Number(form.price),
            stock: stockNum,
            image_url: form.image_url || imagePreview || '/products/placeholder.jpg',
            gramaje: Number(form.gramaje),
            status: finalStatus,
            is_published: finalStatus !== 'Pausado'
        }

        try {
            if (editingId) {
                const { error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', editingId)

                if (error) throw error
                toast.success('Producto actualizado correctamente')
            } else {
                const { error } = await supabase
                    .from('products')
                    .insert([productData])

                if (error) throw error
                toast.success('Producto creado correctamente')
            }

            await fetchProducts()
            setShowModal(false)
            setForm({ ...emptyProduct })
            setEditingId(null)
            setImagePreview(null)
        } catch (error: any) {
            console.error('Error saving product:', error)
            toast.error('Error al guardar: ' + (error.message || 'Error desconocido'))
        }
    }

    const handleDelete = async (id: string) => {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)

        if (error) {
            toast.error('Error al eliminar producto: ' + error.message)
        } else {
            toast.success('Producto eliminado')
            fetchProducts()
        }
    }

    const handleUpdatePaymentStatus = async (orderId: string, status: string) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ payment_status: status })
                .eq('id', orderId)

            if (error) throw error
            toast.success('Estado de pago actualizado')
            fetchOrders()
        } catch (error: any) {
            toast.error('Error al actualizar pago: ' + error.message)
        }
    }

    const handleUpdateOrderStatus = async (orderId: string, status: string) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ order_status: status })
                .eq('id', orderId)

            if (error) throw error
            toast.success('Estado del pedido actualizado')
            fetchOrders()
        } catch (error: any) {
            toast.error('Error al actualizar pedido: ' + error.message)
        }
    }

    const updateField = (field: string, value: string | number) => {
        setForm(prev => {
            const newForm = { ...prev, [field]: value };

            // Auto-update status based on stock
            if (field === 'stock') {
                const stockVal = Number(value);
                if (stockVal <= 0 && prev.status !== 'Pausado') {
                    newForm.status = 'Agotado';
                } else if (stockVal > 0 && prev.status === 'Agotado') {
                    newForm.status = 'Activo';
                }
            }
            return newForm;
        });
    }

    const compressImage = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = (event) => {
                const img = new Image()
                img.src = event.target?.result as string
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const MAX_WIDTH = 1200
                    const MAX_HEIGHT = 1200
                    let width = img.width
                    let height = img.height

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width
                            width = MAX_WIDTH
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height
                            height = MAX_HEIGHT
                        }
                    }

                    canvas.width = width
                    canvas.height = height
                    const ctx = canvas.getContext('2d')
                    ctx?.drawImage(img, 0, 0, width, height)

                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob)
                        else reject(new Error('Canvas to Blob failed'))
                    }, 'image/jpeg', 0.8)
                }
                img.onerror = reject
            }
            reader.onerror = reject
        })
    }

    const handleImageUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) return

        // Show local preview immediately
        const reader = new FileReader()
        reader.onload = (e) => setImagePreview(e.target?.result as string)
        reader.readAsDataURL(file)

        setIsUploading(true)
        setUploadStatus('compressing')

        try {
            // Compress image before upload
            const compressedBlob = await compressImage(file)
            const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' })

            setUploadStatus('uploading')

            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.jpg`
            const filePath = `${fileName}`

            const { data, error } = await supabase.storage
                .from('product-images')
                .upload(filePath, compressedFile)

            if (error) throw error

            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath)

            setForm(prev => ({ ...prev, image_url: publicUrl }))
        } catch (error: any) {
            alert('Error al subir imagen: ' + error.message)
        } finally {
            setIsUploading(false)
            setUploadStatus(null)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) handleImageUpload(file)
    }

    // Input style reusable
    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '12px 14px', borderRadius: '10px',
        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
        color: '#fff', fontSize: '0.85rem', outline: 'none',
    }
    const labelStyle: React.CSSProperties = {
        display: 'block', fontSize: '10px', fontWeight: 700,
        textTransform: 'uppercase' as const, letterSpacing: '0.12em',
        color: '#6b7280', marginBottom: '6px',
    }


    if (authLoading || !isAdmin) {
        return (
            <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-4">
                <Loader2 className="w-12 h-12 text-brand-primary animate-spin mb-4" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Validando Credenciales...</p>
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', background: '#131f1c', color: '#fff' }}>
            <Navbar />

            <div style={{ padding: '80px 24px 40px' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

                    {/* Page Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <span style={{ display: 'block', color: 'var(--color-brand-primary)', fontWeight: 800, fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase' as const, marginBottom: '8px' }}>
                                Administración
                            </span>
                            <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 900, fontStyle: 'italic' }}>
                                Panel de Control
                            </h1>
                        </div>
                        <button
                            onClick={openNewProduct}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '12px 20px', borderRadius: '12px',
                                background: 'var(--color-brand-primary)', color: '#fff', border: 'none',
                                fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                                cursor: 'pointer', boxShadow: '0 8px 25px rgba(42,157,124,0.25)',
                            }}
                        >
                            <Plus size={16} /> Nuevo Producto
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                        {stats.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.05 }}
                                onClick={() => setSelectedStat(selectedStat === stat.id ? null : stat.id)}
                                style={{
                                    background: selectedStat === stat.id ? '#1f3832' : '#1a2c28', borderRadius: '16px',
                                    padding: '20px', border: selectedStat === stat.id ? '1px solid rgba(42,157,124,0.3)' : '1px solid rgba(255,255,255,0.05)',
                                    cursor: 'pointer', transition: 'all 0.2s ease',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '10px',
                                        background: 'rgba(42,157,124,0.1)', color: 'var(--color-brand-primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        {stat.icon}
                                    </div>
                                    <span style={{
                                        fontSize: '10px', fontWeight: 800, padding: '4px 8px', borderRadius: '6px',
                                        display: 'flex', alignItems: 'center', gap: '2px',
                                        background: stat.up ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                                        color: stat.up ? '#22c55e' : '#ef4444',
                                        border: `1px solid ${stat.up ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                                    }}>
                                        {stat.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                        {stat.trend}
                                    </span>
                                </div>
                                <p style={{ fontSize: '9px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.15em', marginBottom: '4px' }}>
                                    {stat.label}
                                </p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{stat.value}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* ──── STAT DETAIL PANEL ──── */}
                    <AnimatePresence>
                        {selectedStat && (
                            <motion.div
                                key={selectedStat}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                style={{ overflow: 'hidden', marginBottom: '32px' }}
                            >
                                <div style={{
                                    background: '#1a2c28', borderRadius: '16px',
                                    border: '1px solid rgba(42,157,124,0.15)',
                                    padding: '24px', marginTop: '-16px',
                                }}>

                                    {/* ── VENTAS DEL MES ── */}
                                    {selectedStat === 'ventas' && (
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '4px' }}>Ventas de esta Semana</h3>
                                                    <p style={{ fontSize: '0.7rem', color: '#6b7280' }}>Ingresos diarios en COP</p>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <p style={{ fontSize: '0.7rem', color: '#6b7280' }}>Total semanal</p>
                                                    <p style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-brand-primary)' }}>${(dailySales.reduce((a, b) => a + b.amount, 0) / 1000000).toFixed(1)}M</p>
                                                </div>
                                            </div>
                                            {/* Bar Chart */}
                                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '160px', padding: '0 8px' }}>
                                                {dailySales.map((d, i) => (
                                                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#9ca3af' }}>
                                                            ${(d.amount / 1000000).toFixed(1)}M
                                                        </span>
                                                        <motion.div
                                                            initial={{ height: 0 }}
                                                            animate={{ height: `${(d.amount / maxSale) * 120}px` }}
                                                            transition={{ duration: 0.5, delay: i * 0.08 }}
                                                            style={{
                                                                width: '100%', borderRadius: '8px 8px 4px 4px',
                                                                background: i === 6 ? 'linear-gradient(to top, var(--color-brand-primary), #34d399)' : 'rgba(42,157,124,0.3)',
                                                                minHeight: '8px',
                                                            }}
                                                        />
                                                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280' }}>{d.day}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Summary Row */}
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div style={{ textAlign: 'center' }}>
                                                    <p style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '4px' }}>Promedio diario</p>
                                                    <p style={{ fontSize: '0.9rem', fontWeight: 800 }}>${(dailySales.reduce((a, b) => a + b.amount, 0) / 7 / 1000).toFixed(0)}K</p>
                                                </div>
                                                <div style={{ textAlign: 'center' }}>
                                                    <p style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '4px' }}>Mejor día</p>
                                                    <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-brand-primary)' }}>{bestDay}</p>
                                                </div>
                                                <div style={{ textAlign: 'center' }}>
                                                    <p style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '4px' }}>Total pedidos</p>
                                                    <p style={{ fontSize: '0.9rem', fontWeight: 800 }}>{dailySales.reduce((a, b) => a + b.orders, 0)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── PEDIDOS HOY ── */}
                                    {selectedStat === 'pedidos' && (
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '4px' }}>Pedidos de Hoy</h3>
                                                    <p style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                                        {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </p>
                                                </div>
                                                <div style={{ display: 'flex', gap: '16px' }}>
                                                    {todayStats.map((s, i) => (
                                                        <div key={i} style={{ textAlign: 'center' }}>
                                                            <p style={{ fontSize: '1.1rem', fontWeight: 900, color: s.c }}>{s.v}</p>
                                                            <p style={{ fontSize: '0.6rem', color: '#6b7280', fontWeight: 700 }}>{s.label}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {todayOrders.map((order) => (
                                                    <div key={order.id} style={{
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        padding: '14px 16px', borderRadius: '12px',
                                                        background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.03)',
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6b7280', minWidth: '60px' }}>{order.id}</span>
                                                            <div>
                                                                <p style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '2px' }}>{order.client}</p>
                                                                <p style={{ fontSize: '0.65rem', color: '#6b7280' }}>{order.items}</p>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                            <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>{order.time}</span>
                                                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffc107', minWidth: '80px', textAlign: 'right' }}>{order.total}</span>
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setActiveTab('orders')
                                                                    setSearchQuery(order.id.replace('#', ''))
                                                                    window.scrollTo({ top: 400, behavior: 'smooth' })
                                                                }}
                                                                style={{
                                                                    padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                                                                    background: 'rgba(255,255,255,0.05)', color: '#9ca3af',
                                                                    border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
                                                                    textTransform: 'uppercase'
                                                                }}
                                                            >
                                                                Detalles
                                                            </motion.button>
                                                            <span style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                                padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                                                                background: `${order.statusColor}15`, color: order.statusColor,
                                                                border: `1px solid ${order.statusColor}30`, minWidth: '85px', justifyContent: 'center',
                                                            }}>
                                                                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: order.statusColor }} />
                                                                {order.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* ── CLIENTES NUEVOS ── */}
                                    {selectedStat === 'clientes' && (
                                        <div>
                                            <div style={{ marginBottom: '20px' }}>
                                                <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '4px' }}>Clientes Nuevos este Mes</h3>
                                                <p style={{ fontSize: '0.7rem', color: '#6b7280' }}>Últimos registros</p>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {allCustomers.slice(0, 5).map((client, i) => (
                                                    <div key={i} style={{
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        padding: '14px 16px', borderRadius: '12px',
                                                        background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.03)',
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{
                                                                width: '38px', height: '38px', borderRadius: '10px',
                                                                background: 'rgba(42,157,124,0.15)', color: 'var(--color-brand-primary)',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontSize: '0.85rem', fontWeight: 800,
                                                            }}>
                                                                {client.initial}
                                                            </div>
                                                            <div>
                                                                <p style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '2px' }}>{client.name}</p>
                                                                <p style={{ fontSize: '0.65rem', color: '#6b7280' }}>{client.email}</p>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setActiveTab('customers')
                                                                    setSearchQuery(client.email)
                                                                    window.scrollTo({ top: 400, behavior: 'smooth' })
                                                                }}
                                                                style={{
                                                                    padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                                                                    background: 'rgba(42,157,124,0.1)', color: 'var(--color-brand-primary)',
                                                                    border: '1px solid rgba(42,157,124,0.2)',
                                                                    cursor: 'pointer',
                                                                    textTransform: 'uppercase'
                                                                }}
                                                            >
                                                                {client.sub}
                                                            </motion.button>
                                                            <span style={{ fontSize: '0.7rem', color: '#6b7280', minWidth: '55px', textAlign: 'right' }}>
                                                                {formatTimeAgo(client.since)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* ── STOCK BAJO ── */}
                                    {selectedStat === 'stock' && (
                                        <div>
                                            <div style={{ marginBottom: '20px' }}>
                                                <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '4px' }}>Productos con Stock Bajo</h3>
                                                <p style={{ fontSize: '0.7rem', color: '#6b7280' }}>Productos con menos de 30 unidades</p>
                                            </div>
                                            {lowStockProducts.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                                                    <Package size={32} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                                                    <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>¡Todos los productos tienen buen stock!</p>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {lowStockProducts.map((product) => (
                                                        <div key={product.id} style={{
                                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                            padding: '14px 16px', borderRadius: '12px',
                                                            background: 'rgba(0,0,0,0.15)',
                                                            border: product.stock < 10 ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(245,158,11,0.15)',
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                <div style={{
                                                                    width: '40px', height: '40px', borderRadius: '10px',
                                                                    background: product.stock < 10 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                }}>
                                                                    <Coffee size={18} style={{ color: product.stock < 10 ? '#ef4444' : '#f59e0b' }} />
                                                                </div>
                                                                <div>
                                                                    <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '2px' }}>{product.name}</p>
                                                                    <p style={{ fontSize: '0.65rem', color: '#6b7280' }}>{product.origin.municipality} • {product.variety}</p>
                                                                </div>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                                {/* Stock bar */}
                                                                <div style={{ width: '80px' }}>
                                                                    <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                                                        <div style={{
                                                                            width: `${Math.min((product.stock / 50) * 100, 100)}%`, height: '100%', borderRadius: '3px',
                                                                            background: product.stock < 10 ? '#ef4444' : product.stock < 20 ? '#f59e0b' : 'var(--color-brand-primary)',
                                                                        }} />
                                                                    </div>
                                                                </div>
                                                                <span style={{
                                                                    fontSize: '0.9rem', fontWeight: 900, minWidth: '40px', textAlign: 'right',
                                                                    color: product.stock < 10 ? '#ef4444' : product.stock < 20 ? '#f59e0b' : '#9ca3af',
                                                                }}>
                                                                    {product.stock}u
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Two Column Layout */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}
                        className="lg:!grid-cols-[320px_1fr]"
                    >
                        {/* Recent Sales Sidebar */}
                        <div style={{
                            background: '#1a2c28', borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.05)', padding: '20px',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                <BarChart3 size={16} style={{ color: 'var(--color-brand-primary)' }} />
                                <h3 style={{ fontSize: '0.85rem', fontWeight: 800 }}>Ventas Recientes</h3>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {recentSales.map((sale, i) => (
                                    <div key={i} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '12px', borderRadius: '12px',
                                        background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.03)',
                                    }}>
                                        <div>
                                            <p style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '2px' }}>{sale.customer}</p>
                                            <p style={{ fontSize: '0.65rem', color: '#6b7280' }}>{sale.product} • {sale.time}</p>
                                        </div>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-brand-primary)' }}>{sale.amount}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                                <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#6b7280' }}>
                                    Total hoy: <span style={{ color: 'var(--color-brand-primary)', fontWeight: 800 }}>${todayTotal.toLocaleString()}</span>
                                </p>
                            </div>
                        </div>

                        {/* Products Table */}
                        <div style={{
                            background: '#1a2c28', borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden',
                        }}>
                            {/* Tabs + Search */}
                            <div style={{
                                padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                flexWrap: 'wrap', gap: '12px',
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    overflowX: 'auto',
                                    msOverflowStyle: 'none',
                                    scrollbarWidth: 'none',
                                    WebkitOverflowScrolling: 'touch',
                                } as any} className="admin-tabs-scroll-container">
                                    <style>{`
                                        .admin-tabs-scroll-container::-webkit-scrollbar { display: none; }
                                    `}</style>
                                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                        {['products', 'orders', 'customers', 'subscriptions', 'plans'].map((tab) => (
                                            <button
                                                key={tab}
                                                onClick={() => { setActiveTab(tab); setSearchQuery(''); }}
                                                style={{
                                                    padding: '10px 18px', borderRadius: '10px', border: 'none',
                                                    fontSize: '11px', fontWeight: 800, cursor: 'pointer',
                                                    textTransform: 'uppercase' as const, letterSpacing: '0.12em',
                                                    background: activeTab === tab ? 'rgba(42,157,124,0.18)' : 'transparent',
                                                    color: activeTab === tab ? 'var(--color-brand-primary)' : '#6b7280',
                                                    borderBottom: activeTab === tab ? '2px solid var(--color-brand-primary)' : '2px solid transparent',
                                                    whiteSpace: 'nowrap',
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >
                                                {tab === 'products' ? 'Productos' :
                                                    tab === 'orders' ? 'Pedidos' :
                                                        tab === 'customers' ? 'Clientes' :
                                                            tab === 'subscriptions' ? 'Suscripciones' : 'Planes'}
                                            </button>
                                        ))}
                                    </div>
                                    {activeTab === 'orders' && (
                                        <button
                                            onClick={exportToExcel}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                padding: '8px 12px', borderRadius: '8px',
                                                background: 'rgba(42,157,124,0.1)', border: '1px solid rgba(42,157,124,0.3)',
                                                color: 'var(--color-brand-primary)', fontSize: '10px', fontWeight: 800,
                                                textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer'
                                            }}
                                        >
                                            <BarChart3 size={12} /> Exportar Excel
                                        </button>
                                    )}
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563' }} />
                                    <input
                                        type="text"
                                        placeholder={activeTab === 'products' ? 'Buscar producto...' : activeTab === 'orders' ? 'Buscar pedido...' : 'Buscar cliente...'}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{
                                            padding: '10px 12px 10px 36px', borderRadius: '10px',
                                            background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)',
                                            color: '#fff', fontSize: '0.8rem', outline: 'none', width: '200px',
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Tab Content */}
                            {activeTab === 'products' && (
                                <>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    {['Producto', 'Origen', 'Precio', 'Stock', 'Estado', ''].map((h, i) => (
                                                        <th key={i} style={{
                                                            padding: '12px 20px', fontSize: '9px', fontWeight: 700,
                                                            textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: '#6b7280',
                                                            textAlign: i === 5 ? 'right' : 'left',
                                                        }}>
                                                            {h}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredProducts.map((product) => (
                                                    <tr key={product.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                        <td style={{ padding: '14px 20px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                <div style={{
                                                                    width: '40px', height: '40px', borderRadius: '10px',
                                                                    background: 'rgba(0,0,0,0.2)',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                                }}>
                                                                    <Coffee size={18} style={{ color: 'rgba(42,157,124,0.4)' }} />
                                                                </div>
                                                                <div>
                                                                    <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '2px' }}>{product.name}</p>
                                                                    <p style={{ fontSize: '0.65rem', color: '#6b7280' }}>{product.variety} • {product.process}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '14px 20px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <MapPin size={12} style={{ color: 'var(--color-brand-primary)', opacity: 0.5 }} />
                                                                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{product.origin.municipality}</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '14px 20px', fontSize: '0.85rem', fontWeight: 800, color: '#ffc107' }}>
                                                            ${product.price.toLocaleString()}
                                                        </td>
                                                        <td style={{ padding: '14px 20px', fontSize: '0.8rem', fontWeight: 600, color: product.stock < 25 ? '#ef4444' : '#9ca3af' }}>
                                                            {product.stock} u.
                                                        </td>
                                                        <td style={{ padding: '14px 20px' }}>
                                                            <span style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                                padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                                                                background: product.status === 'Activo' ? 'rgba(34,197,94,0.1)' :
                                                                    product.status === 'Agotado' ? 'rgba(239,68,68,0.1)' : 'rgba(107,114,128,0.1)',
                                                                color: product.status === 'Activo' ? '#22c55e' :
                                                                    product.status === 'Agotado' ? '#ef4444' : '#9ca3af',
                                                                border: '1px solid',
                                                                borderColor: product.status === 'Activo' ? 'rgba(34,197,94,0.2)' :
                                                                    product.status === 'Agotado' ? 'rgba(239,68,68,0.2)' : 'rgba(107,114,128,0.2)',
                                                            }}>
                                                                <div style={{
                                                                    width: '5px', height: '5px', borderRadius: '50%',
                                                                    background: product.status === 'Activo' ? '#22c55e' :
                                                                        product.status === 'Agotado' ? '#ef4444' : '#9ca3af'
                                                                }} />
                                                                {product.status}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                                <button
                                                                    onClick={() => openEditProduct(product)}
                                                                    style={{
                                                                        width: '32px', height: '32px', borderRadius: '8px',
                                                                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)',
                                                                        color: '#9ca3af', cursor: 'pointer',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    }}
                                                                >
                                                                    <Edit size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(product.id)}
                                                                    style={{
                                                                        width: '32px', height: '32px', borderRadius: '8px',
                                                                        background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)',
                                                                        color: '#ef4444', cursor: 'pointer',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    }}
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div style={{
                                        padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.7rem', color: '#6b7280',
                                    }}>
                                        <span>Mostrando {filteredProducts.length} de {products.length} productos</span>
                                    </div>
                                </>
                            )}

                            {/* ─── PEDIDOS TAB ─── */}
                            {activeTab === 'orders' && (
                                <>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    {['Pedido', 'Cliente', 'Productos', 'Total', 'Pago', 'Estado', 'Fecha', ''].map((h, i) => (
                                                        <th key={i} style={{
                                                            padding: '12px 20px', fontSize: '9px', fontWeight: 700,
                                                            textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: '#6b7280',
                                                            textAlign: i === 7 ? 'right' : 'left',
                                                        }}>
                                                            {h}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredOrders.map((order) => (
                                                    <tr key={order.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                        <td style={{ padding: '14px 20px' }}>
                                                            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{order.id.slice(0, 8).toUpperCase()}</span>
                                                        </td>
                                                        <td style={{ padding: '14px 20px' }}>
                                                            <p style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '2px' }}>{order.client}</p>
                                                            <p style={{ fontSize: '0.65rem', color: '#6b7280' }}>{order.email}</p>
                                                        </td>
                                                        <td style={{ padding: '14px 20px', fontSize: '0.75rem', color: '#9ca3af', maxWidth: '200px' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                <span>{order.items}</span>
                                                                {order.isSubscription && (
                                                                    <span style={{
                                                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                                        fontSize: '9px', fontWeight: 800, color: 'var(--color-brand-primary)',
                                                                        textTransform: 'uppercase', letterSpacing: '0.05em'
                                                                    }}>
                                                                        <Coffee size={10} /> Suscripción
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '14px 20px', fontSize: '0.85rem', fontWeight: 800, color: '#ffc107' }}>
                                                            {order.total}
                                                        </td>
                                                        <td style={{ padding: '14px 20px' }}>
                                                            {order.paymentStatus === 'APPROVED' ? (
                                                                <span style={{
                                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                                    padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                                                                    background: 'rgba(34,197,94,0.1)', color: '#22c55e',
                                                                    border: '1px solid rgba(34,197,94,0.2)'
                                                                }}>
                                                                    APROBADO
                                                                </span>
                                                            ) : (
                                                                <motion.button
                                                                    whileHover={{ scale: 1.05 }}
                                                                    whileTap={{ scale: 0.95 }}
                                                                    onClick={() => handleUpdatePaymentStatus(order.id, 'APPROVED')}
                                                                    style={{
                                                                        padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                                                                        background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
                                                                        border: '1px solid rgba(245,158,11,0.2)', cursor: 'pointer',
                                                                        textTransform: 'uppercase'
                                                                    }}
                                                                >
                                                                    Aprobar
                                                                </motion.button>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: '14px 20px' }}>
                                                            <select
                                                                value={order.status}
                                                                onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                                                style={{
                                                                    background: 'rgba(0,0,0,0.2)',
                                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                                    color: order.statusColor,
                                                                    fontSize: '10px', fontWeight: 800,
                                                                    padding: '6px 10px', borderRadius: '8px',
                                                                    outline: 'none', cursor: 'pointer',
                                                                    appearance: 'none',
                                                                    textAlign: 'center',
                                                                    minWidth: '100px'
                                                                }}
                                                            >
                                                                <option value="RECIBIDO">RECIBIDO</option>
                                                                <option value="PREPARANDO">PREPARANDO</option>
                                                                <option value="EN_CAMINO">EN CAMINO</option>
                                                                <option value="ENTREGADO">ENTREGADO</option>
                                                                <option value="CANCELADO">CANCELADO</option>
                                                            </select>
                                                        </td>
                                                        <td style={{ padding: '14px 20px', fontSize: '0.75rem', color: '#6b7280' }}>
                                                            {formatTimeAgo(order.date)}
                                                        </td>
                                                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                                            <motion.button
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={() => {
                                                                    setSelectedOrder(order)
                                                                    setShowOrderDetails(true)
                                                                }}
                                                                style={{
                                                                    width: '32px', height: '32px', borderRadius: '8px',
                                                                    background: 'rgba(42,157,124,0.1)', border: '1px solid rgba(42,157,124,0.2)',
                                                                    color: 'var(--color-brand-primary)', cursor: 'pointer',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                }}
                                                            >
                                                                <Search size={14} />
                                                            </motion.button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div style={{
                                        padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.7rem', color: '#6b7280',
                                    }}>
                                        <span>Mostrando {filteredOrders.length} de {orders.length} pedidos</span>
                                    </div>
                                </>
                            )}

                            {/* ─── CLIENTES TAB ─── */}
                            {activeTab === 'customers' && (
                                <>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    {['Cliente', 'Email', 'Pedidos', 'Total Comprado', 'Suscripción', 'Desde'].map((h, i) => (
                                                        <th key={i} style={{
                                                            padding: '12px 20px', fontSize: '9px', fontWeight: 700,
                                                            textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: '#6b7280',
                                                        }}>
                                                            {h}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredCustomers.map((customer, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                        <td style={{ padding: '14px 20px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                <div style={{
                                                                    width: '36px', height: '36px', borderRadius: '10px',
                                                                    background: 'rgba(42,157,124,0.15)', color: 'var(--color-brand-primary)',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    fontSize: '0.8rem', fontWeight: 800, flexShrink: 0,
                                                                }}>
                                                                    {customer.initial}
                                                                </div>
                                                                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{customer.name}</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '14px 20px', fontSize: '0.75rem', color: '#9ca3af' }}>
                                                            {customer.email}
                                                        </td>
                                                        <td style={{ padding: '14px 20px', fontSize: '0.85rem', fontWeight: 700 }}>
                                                            {customer.orders}
                                                        </td>
                                                        <td style={{ padding: '14px 20px', fontSize: '0.85rem', fontWeight: 800, color: '#ffc107' }}>
                                                            {customer.total}
                                                        </td>
                                                        <td style={{ padding: '14px 20px' }}>
                                                            <span style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                                padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                                                                background: customer.sub === 'Suscriptor' ? 'rgba(42,157,124,0.1)' :
                                                                    customer.sub === 'Registrado' ? 'rgba(59,130,246,0.1)' : 'rgba(251,146,60,0.1)',
                                                                color: customer.sub === 'Suscriptor' ? 'var(--color-brand-primary)' :
                                                                    customer.sub === 'Registrado' ? '#3b82f6' : '#fb923c',
                                                                border: customer.sub === 'Suscriptor' ? '1px solid rgba(42,157,124,0.2)' :
                                                                    customer.sub === 'Registrado' ? '1px solid rgba(59,130,246,0.2)' : '1px solid rgba(251,146,60,0.2)',
                                                            }}>
                                                                {customer.subActive && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-brand-primary)' }} />}
                                                                {customer.sub}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '14px 20px', fontSize: '0.75rem', color: '#6b7280' }}>
                                                            {formatTimeAgo(customer.since)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div style={{
                                        padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.7rem', color: '#6b7280',
                                    }}>
                                        <span>Mostrando {filteredCustomers.length} de {customers.length} clientes</span>
                                    </div>
                                </>
                            )}

                            {/* ─── SUBSCRIPTIONS TAB ─── */}
                            {activeTab === 'subscriptions' && (
                                <>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    {['Cliente', 'Plan de Café', 'Estado', 'Fecha Inicio', 'Siguiente Pago'].map((h, i) => (
                                                        <th key={i} style={{
                                                            padding: '12px 20px', fontSize: '9px', fontWeight: 700,
                                                            textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: '#6b7280',
                                                        }}>
                                                            {h}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredSubscriptions.map((sub, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                        <td style={{ padding: '14px 20px' }}>
                                                            <p style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '2px' }}>{sub.client}</p>
                                                            <p style={{ fontSize: '0.65rem', color: '#6b7280' }}>{sub.email}</p>
                                                        </td>
                                                        <td style={{ padding: '14px 20px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <Coffee size={14} style={{ color: 'var(--color-brand-primary)' }} />
                                                                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{sub.plan}</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '14px 20px' }}>
                                                            <span style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                                padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                                                                background: `${sub.statusColor}15`, color: sub.statusColor,
                                                            }}>
                                                                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: sub.statusColor }} />
                                                                {sub.status}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '14px 20px', fontSize: '0.75rem', color: '#9ca3af' }}>
                                                            {sub.startDate !== 'N/A' ? new Date(sub.startDate).toLocaleDateString() : 'N/A'}
                                                        </td>
                                                        <td style={{ padding: '14px 20px', fontSize: '0.85rem', fontWeight: 700 }}>
                                                            {sub.nextBilling !== 'N/A' ? new Date(sub.nextBilling).toLocaleDateString() : 'N/A'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div style={{
                                        padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.7rem', color: '#6b7280',
                                    }}>
                                        <span>Mostrando {filteredSubscriptions.length} de {subscriptions.length} suscripciones</span>
                                    </div>
                                </>
                            )}

                            {/* ─── PLANS TAB ─── */}
                            {activeTab === 'plans' && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
                                    {plans.map(plan => (
                                        <div key={plan.id} style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>{plan.name}</h3>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        {plan.is_active ? (
                                                            <span style={{ padding: '2px 8px', background: '#dcfce7', color: '#166534', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>Activo</span>
                                                        ) : (
                                                            <span style={{ padding: '2px 8px', background: '#fee2e2', color: '#991b1b', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>Inactivo</span>
                                                        )}
                                                        {plan.is_popular && (
                                                            <span style={{ padding: '2px 8px', background: '#fef3c7', color: '#92400e', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>Popular</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setEditingPlan(plan)
                                                        setShowPlanModal(true)
                                                    }}
                                                    style={{ padding: '8px', borderRadius: '8px', background: '#f3f4f6', color: '#4b5563', border: 'none', cursor: 'pointer' }}
                                                >
                                                    <Edit size={18} />
                                                </button>
                                            </div>

                                            <div style={{ marginBottom: '16px' }}>
                                                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-brand-primary)' }}>
                                                    ${plan.price_monthly.toLocaleString('es-CO')}
                                                </span>
                                                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}> / mes</span>
                                            </div>

                                            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '16px' }}>
                                                {plan.description}
                                            </p>

                                            <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '12px' }}>
                                                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '8px', textTransform: 'uppercase' }}>Características:</p>
                                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                                    {plan.features?.map((f: string, i: number) => (
                                                        <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '0.875rem', color: '#4b5563', marginBottom: '4px' }}>
                                                            <Check size={14} style={{ marginTop: '3px', color: 'var(--color-brand-primary)' }} />
                                                            {f}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ──── PRODUCT MODAL ──── */}
                <AnimatePresence>
                    {showModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            style={{
                                position: 'fixed', inset: 0, zIndex: 200,
                                background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                                overflowY: 'auto',
                                display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
                                padding: '40px 16px',
                            }}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 40, scale: 0.95 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: '100%', maxWidth: '580px',
                                    background: '#1a2c28', borderRadius: '20px',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                                    padding: '28px', marginBottom: '40px',
                                }}
                            >
                                {/* Modal Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <h2 style={{ fontSize: '1.1rem', fontWeight: 900 }}>
                                        {editingId ? 'Editar Producto' : 'Nuevo Producto'}
                                    </h2>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        style={{
                                            width: '32px', height: '32px', borderRadius: '8px',
                                            background: 'rgba(255,255,255,0.05)', border: 'none',
                                            color: '#9ca3af', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                {/* Form */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {/* Row: Name + Variety */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label style={labelStyle}>Nombre del Producto *</label>
                                            <input
                                                style={inputStyle}
                                                placeholder="Ej: Jericó Especial"
                                                value={form.name}
                                                onChange={(e) => updateField('name', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Variedad *</label>
                                            <input
                                                style={inputStyle}
                                                placeholder="Ej: Caturra, Castillo"
                                                value={form.variety}
                                                onChange={(e) => updateField('variety', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Row: Process + Roast Level */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label style={labelStyle}>Proceso</label>
                                            <select
                                                style={{ ...inputStyle, cursor: 'pointer' }}
                                                value={form.process}
                                                onChange={(e) => updateField('process', e.target.value)}
                                            >
                                                <option value="Lavado">Lavado</option>
                                                <option value="Natural">Natural</option>
                                                <option value="Honey">Honey</option>
                                                <option value="Anaeróbico">Anaeróbico</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Nivel de Tueste</label>
                                            <select
                                                style={{ ...inputStyle, cursor: 'pointer' }}
                                                value={form.roast_level}
                                                onChange={(e) => updateField('roast_level', e.target.value)}
                                            >
                                                <option value="Clara">Clara</option>
                                                <option value="Media-Clara">Media-Clara</option>
                                                <option value="Media">Media</option>
                                                <option value="Media-Oscura">Media-Oscura</option>
                                                <option value="Oscura">Oscura</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Divider: Origen */}
                                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-brand-primary)', letterSpacing: '0.2em', textTransform: 'uppercase' as const, marginTop: '8px' }}>
                                        📍 Origen
                                    </div>

                                    {/* Row: Farm + Municipality + Altitude */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: '12px' }}>
                                        <div>
                                            <label style={labelStyle}>Finca</label>
                                            <input
                                                style={inputStyle}
                                                placeholder="Finca La Esperanza"
                                                value={form.farm}
                                                onChange={(e) => updateField('farm', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Municipio *</label>
                                            <input
                                                style={inputStyle}
                                                placeholder="Jericó"
                                                value={form.municipality}
                                                onChange={(e) => updateField('municipality', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Altitud (m)</label>
                                            <input
                                                type="number"
                                                style={inputStyle}
                                                placeholder="1900"
                                                value={form.altitude}
                                                onChange={(e) => updateField('altitude', Number(e.target.value))}
                                            />
                                        </div>
                                    </div>

                                    {/* Divider: Comercial */}
                                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#ffc107', letterSpacing: '0.2em', textTransform: 'uppercase' as const, marginTop: '8px' }}>
                                        💰 Datos Comerciales
                                    </div>

                                    {/* Row: Price + Stock + Status */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label style={labelStyle}>Precio (COP) *</label>
                                            <input
                                                type="number"
                                                style={inputStyle}
                                                placeholder="42000"
                                                value={form.price || ''}
                                                onChange={(e) => updateField('price', Number(e.target.value))}
                                            />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Gramaje (g) *</label>
                                            <input
                                                type="number"
                                                style={inputStyle}
                                                placeholder="340"
                                                value={form.gramaje || ''}
                                                onChange={(e) => updateField('gramaje', Number(e.target.value))}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label style={labelStyle}>Stock (unidades) *</label>
                                            <input
                                                type="number"
                                                style={inputStyle}
                                                placeholder="50"
                                                value={form.stock || ''}
                                                onChange={(e) => updateField('stock', Number(e.target.value))}
                                            />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Estado</label>
                                            <select
                                                style={{ ...inputStyle, cursor: 'pointer' }}
                                                value={form.status}
                                                onChange={(e) => updateField('status', e.target.value)}
                                            >
                                                <option value="Activo">Activo</option>
                                                <option value="Pausado">Pausado</option>
                                                <option value="Agotado">Agotado</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Tasting Notes */}
                                    <div>
                                        <label style={labelStyle}>Notas de Cata (separadas por coma)</label>
                                        <input
                                            style={inputStyle}
                                            placeholder="Cítrico, Panela, Chocolate"
                                            value={form.tasting_notes}
                                            onChange={(e) => updateField('tasting_notes', e.target.value)}
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label style={labelStyle}>Descripción</label>
                                        <textarea
                                            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' as const }}
                                            placeholder="Un café equilibrado con notas dulces..."
                                            value={form.description}
                                            onChange={(e) => updateField('description', e.target.value)}
                                        />
                                    </div>

                                    {/* Image Upload */}
                                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#a78bfa', letterSpacing: '0.2em', textTransform: 'uppercase' as const, marginTop: '8px' }}>
                                        📷 Imagen del Producto
                                    </div>
                                    <div
                                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={handleDrop}
                                        onClick={() => document.getElementById('product-image-input')?.click()}
                                        style={{
                                            position: 'relative',
                                            border: isDragging ? '2px dashed var(--color-brand-primary)' : '2px dashed rgba(255,255,255,0.1)',
                                            borderRadius: '14px',
                                            padding: imagePreview ? '0' : '32px 20px',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            background: isDragging ? 'rgba(42,157,124,0.08)' : 'rgba(0,0,0,0.15)',
                                            transition: 'all 0.2s ease',
                                            overflow: 'hidden',
                                            minHeight: '120px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}
                                    >
                                        {isUploading && (
                                            <div style={{
                                                position: 'absolute', inset: 0, zIndex: 10,
                                                background: 'rgba(26, 44, 40, 0.8)',
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                gap: '12px'
                                            }}>
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                    style={{ width: '24px', height: '24px', border: '2px solid rgba(42,157,124,0.3)', borderTopColor: 'var(--color-brand-primary)', borderRadius: '50%' }}
                                                />
                                                <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--color-brand-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                                    {uploadStatus === 'compressing' ? 'Optimizando Imagen...' : 'Subiendo a Supabase...'}
                                                </span>
                                            </div>
                                        )}
                                        <input
                                            id="product-image-input"
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (file) handleImageUpload(file)
                                            }}
                                        />
                                        {imagePreview ? (
                                            <div style={{ position: 'relative', width: '100%' }}>
                                                <img
                                                    src={imagePreview}
                                                    alt="Preview"
                                                    style={{
                                                        width: '100%', maxHeight: '200px',
                                                        objectFit: 'cover', display: 'block',
                                                        borderRadius: '12px',
                                                    }}
                                                />
                                                <div style={{
                                                    position: 'absolute', bottom: '8px', right: '8px',
                                                    display: 'flex', gap: '6px',
                                                }}>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setImagePreview(null)
                                                            setForm(prev => ({ ...prev, image_url: '' }))
                                                        }}
                                                        style={{
                                                            padding: '6px 12px', borderRadius: '8px',
                                                            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            color: '#ef4444', fontSize: '10px', fontWeight: 700,
                                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                                                        }}
                                                    >
                                                        <Trash2 size={10} /> Quitar
                                                    </button>
                                                    <div style={{
                                                        padding: '6px 12px', borderRadius: '8px',
                                                        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        color: 'var(--color-brand-primary)', fontSize: '10px', fontWeight: 700,
                                                        display: 'flex', alignItems: 'center', gap: '4px',
                                                    }}>
                                                        <Upload size={10} /> Cambiar
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div style={{
                                                    width: '48px', height: '48px', borderRadius: '12px',
                                                    background: 'rgba(42,157,124,0.1)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    margin: '0 auto 12px',
                                                }}>
                                                    <ImageIcon size={22} style={{ color: 'var(--color-brand-primary)' }} />
                                                </div>
                                                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#d1d5db', marginBottom: '4px' }}>
                                                    Arrastra una imagen o haz clic para seleccionar
                                                </p>
                                                <p style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                                                    JPG, PNG o WebP • Máximo 2MB
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                                        <button
                                            onClick={() => setShowModal(false)}
                                            style={{
                                                padding: '12px 24px', borderRadius: '10px',
                                                background: 'none', border: '1px solid rgba(255,255,255,0.08)',
                                                color: '#9ca3af', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem',
                                            }}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={!form.name || !form.variety || !form.municipality || !form.price || !form.gramaje || isUploading}
                                            style={{
                                                padding: '12px 24px', borderRadius: '10px',
                                                background: (!form.name || !form.variety || !form.municipality || !form.price || !form.gramaje || isUploading) ? '#333' : 'var(--color-brand-primary)',
                                                border: 'none', color: '#fff', cursor: 'pointer',
                                                fontWeight: 800, fontSize: '0.8rem',
                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                opacity: (!form.name || !form.variety || !form.municipality || !form.price || !form.gramaje || isUploading) ? 0.4 : 1,
                                                boxShadow: '0 8px 20px rgba(42,157,124,0.2)',
                                            }}
                                        >
                                            <Save size={16} />
                                            {editingId ? 'Guardar Cambios' : 'Crear Producto'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showOrderDetails && selectedOrder && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: 'fixed', inset: 0, zIndex: 1000,
                                background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
                            }}
                            onClick={() => setShowOrderDetails(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: '100%', maxWidth: '600px', background: '#1a2c28',
                                    borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)',
                                    overflow: 'hidden', position: 'relative',
                                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                                }}
                            >
                                {/* Header */}
                                <div style={{
                                    padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    background: 'rgba(255,255,255,0.02)'
                                }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '4px' }}>
                                            Pedido {selectedOrder.id.substring(0, 8).toUpperCase()}
                                        </h2>
                                        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                            {new Date(selectedOrder.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowOrderDetails(false)}
                                        style={{
                                            width: '40px', height: '40px', borderRadius: '12px',
                                            background: 'rgba(255,255,255,0.05)', border: 'none',
                                            color: '#9ca3af', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div style={{ padding: '32px', maxHeight: '70vh', overflowY: 'auto' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '40px' }}>
                                        {/* Cliente & Contacto */}
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(42,157,124,0.1)', color: 'var(--color-brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <User size={16} />
                                                </div>
                                                <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-brand-primary)' }}>Información de Envío</h3>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div>
                                                    <p style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>Nombre Completo</p>
                                                    <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>{selectedOrder.shippingAddress?.name || 'No especificado'}</p>
                                                </div>
                                                <div style={{ display: 'flex', gap: '20px' }}>
                                                    <div>
                                                        <p style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>Teléfono</p>
                                                        <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>{selectedOrder.shippingAddress?.phone || 'No especificado'}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>Ciudad / Depto</p>
                                                    <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.department}</p>
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>Dirección</p>
                                                    <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>{selectedOrder.shippingAddress?.address}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Estado & Notas */}
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(52,211,153,0.1)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Truck size={16} />
                                                </div>
                                                <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#34d399' }}>Estado del Pedido</h3>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Pago</span>
                                                        <span style={{
                                                            fontSize: '10px', fontWeight: 900, padding: '4px 8px', borderRadius: '6px',
                                                            background: selectedOrder.paymentStatus === 'APPROVED' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                                                            color: selectedOrder.paymentStatus === 'APPROVED' ? '#22c55e' : '#f59e0b'
                                                        }}>{selectedOrder.paymentStatus === 'APPROVED' ? 'APROBADO' : 'PENDIENTE'}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Envío</span>
                                                        <span style={{
                                                            fontSize: '10px', fontWeight: 900, padding: '4px 8px', borderRadius: '6px',
                                                            background: `${selectedOrder.statusColor}20`,
                                                            color: selectedOrder.statusColor
                                                        }}>{selectedOrder.status}</span>
                                                    </div>
                                                </div>
                                                {selectedOrder.shippingAddress?.notes && (
                                                    <div>
                                                        <p style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>Notas del Cliente</p>
                                                        <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.1)', fontSize: '0.8rem', fontStyle: 'italic', color: '#d1d5db' }}>
                                                            "{selectedOrder.shippingAddress.notes}"
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items Breakdown */}
                                    <div>
                                        <h3 style={{ fontSize: '0.85rem', fontWeight: 900, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Package size={16} /> Detalle de Productos
                                        </h3>
                                        <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            {selectedOrder.itemsRaw?.map((item: any, i: number) => (
                                                <div key={i} style={{
                                                    padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                                                    borderBottom: i === selectedOrder.itemsRaw.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Coffee size={16} style={{ color: 'var(--color-brand-primary)' }} />
                                                        </div>
                                                        <div>
                                                            <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>{item.product_name || 'Producto'}</p>
                                                            <p style={{ fontSize: '0.7rem', color: '#6b7280' }}>Cantidad: {item.quantity}</p>
                                                        </div>
                                                    </div>
                                                    <p style={{ fontSize: '0.9rem', fontWeight: 800 }}>${(item.unit_price * item.quantity).toLocaleString()}</p>
                                                </div>
                                            ))}
                                            <div style={{ padding: '20px', background: 'rgba(42,157,124,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 900 }}>Total Pagado</span>
                                                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#facc15' }}>{selectedOrder.total}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer / Actions */}
                                <div style={{ padding: '24px 32px', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                    <button
                                        onClick={() => setShowOrderDetails(false)}
                                        style={{
                                            padding: '12px 24px', borderRadius: '12px',
                                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                            color: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: '0.8rem',
                                        }}
                                    >
                                        Cerrar
                                    </button>
                                    {selectedOrder.status !== 'ENTREGADO' && (
                                        <button
                                            onClick={() => {
                                                const nextStatus = selectedOrder.status === 'RECIBIDO' ? 'PREPARANDO' :
                                                    selectedOrder.status === 'PREPARANDO' ? 'EN_CAMINO' : 'ENTREGADO';
                                                handleUpdateOrderStatus(selectedOrder.id, nextStatus);
                                                setShowOrderDetails(false);
                                            }}
                                            style={{
                                                padding: '12px 24px', borderRadius: '12px',
                                                background: 'var(--color-brand-primary)', border: 'none',
                                                color: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: '0.8rem',
                                                boxShadow: '0 8px 16px rgba(42,157,124,0.25)',
                                            }}
                                        >
                                            Pasar a {selectedOrder.status === 'RECIBIDO' ? 'Preparación' :
                                                selectedOrder.status === 'PREPARANDO' ? 'En Camino' : 'Entregado'}
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
                {/* Edit Plan Modal */}
                <AnimatePresence>
                    {showPlanModal && editingPlan && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
                            }}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                style={{
                                    background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '600px',
                                    maxHeight: '90vh', overflowY: 'auto', padding: '32px', position: 'relative'
                                }}
                            >
                                <button
                                    onClick={() => setShowPlanModal(false)}
                                    style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                                >
                                    <X size={24} />
                                </button>

                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '24px' }}>
                                    Editar Plan: {editingPlan.name}
                                </h2>

                                <form onSubmit={handleUpdatePlan} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Nombre</label>
                                            <input
                                                type="text"
                                                value={editingPlan.name}
                                                onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })}
                                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '0.9rem', color: '#111827' }}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Precio (Mensual)</label>
                                            <input
                                                type="text"
                                                pattern="[0-9]*"
                                                value={editingPlan.price_monthly}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/\D/g, '')
                                                    setEditingPlan({ ...editingPlan, price_monthly: val ? parseInt(val) : 0 })
                                                }}
                                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '0.9rem', color: '#111827' }}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Descripción</label>
                                        <textarea
                                            value={editingPlan.description}
                                            onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })}
                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '0.9rem', minHeight: '80px', color: '#111827' }}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Características (una por línea)</label>
                                        <textarea
                                            value={Array.isArray(editingPlan.features) ? editingPlan.features.join('\n') : editingPlan.features}
                                            onChange={e => setEditingPlan({ ...editingPlan, features: e.target.value })}
                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '0.9rem', minHeight: '120px', color: '#111827' }}
                                            placeholder="Característica 1&#10;Característica 2&#10;Característica 3"
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '24px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={editingPlan.is_active}
                                                onChange={e => setEditingPlan({ ...editingPlan, is_active: e.target.checked })}
                                                style={{ width: '18px', height: '18px', accentColor: 'var(--color-brand-primary)' }}
                                            />
                                            <span style={{ fontSize: '0.9rem', color: '#374151' }}>Plan Activo</span>
                                        </label>

                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={editingPlan.is_popular}
                                                onChange={e => setEditingPlan({ ...editingPlan, is_popular: e.target.checked })}
                                                style={{ width: '18px', height: '18px', accentColor: '#eab308' }}
                                            />
                                            <span style={{ fontSize: '0.9rem', color: '#374151' }}>Marcar como Popular</span>
                                        </label>
                                    </div>

                                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                        <button
                                            type="button"
                                            onClick={() => setShowPlanModal(false)}
                                            style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#f3f4f6', color: '#4b5563', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--color-brand-primary)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            Guardar Cambios
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
