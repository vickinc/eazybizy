import { User, UserRole, UserPermissions, AuditAction, AuditActionType, ROLE_PERMISSIONS } from '@/types/user.types';

const CURRENT_USER_KEY = 'app-current-user';
const AUDIT_LOG_KEY = 'app-audit-log';

// For demo purposes, we'll use a simple in-memory user system
// In production, this would integrate with your authentication system
const DEMO_USERS: User[] = [
  {
    id: 'user-1',
    username: 'admin',
    fullName: 'System Administrator',
    email: 'admin@company.com',
    role: 'admin',
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  },
  {
    id: 'user-2',
    username: 'accountant',
    fullName: 'Senior Accountant',
    email: 'accountant@company.com',
    role: 'accountant',
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  },
  {
    id: 'user-3',
    username: 'bookkeeper',
    fullName: 'Staff Bookkeeper',
    email: 'bookkeeper@company.com',
    role: 'bookkeeper',
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  }
];

export class UserManagementService {
  /**
   * Get current logged-in user (demo implementation)
   */
  static getCurrentUser(): User {
    try {
      const savedUser = localStorage.getItem(CURRENT_USER_KEY);
      if (savedUser) {
        return JSON.parse(savedUser);
      }
      
      // Default to admin user for demo
      const defaultUser = DEMO_USERS[0];
      this.setCurrentUser(defaultUser);
      return defaultUser;
    } catch (error) {
      console.error('Error getting current user:', error);
      return DEMO_USERS[0]; // Fallback to admin
    }
  }

  /**
   * Set current user (demo implementation)
   */
  static setCurrentUser(user: User): void {
    try {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      
      // Log the login action
      this.logAction('login', 'user', user.id, `User ${user.fullName} logged in`);
    } catch (error) {
      console.error('Error setting current user:', error);
    }
  }

  /**
   * Get all available users (for demo)
   */
  static getAllUsers(): User[] {
    return DEMO_USERS.filter(user => user.isActive);
  }

  /**
   * Get user by ID
   */
  static getUserById(userId: string): User | null {
    return DEMO_USERS.find(user => user.id === userId) || null;
  }

  /**
   * Get user permissions based on role
   */
  static getUserPermissions(user: User): UserPermissions {
    return ROLE_PERMISSIONS[user.role];
  }

  /**
   * Check if current user has specific permission
   */
  static hasPermission(permission: keyof UserPermissions): boolean {
    const currentUser = this.getCurrentUser();
    const permissions = this.getUserPermissions(currentUser);
    return permissions[permission];
  }

  /**
   * Log an audit action
   */
  static logAction(
    action: AuditActionType,
    entityType: AuditAction['entityType'],
    entityId: string,
    details: string,
    userId?: string
  ): void {
    try {
      const currentUser = userId ? this.getUserById(userId) : this.getCurrentUser();
      if (!currentUser) return;

      const auditAction: AuditAction = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: currentUser.id,
        userName: currentUser.fullName,
        action,
        entityType,
        entityId,
        details,
        timestamp: new Date().toISOString(),
        ipAddress: 'demo-ip', // In production, get real IP
        userAgent: navigator.userAgent
      };

      // Get existing audit log
      const existingLog = this.getAuditLog();
      existingLog.push(auditAction);

      // Keep only last 1000 entries to prevent storage bloat
      if (existingLog.length > 1000) {
        existingLog.splice(0, existingLog.length - 1000);
      }

      // Save updated log
      localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(existingLog));
      
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  }

  /**
   * Get audit log
   */
  static getAuditLog(): AuditAction[] {
    try {
      const savedLog = localStorage.getItem(AUDIT_LOG_KEY);
      return savedLog ? JSON.parse(savedLog) : [];
    } catch (error) {
      console.error('Error getting audit log:', error);
      return [];
    }
  }

  /**
   * Get audit log for specific entity
   */
  static getEntityAuditLog(entityType: AuditAction['entityType'], entityId: string): AuditAction[] {
    const fullLog = this.getAuditLog();
    return fullLog.filter(action => 
      action.entityType === entityType && action.entityId === entityId
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get recent audit actions (last N actions)
   */
  static getRecentAuditActions(limit: number = 50): AuditAction[] {
    const fullLog = this.getAuditLog();
    return fullLog
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Clear audit log (admin only)
   */
  static clearAuditLog(): boolean {
    if (!this.hasPermission('canManageUsers')) {
      console.error('Insufficient permissions to clear audit log');
      return false;
    }

    try {
      localStorage.removeItem(AUDIT_LOG_KEY);
      this.logAction('delete', 'user', 'audit-log', 'Audit log cleared');
      return true;
    } catch (error) {
      console.error('Error clearing audit log:', error);
      return false;
    }
  }

  /**
   * Switch user (for demo purposes)
   */
  static switchUser(userId: string): boolean {
    const user = this.getUserById(userId);
    if (user && user.isActive) {
      this.setCurrentUser(user);
      return true;
    }
    return false;
  }

  /**
   * Format user display name with role
   */
  static formatUserDisplay(user: User): string {
    return `${user.fullName} (${user.role})`;
  }

  /**
   * Get role badge color
   */
  static getRoleBadgeColor(role: UserRole): string {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'accountant': return 'bg-blue-100 text-blue-800';
      case 'bookkeeper': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get action badge color
   */
  static getActionBadgeColor(action: AuditActionType): string {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'post': return 'bg-purple-100 text-purple-800';
      case 'reverse': return 'bg-orange-100 text-orange-800';
      case 'approve': return 'bg-emerald-100 text-emerald-800';
      case 'reject': return 'bg-red-100 text-red-800';
      case 'view': return 'bg-gray-100 text-gray-800';
      case 'export': return 'bg-indigo-100 text-indigo-800';
      case 'login': return 'bg-cyan-100 text-cyan-800';
      case 'logout': return 'bg-slate-100 text-slate-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}