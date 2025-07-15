import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserManagementService } from '@/services/business/userManagementService';
import { User } from '@/types/user.types';
import UserCheck from "lucide-react/dist/esm/icons/user-check";
import UserX from "lucide-react/dist/esm/icons/user-x";
import Shield from "lucide-react/dist/esm/icons/shield";
import Eye from "lucide-react/dist/esm/icons/eye";
import BookOpen from "lucide-react/dist/esm/icons/book-open";
import Settings from "lucide-react/dist/esm/icons/settings";

interface UserSelectorProps {
  onUserChange?: (user: User) => void;
  compact?: boolean;
}

export const UserSelector: React.FC<UserSelectorProps> = ({ 
  onUserChange,
  compact = false 
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [availableUsers] = useState<User[]>(UserManagementService.getAllUsers());

  useEffect(() => {
    setCurrentUser(UserManagementService.getCurrentUser());
  }, []);

  const handleUserSwitch = (userId: string) => {
    if (UserManagementService.switchUser(userId)) {
      const newUser = UserManagementService.getUserById(userId);
      if (newUser) {
        setCurrentUser(newUser);
        onUserChange?.(newUser);
      }
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-3 w-3" />;
      case 'accountant': return <BookOpen className="h-3 w-3" />;
      case 'bookkeeper': return <Settings className="h-3 w-3" />;
      case 'viewer': return <Eye className="h-3 w-3" />;
      default: return <UserCheck className="h-3 w-3" />;
    }
  };

  if (!currentUser) return null;

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <Badge className={UserManagementService.getRoleBadgeColor(currentUser.role)}>
          {getRoleIcon(currentUser.role)}
          <span className="ml-1">{currentUser.fullName}</span>
        </Badge>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">Current User</h4>
        <Badge className={UserManagementService.getRoleBadgeColor(currentUser.role)}>
          {getRoleIcon(currentUser.role)}
          <span className="ml-1 capitalize">{currentUser.role}</span>
        </Badge>
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-sm font-medium text-gray-900">{currentUser.fullName}</div>
          <div className="text-xs text-gray-500">{currentUser.email}</div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-700 block mb-1">
            Switch User (Demo):
          </label>
          <Select value={currentUser.id} onValueChange={handleUserSwitch}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex items-center space-x-2">
                    {getRoleIcon(user.role)}
                    <span>{user.fullName}</span>
                    <Badge className={UserManagementService.getRoleBadgeColor(user.role)}>
                      {user.role}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-xs text-gray-500">
          <div className="font-medium">Permissions:</div>
          <div className="mt-1 space-y-1">
            {Object.entries(UserManagementService.getUserPermissions(currentUser)).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                {value ? (
                  <UserCheck className="h-3 w-3 text-green-600" />
                ) : (
                  <UserX className="h-3 w-3 text-red-600" />
                )}
                <span className={value ? 'text-green-700' : 'text-red-700'}>
                  {key.replace('can', '').replace(/([A-Z])/g, ' $1').toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};