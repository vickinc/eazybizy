import React from 'react';
import { Badge } from '@/components/ui/badge';
import { JournalEntry } from '@/types';
import { UserManagementService } from '@/services/business/userManagementService';
import { formatDateForDisplay } from '@/utils';
import { 
  User, 
  Clock, 
  CheckCircle, 
  Send, 
  RotateCcw,
  Edit3,
  Calendar
} from 'lucide-react';

interface AuditTrailCardProps {
  entry: JournalEntry;
  compact?: boolean;
}

export const AuditTrailCard: React.FC<AuditTrailCardProps> = ({ 
  entry, 
  compact = false 
}) => {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const renderAuditItem = (
    icon: React.ReactNode,
    action: string,
    user: string | undefined,
    timestamp: string | undefined,
    className?: string
  ) => {
    if (!user || !timestamp) return null;

    return (
      <div className={`flex items-center space-x-2 text-xs ${className}`}>
        {icon}
        <span className="font-medium">{action}:</span>
        <span className="text-gray-600">{user}</span>
        <span className="text-gray-500">
          {compact ? formatDateForDisplay(timestamp) : formatTime(timestamp)}
        </span>
      </div>
    );
  };

  if (compact) {
    // Compact view - show only the most relevant info
    return (
      <div className="space-y-1">
        {renderAuditItem(
          <User className="h-3 w-3 text-blue-500" />,
          'Created',
          entry.createdByName,
          entry.createdAt,
          'text-blue-700'
        )}
        
        {entry.status === 'posted' && renderAuditItem(
          <Send className="h-3 w-3 text-green-500" />,
          'Posted',
          entry.postedByName,
          entry.postedAt,
          'text-green-700'
        )}
        
        {entry.status === 'reversed' && renderAuditItem(
          <RotateCcw className="h-3 w-3 text-orange-500" />,
          'Reversed',
          entry.reversedByName,
          entry.reversedAt,
          'text-orange-700'
        )}
      </div>
    );
  }

  // Full view - show complete audit trail
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
        <Clock className="h-4 w-4 mr-2" />
        Audit Trail
      </h4>
      
      <div className="space-y-3">
        {/* Creation */}
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">Created</span>
              <Badge className={UserManagementService.getRoleBadgeColor('admin')}>
                {entry.createdByName || 'Unknown'}
              </Badge>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              <Calendar className="h-3 w-3 inline mr-1" />
              {formatTime(entry.createdAt)}
            </div>
          </div>
        </div>

        {/* Last Modified (if different from creation) */}
        {entry.lastModifiedBy && entry.lastModifiedBy !== entry.createdBy && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <Edit3 className="h-4 w-4 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">Modified</span>
                <Badge className="bg-orange-100 text-orange-800">
                  {entry.lastModifiedByName || 'Unknown'}
                </Badge>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                <Calendar className="h-3 w-3 inline mr-1" />
                {formatTime(entry.updatedAt)}
              </div>
            </div>
          </div>
        )}

        {/* Approval */}
        {entry.approvedBy && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">Approved</span>
                <Badge className="bg-emerald-100 text-emerald-800">
                  {entry.approvedByName || 'Unknown'}
                </Badge>
              </div>
              {entry.approvedAt && (
                <div className="text-xs text-gray-500 mt-1">
                  <Calendar className="h-3 w-3 inline mr-1" />
                  {formatTime(entry.approvedAt)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Posted */}
        {entry.status === 'posted' && entry.postedBy && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Send className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">Posted</span>
                <Badge className="bg-green-100 text-green-800">
                  {entry.postedByName || 'Unknown'}
                </Badge>
              </div>
              {entry.postedAt && (
                <div className="text-xs text-gray-500 mt-1">
                  <Calendar className="h-3 w-3 inline mr-1" />
                  {formatTime(entry.postedAt)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reversed */}
        {entry.status === 'reversed' && entry.reversedBy && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <RotateCcw className="h-4 w-4 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">Reversed</span>
                <Badge className="bg-orange-100 text-orange-800">
                  {entry.reversedByName || 'Unknown'}
                </Badge>
              </div>
              {entry.reversedAt && (
                <div className="text-xs text-gray-500 mt-1">
                  <Calendar className="h-3 w-3 inline mr-1" />
                  {formatTime(entry.reversedAt)}
                </div>
              )}
              {entry.reversalEntryId && (
                <div className="text-xs text-blue-600 mt-1">
                  Reversal Entry: {entry.reversalEntryId}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Entry Status Summary */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Current Status:</span>
          <Badge className={
            entry.status === 'posted' ? 'bg-green-100 text-green-800' :
            entry.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }>
            {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
          </Badge>
        </div>
      </div>
    </div>
  );
};