'use client'

import { useState, useEffect, useCallback } from 'react'
import { User, UserPermissions } from '@/types/user.types'
import { authService } from '@/services/auth/authService.client'
import { AuthError } from '@/services/auth/authService.client'

interface UseAuthReturn {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error: AuthError | null }>
  signUp: (email: string, password: string, userData: { username: string; fullName: string }) => Promise<{ success: boolean; error: AuthError | null }>
  signOut: () => Promise<{ success: boolean; error: AuthError | null }>
  isAuthenticated: boolean
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial user
    const getInitialUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('Error getting initial user:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getInitialUser()

    // For JWT-based auth, we don't have real-time auth state changes
    // Instead, we rely on the initial check and manual updates after sign in/out
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      const { user: authenticatedUser, error } = await authService.signIn(email, password)
      
      if (error) {
        return { success: false, error }
      }

      setUser(authenticatedUser)
      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: error as AuthError }
    } finally {
      setLoading(false)
    }
  }, [])

  const signUp = useCallback(async (
    email: string, 
    password: string, 
    userData: { username: string; fullName: string }
  ) => {
    setLoading(true)
    try {
      const { user: newUser, error } = await authService.signUp(email, password, userData)
      
      if (error) {
        return { success: false, error }
      }

      setUser(newUser)
      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: error as AuthError }
    } finally {
      setLoading(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    setLoading(true)
    try {
      const { error } = await authService.signOut()
      
      if (error) {
        return { success: false, error }
      }

      setUser(null)
      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: error as AuthError }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  }
}