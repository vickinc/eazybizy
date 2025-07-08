export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export type UserRole = 'admin' | 'accountant' | 'bookkeeper' | 'viewer';

export interface UserPermissions {
  canCreateEntries: boolean;
  canEditEntries: boolean;
  canDeleteEntries: boolean;
  canPostEntries: boolean;
  canReverseEntries: boolean;
  canApproveEntries: boolean;
  canViewAllEntries: boolean;
  canManageUsers: boolean;
}

export interface AuditAction {
  id: string;
  userId: string;
  userName: string;
  action: AuditActionType;
  entityType: 'journal-entry' | 'account' | 'user' | 'company';
  entityId: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export type AuditActionType = 
  | 'create'
  | 'update' 
  | 'delete'
  | 'post'
  | 'reverse'
  | 'approve'
  | 'reject'
  | 'login'
  | 'logout'
  | 'view'
  | 'export';

export const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin: {
    canCreateEntries: true,
    canEditEntries: true,
    canDeleteEntries: true,
    canPostEntries: true,
    canReverseEntries: true,
    canApproveEntries: true,
    canViewAllEntries: true,
    canManageUsers: true
  },
  accountant: {
    canCreateEntries: true,
    canEditEntries: true,
    canDeleteEntries: true,
    canPostEntries: true,
    canReverseEntries: true,
    canApproveEntries: true,
    canViewAllEntries: true,
    canManageUsers: false
  },
  bookkeeper: {
    canCreateEntries: true,
    canEditEntries: true,
    canDeleteEntries: false,
    canPostEntries: false,
    canReverseEntries: false,
    canApproveEntries: false,
    canViewAllEntries: true,
    canManageUsers: false
  },
  viewer: {
    canCreateEntries: false,
    canEditEntries: false,
    canDeleteEntries: false,
    canPostEntries: false,
    canReverseEntries: false,
    canApproveEntries: false,
    canViewAllEntries: true,
    canManageUsers: false
  }
};