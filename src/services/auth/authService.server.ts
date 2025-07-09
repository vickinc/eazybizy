import { prisma } from '@/lib/prisma'
import { User, UserRole, UserPermissions, ROLE_PERMISSIONS } from '@/types/user.types'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-in-production')
const JWT_ISSUER = 'portalpro-app'
const JWT_AUDIENCE = 'portalpro-users'
const JWT_EXPIRATION_TIME = '7d'

export interface AuthError {
  message: string
  name: string
  status?: number
}

export class ServerAuthService {
  // This method will be called from API routes (server-side)
  async getCurrentUserFromToken(token: string): Promise<User | null> {
    try {
      if (!token) {
        return null
      }

      const payload = await this.verifyToken(token)
      if (!payload || !payload.userId) {
        return null
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: payload.userId as string }
      })

      if (!dbUser || !dbUser.isActive) {
        return null
      }

      return this.mapDatabaseUserToUser(dbUser)
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      // Convert lowercase TypeScript enum to uppercase Prisma enum if role is provided
      const updateData: unknown = {
        username: updates.username,
        fullName: updates.fullName,
        isActive: updates.isActive,
      }
      
      if (updates.role) {
        updateData.role = updates.role.toUpperCase()
      }

      const dbUser = await prisma.user.update({
        where: { id: userId },
        data: updateData
      })

      return { user: this.mapDatabaseUserToUser(dbUser), error: null }
    } catch (error) {
      console.error('Error updating user:', error)
      return { 
        user: null, 
        error: { 
          message: 'Failed to update user',
          name: 'UpdateError',
          status: 500
        }
      }
    }
  }

  async getUserPermissions(user: User): Promise<UserPermissions> {
    return ROLE_PERMISSIONS[user.role]
  }

  async checkPermission(user: User, permission: keyof UserPermissions): Promise<boolean> {
    const permissions = await this.getUserPermissions(user)
    return permissions[permission]
  }

  async getCompanyMembers(companyId: number): Promise<User[]> {
    try {
      const memberships = await prisma.companyMembership.findMany({
        where: {
          companyId,
          isActive: true
        },
        include: {
          user: true
        }
      })

      return memberships
        .map(membership => membership.user)
        .filter(user => user !== null)
        .map(user => this.mapDatabaseUserToUser(user))
    } catch (error) {
      console.error('Error fetching company members:', error)
      return []
    }
  }

  async addUserToCompany(userId: string, companyId: number, role: UserRole): Promise<{ success: boolean; error: AuthError | null }> {
    try {
      // Convert lowercase TypeScript enum to uppercase Prisma enum
      const prismaRole = role.toUpperCase() as any

      await prisma.companyMembership.create({
        data: {
          userId,
          companyId,
          role: prismaRole,
        }
      })

      return { success: true, error: null }
    } catch (error) {
      console.error('Error adding user to company:', error)
      return { 
        success: false, 
        error: { 
          message: 'Failed to add user to company',
          name: 'CompanyError',
          status: 500
        }
      }
    }
  }

  async removeUserFromCompany(userId: string, companyId: number): Promise<{ success: boolean; error: AuthError | null }> {
    try {
      await prisma.companyMembership.updateMany({
        where: {
          userId,
          companyId
        },
        data: {
          isActive: false
        }
      })

      return { success: true, error: null }
    } catch (error) {
      console.error('Error removing user from company:', error)
      return { 
        success: false, 
        error: { 
          message: 'Failed to remove user from company',
          name: 'CompanyError',
          status: 500
        }
      }
    }
  }

  // Server-side only methods (used in API routes)
  async createToken(userId: string): Promise<string> {
    const token = await new SignJWT({ userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer(JWT_ISSUER)
      .setAudience(JWT_AUDIENCE)
      .setExpirationTime(JWT_EXPIRATION_TIME)
      .sign(JWT_SECRET)

    return token
  }

  async verifyToken(token: string): Promise<any> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      })
      return payload
    } catch (error) {
      console.error('Token verification failed:', error)
      return null
    }
  }

  // Server-side method to handle sign up with direct database access
  async signUpServer(email: string, password: string, userData: {
    username: string
    fullName: string
    role?: UserRole
  }): Promise<{ user: User | null; error: AuthError | null; token?: string }> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { username: userData.username }
          ]
        }
      })

      if (existingUser) {
        return { 
          user: null, 
          error: { 
            message: existingUser.email === email ? 'Email already in use' : 'Username already taken',
            name: 'ValidationError',
            status: 400
          }
        }
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10)

      // Convert lowercase TypeScript enum to uppercase Prisma enum
      const userRole = userData.role || 'viewer'
      const prismaRole = userRole.toUpperCase() as any

      // Create user
      const dbUser = await prisma.user.create({
        data: {
          email,
          username: userData.username,
          fullName: userData.fullName,
          role: prismaRole,
          passwordHash,
          emailVerified: false,
        }
      })

      const user = this.mapDatabaseUserToUser(dbUser)

      // Create JWT token
      const token = await this.createToken(user.id)

      return { user, error: null, token }
    } catch (error) {
      console.error('Error signing up:', error)
      return { 
        user: null, 
        error: { 
          message: 'Failed to create account',
          name: 'SignUpError',
          status: 500
        }
      }
    }
  }

  // Server-side method to handle sign in with direct database access
  async signInServer(email: string, password: string): Promise<{ user: User | null; error: AuthError | null; token?: string }> {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { email }
      })

      if (!dbUser || !dbUser.passwordHash) {
        return { 
          user: null, 
          error: { 
            message: 'Invalid credentials',
            name: 'AuthenticationError',
            status: 401
          }
        }
      }

      const isValidPassword = await bcrypt.compare(password, dbUser.passwordHash)
      
      if (!isValidPassword) {
        return { 
          user: null, 
          error: { 
            message: 'Invalid credentials',
            name: 'AuthenticationError',
            status: 401
          }
        }
      }

      if (!dbUser.isActive) {
        return { 
          user: null, 
          error: { 
            message: 'Account is deactivated',
            name: 'AccountError',
            status: 403
          }
        }
      }

      // Update last login
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { lastLoginAt: new Date() }
      })

      const user = this.mapDatabaseUserToUser(dbUser)

      // Create JWT token
      const token = await this.createToken(user.id)

      return { user, error: null, token }
    } catch (error) {
      console.error('Error signing in:', error)
      return { 
        user: null, 
        error: { 
          message: 'Failed to sign in',
          name: 'SignInError',
          status: 500
        }
      }
    }
  }

  private mapDatabaseUserToUser(dbUser: unknown): User {
    return {
      id: dbUser.id,
      username: dbUser.username,
      fullName: dbUser.fullName,
      email: dbUser.email,
      role: dbUser.role.toLowerCase() as UserRole,
      isActive: dbUser.isActive,
      createdAt: dbUser.createdAt.toISOString(),
      lastLoginAt: dbUser.lastLoginAt?.toISOString() || null,
    }
  }
}

export const serverAuthService = new ServerAuthService()