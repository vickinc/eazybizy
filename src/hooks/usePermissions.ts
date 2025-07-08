'use client'

import { useState, useEffect, useCallback } from 'react'
import { User, UserPermissions } from '@/types/user.types'
import { authService } from '@/services/auth/authService'
import { useUser } from './useUser'

interface UsePermissionsReturn {
  permissions: UserPermissions | null
  loading: boolean
  hasPermission: (permission: keyof UserPermissions) => boolean
  canCreateEntries: boolean
  canEditEntries: boolean
  canDeleteEntries: boolean
  canPostEntries: boolean
  canReverseEntries: boolean
  canApproveEntries: boolean
  canViewAllEntries: boolean
  canManageUsers: boolean
}

export function usePermissions(): UsePermissionsReturn {
  const { user, loading: userLoading } = useUser()
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user) {
        setPermissions(null)
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const userPermissions = await authService.getUserPermissions(user)
        setPermissions(userPermissions)
      } catch (error) {
        console.error('Error fetching permissions:', error)
        setPermissions(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [user])

  const hasPermission = useCallback((permission: keyof UserPermissions): boolean => {
    if (!permissions) return false
    return permissions[permission]
  }, [permissions])

  const isLoading = userLoading || loading

  return {
    permissions,
    loading: isLoading,
    hasPermission,
    canCreateEntries: permissions?.canCreateEntries ?? false,
    canEditEntries: permissions?.canEditEntries ?? false,
    canDeleteEntries: permissions?.canDeleteEntries ?? false,
    canPostEntries: permissions?.canPostEntries ?? false,
    canReverseEntries: permissions?.canReverseEntries ?? false,
    canApproveEntries: permissions?.canApproveEntries ?? false,
    canViewAllEntries: permissions?.canViewAllEntries ?? false,
    canManageUsers: permissions?.canManageUsers ?? false,
  }
}