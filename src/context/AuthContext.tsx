'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User as SupabaseUser } from '@supabase/supabase-js'

interface UserProfile {
    id: string;
    full_name: string;
    email: string;
    role: 'client' | 'admin';
}

interface AuthContextType {
    user: UserProfile | null;
    profile: UserProfile | null;
    login: (email: string, password?: string) => Promise<{ error: any }>;
    loginWithGoogle: () => Promise<{ error: any }>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    isAdmin: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<SupabaseUser | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true

        // Safety timeout to ensure app doesn't hang on auth check
        // Increased to 10s for better resilience against cold starts
        const safetyTimeout = setTimeout(() => {
            if (mounted && loading) {
                console.warn('Auth check taking longer than expected - allowing app to mount but state may update later')
                setLoading(false)
            }
        }, 10000)

        // Check active sessions and sets the user
        const getSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession()
                if (error) throw error

                if (mounted) {
                    setUser(session?.user ?? null)
                    if (session?.user) {
                        await fetchProfile(session.user.id, session.user.email!)
                    }
                }
            } catch (error) {
                console.error('Error getting session:', error)
            } finally {
                if (mounted) setLoading(false)
            }
        }

        getSession()

        // Listen for changes on auth state (logged in, signed out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (mounted) {
                setUser(session?.user ?? null)
                if (session?.user) {
                    await fetchProfile(session.user.id, session.user.email!)
                } else {
                    setProfile(null)
                }
                setLoading(false)
            }
        })

        return () => {
            mounted = false
            clearTimeout(safetyTimeout)
            subscription.unsubscribe()
        }
    }, [])

    const fetchProfile = async (id: string, email: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single()

            if (data) {
                setProfile({
                    id: data.id,
                    full_name: data.full_name || email.split('@')[0],
                    email: email,
                    role: data.role as 'client' | 'admin'
                })
            }
        } catch (error) {
            console.error('Error fetching profile:', error)
        }
    }

    const login = async (email: string, password?: string) => {
        try {
            if (password) {
                // Add timeout race to prevent infinite hanging
                const { data, error } = await Promise.race([
                    supabase.auth.signInWithPassword({ email, password }),
                    new Promise<{ data: { user: any, session: any }, error: any }>((_, reject) =>
                        setTimeout(() => reject(new Error('La solicitud de inicio de sesión tardó demasiado. Por favor intente de nuevo.')), 10000)
                    )
                ])

                if (error) return { error }

                if (data?.user) {
                    setUser(data.user)
                    await fetchProfile(data.user.id, data.user.email!)
                }

                return { error: null }
            } else {
                const { error } = await supabase.auth.signInWithOtp({ email })
                return { error }
            }
        } catch (error: any) {
            console.error('Login error:', error)
            return { error: error }
        }
    }

    const loginWithGoogle = async () => {
        try {
            const redirectUrl = `${window.location.origin}/profile`
            console.log('Initiating Google OAuth with redirect to:', redirectUrl)

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl
                }
            })

            if (error) throw error

            if (data?.url) {
                console.log('OAuth data received, redirecting to:', data.url)
                window.location.href = data.url
            } else {
                console.warn('No OAuth URL returned from Supabase')
            }

            return { error: null }
        } catch (error: any) {
            console.error('Error in loginWithGoogle:', error)
            return { error }
        }
    }

    const logout = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        window.location.href = '/'
    }

    return (
        <AuthContext.Provider value={{
            user: profile, // Mapping profile as the legacy 'user' for compatibility
            profile,
            login,
            loginWithGoogle,
            logout,
            isAuthenticated: !!user,
            isAdmin: profile?.role === 'admin',
            loading
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within AuthProvider')
    return context
}
