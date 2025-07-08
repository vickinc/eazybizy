'use client'

import { User, UserRole } from '@/types/user.types'

export interface AuthError {
  message: string
  name: string
  status?: number
}

export class ClientAuthService {
  // Client-side method to get current user (calls API)
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await fetch('/api/auth/me')
      if (!response.ok) {
        return null
      }
      const data = await response.json()
      return data.user
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  async signUp(email: string, password: string, userData: {
    username: string
    fullName: string
    role?: UserRole
  }): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          username: userData.username,
          fullName: userData.fullName,
          role: userData.role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          user: null,
          error: {
            message: data.error || 'Failed to sign up',
            name: 'SignUpError',
            status: response.status,
          },
        }
      }

      return { user: data.user, error: null }
    } catch (error) {
      console.error('Error signing up:', error)
      return {
        user: null,
        error: {
          message: 'Failed to create account',
          name: 'SignUpError',
          status: 500,
        },
      }
    }
  }

  async signIn(email: string, password: string): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          user: null,
          error: {
            message: data.error || 'Failed to sign in',
            name: 'SignInError',
            status: response.status,
          },
        }
      }

      return { user: data.user, error: null }
    } catch (error) {
      console.error('Error signing in:', error)
      return {
        user: null,
        error: {
          message: 'Failed to sign in',
          name: 'SignInError',
          status: 500,
        },
      }
    }
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        return {
          error: {
            message: data.error || 'Failed to sign out',
            name: 'SignOutError',
            status: response.status,
          },
        }
      }

      return { error: null }
    } catch (error) {
      console.error('Error signing out:', error)
      return {
        error: {
          message: 'Failed to sign out',
          name: 'SignOutError',
          status: 500,
        },
      }
    }
  }

  // For client-side auth state management
  onAuthStateChange(callback: (user: User | null) => void) {
    // This would need to be implemented differently for JWT
    // For now, return a no-op unsubscribe function
    return {
      data: { subscription: null },
      error: null,
      unsubscribe: () => {}
    }
  }
}

export const authService = new ClientAuthService()