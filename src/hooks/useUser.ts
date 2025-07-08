'use client'

import { useState, useEffect, useCallback } from 'react'
import { User } from '@/types/user.types'
import { authService } from '@/services/auth/authService'
import { AuthError } from '@supabase/supabase-js'

interface UseUserReturn {
  user: User | null
  loading: boolean
  updateUser: (updates: Partial<User>) => Promise<{ success: boolean; error: AuthError | null }>
  refreshUser: () => Promise<void>
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    setLoading(true)
    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Error refreshing user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()

    // Listen to auth state changes
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      setUser(user)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [refreshUser])

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) {
      return { success: false, error: new Error('No user logged in') as AuthError }
    }

    setLoading(true)
    try {
      const { user: updatedUser, error } = await authService.updateUser(user.id, updates)
      
      if (error) {
        return { success: false, error }
      }

      setUser(updatedUser)
      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: error as AuthError }
    } finally {
      setLoading(false)
    }
  }, [user])

  return {
    user,
    loading,
    updateUser,
    refreshUser,
  }
}