import React, { createContext, useState, useContext, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
import axios from 'axios';

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)
  const isSigningOut = useRef(false) // Track if current tab initiated sign-out

  const fetchUserRole = async (activeSession) => {
    if (!activeSession?.access_token) {
      setUserRole(null)
      return
    }

    try {
      // Add timeout to prevent hanging - increased to 15 seconds for reliability
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/user`, {
        headers: {
          'Authorization': `Bearer ${activeSession.access_token}`
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId);

      if (response.ok) {
        const userData = await response.json()
        if (userData.user && userData.user.role_info) {
          setUserRole(userData.user.role_info)
        } else {
          console.warn('No role_info in user data');
          setUserRole(null);
        }
      } else {
        console.error('Role fetch failed with status:', response.status);
        setUserRole(null);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Role fetch timeout - backend may be slow');
      } else {
        console.error('Error fetching user role:', error);
      }
      setUserRole(null)
    }
  }

  // SECURITY FIX #3: Use Supabase's built-in secure token refresh instead of manual sessionStorage
  // Supabase stores tokens securely and manages refresh automatically
  const refreshAccessToken = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        console.error('Failed to refresh token:', error)
        return null
      }

      if (data?.session?.access_token) {
        setSession(data.session)
        setUser(data.session.user)
        return data.session.access_token
      }
    } catch (err) {
      console.error('Error refreshing token:', err)
      return null
    }
    return null
  }

  // --- helper for components to always get valid token ---
  const getValidToken = async () => {
    if (session?.access_token) return session.access_token
    return await refreshAccessToken()
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)

      // SECURITY FIX #3: Removed manual refresh token storage - Supabase handles it securely

      if (session) {
        await fetchUserRole(session)
      }

      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Prevent cross-tab logout: ignore SIGNED_OUT events from other tabs
        if (event === 'SIGNED_OUT' && !isSigningOut.current) {
          console.log('Ignoring sign-out from another tab')
          return
        }

        // Reset flag after processing sign-out
        if (event === 'SIGNED_OUT') {
          isSigningOut.current = false
        }

        setSession(session)
        setUser(session?.user ?? null)

        // SECURITY FIX #3: Removed manual refresh token storage - Supabase handles it securely

        if (session) {
          await fetchUserRole(session)
        } else {
          setUserRole(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    // SECURITY FIX #3: Removed manual refresh token storage - Supabase handles it securely
    return { data, error }
  }

  const signUp = async (email, password, userData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: userData }
    })
    // SECURITY FIX #3: Removed manual refresh token storage - Supabase handles it securely
    return { data, error }
  }

  const signOut = async () => {
    // Mark that this tab is initiating the sign-out
    isSigningOut.current = true
    // SECURITY FIX #3: Removed manual refresh token storage - Supabase handles it securely
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const value = {
    user,
    session,
    loading,
    token: session?.access_token,
    userRole,
    signIn,
    signUp,
    signOut,
    refreshUserRole: () => fetchUserRole(session),
    getValidToken,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
