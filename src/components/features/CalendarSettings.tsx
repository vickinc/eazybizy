import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Clock from "lucide-react/dist/esm/icons/clock";
import Settings from "lucide-react/dist/esm/icons/settings";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import XCircle from "lucide-react/dist/esm/icons/circle";
import { toast } from 'sonner';
import { getTimezoneOptions, detectUserTimezone, getTimezoneInfo } from '@/lib/timezone';


interface SyncStatus {
  googleSyncEnabled: boolean;
  lastGoogleSync: string | null;
  googleEmail: string | null;
  timezoneId: string;
  timezoneMode: string | null;
  googleTimezone: string | null;
  recentSyncs: Array<{
    syncType: string;
    syncStatus: string;
    errorMessage: string | null;
    syncedAt: string;
  }>;
  syncStats: Record<string, number>;
}

export function CalendarSettings() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [selectedTimezone, setSelectedTimezone] = useState('UTC');
  const [timezoneMode, setTimezoneMode] = useState<'device' | 'google' | 'custom'>('device');
  const [deviceTimezone, setDeviceTimezone] = useState(detectUserTimezone());
  const [googleTimezone, setGoogleTimezone] = useState<string | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const searchParams = useSearchParams();

  const timezoneOptions = getTimezoneOptions();

  useEffect(() => {
    fetchSyncStatus();
    
    // Detect device timezone and set as default
    const detectedTimezone = detectUserTimezone();
    setDeviceTimezone(detectedTimezone);
    setSelectedTimezone(detectedTimezone); // Default to device timezone
    
    // Handle OAuth callback results
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    
    if (success === 'google_connected') {
      toast.success('Google Calendar connected successfully!');
      // Refresh data after successful connection
      setTimeout(() => {
        fetchSyncStatus();
      }, 1000);
    } else if (error) {
      const errorMessages = {
        oauth_failed: 'OAuth authentication failed',
        no_code: 'Authorization code not received',
        no_token: 'Failed to get access token',
        no_email: 'Unable to get email from Google',
        user_not_found: 'User account not found',
        callback_failed: 'OAuth callback processing failed'
      };
      toast.error(errorMessages[error as keyof typeof errorMessages] || 'Failed to connect to Google Calendar');
    }
  }, [searchParams]);


  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('/api/calendar/sync/google');
      if (response.ok) {
        const data = await response.json();
        setSyncStatus(data);
        // Set Google timezone if available
        if (data.googleTimezone) {
          setGoogleTimezone(data.googleTimezone);
        }
        
        // Determine timezone mode based on stored preference or default to device
        const storedTimezone = data.timezoneId || detectUserTimezone();
        
        if (data.timezoneMode) {
          // User has explicitly set a preference
          setTimezoneMode(data.timezoneMode as 'device' | 'google' | 'custom');
        } else {
          // No explicit preference - default to device timezone
          setTimezoneMode('device');
          // If the stored timezone matches device timezone, keep it
          // Otherwise, update to device timezone
          if (storedTimezone !== detectUserTimezone()) {
            handleTimezoneChange(detectUserTimezone());
          }
        }
        
        setSelectedTimezone(storedTimezone);
      }
    } catch (error) {
      console.error('Error fetching sync status:', error);
    }
  };





  const handleTimezoneChange = async (timezone: string, mode?: 'device' | 'google' | 'custom') => {
    setSelectedTimezone(timezone);
    try {
      const response = await fetch('/api/user/timezone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          timezoneId: timezone,
          timezoneMode: mode || timezoneMode 
        })
      });

      if (response.ok) {
        toast.success('Timezone updated');
      } else {
        toast.error('Failed to update timezone');
      }
    } catch (error) {
      toast.error('Failed to update timezone');
    }
  };

  const handleTimezoneModeChange = async (mode: 'device' | 'google' | 'custom') => {
    setTimezoneMode(mode);
    
    let newTimezone = selectedTimezone;
    
    switch (mode) {
      case 'device':
        newTimezone = deviceTimezone;
        break;
      case 'google':
        if (googleTimezone) {
          newTimezone = googleTimezone;
        } else {
          toast.warning('Google Calendar timezone not available. Please sync with Google Calendar first.');
          return;
        }
        break;
      case 'custom':
        // Keep current selectedTimezone
        break;
    }
    
    await handleTimezoneChange(newTimezone, mode);
  };

  const getCurrentTimezoneLabel = () => {
    switch (timezoneMode) {
      case 'device':
        const deviceInfo = getTimezoneInfo(deviceTimezone);
        return `Device Timezone: ${deviceTimezone} (${deviceInfo.offset})`;
      case 'google':
        if (googleTimezone) {
          const googleInfo = getTimezoneInfo(googleTimezone);
          return `Google Calendar: ${googleTimezone} (${googleInfo.offset})`;
        }
        return 'Google Calendar timezone not available';
      case 'custom':
        const customInfo = getTimezoneInfo(selectedTimezone);
        return `Custom: ${selectedTimezone} (${customInfo.offset})`;
      default:
        return 'Unknown';
    }
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'SYNCED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'SYNCED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Timezone Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timezone Settings
          </CardTitle>
          <CardDescription>
            Set your timezone for accurate event scheduling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Timezone Mode Selection */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Timezone Source</Label>
              <div className="grid gap-3">
                <div 
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    timezoneMode === 'device' 
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleTimezoneModeChange('device')}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      timezoneMode === 'device' ? 'border-blue-500' : 'border-gray-300'
                    }`}>
                      {timezoneMode === 'device' && (
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">Use Device Timezone</h4>
                      <p className="text-sm text-gray-600">Automatically use your device's timezone setting</p>
                      <p className="text-xs text-blue-600 mt-1">{getTimezoneInfo(deviceTimezone).name} ({getTimezoneInfo(deviceTimezone).offset})</p>
                    </div>
                  </div>
                </div>

                {syncStatus?.googleSyncEnabled && (
                  <div 
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      timezoneMode === 'google' 
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleTimezoneModeChange('google')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        timezoneMode === 'google' ? 'border-blue-500' : 'border-gray-300'
                      }`}>
                        {timezoneMode === 'google' && (
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">Sync with Google Calendar</h4>
                        <p className="text-sm text-gray-600">Use the same timezone as your Google Calendar</p>
                        {googleTimezone && (
                          <p className="text-xs text-blue-600 mt-1">{googleTimezone} ({getTimezoneInfo(googleTimezone).offset})</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div 
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    timezoneMode === 'custom' 
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleTimezoneModeChange('custom')}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      timezoneMode === 'custom' ? 'border-blue-500' : 'border-gray-300'
                    }`}>
                      {timezoneMode === 'custom' && (
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">Choose Custom Timezone</h4>
                      <p className="text-sm text-gray-600">Select a specific timezone from the dropdown</p>
                      {timezoneMode === 'custom' && (
                        <p className="text-xs text-blue-600 mt-1">{getCurrentTimezoneLabel()}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Timezone Selector */}
            {timezoneMode === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="timezone">Select Timezone</Label>
                <Select value={selectedTimezone} onValueChange={(timezone) => handleTimezoneChange(timezone, 'custom')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezoneOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Current Timezone Display */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <Label className="text-sm font-medium text-gray-700">Current Setting</Label>
              <p className="text-sm text-gray-900 mt-1">{getCurrentTimezoneLabel()}</p>
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Changing your timezone will affect how event times are displayed and synchronized.
                All existing events will be adjusted accordingly.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sync Activity */}
      {syncStatus?.recentSyncs && syncStatus.recentSyncs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Sync Activity</CardTitle>
            <CardDescription>
              Last 10 sync operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {syncStatus.recentSyncs.map((sync, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getSyncStatusIcon(sync.syncStatus)}
                    <div>
                      <p className="font-medium">{sync.syncType}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(sync.syncedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getSyncStatusColor(sync.syncStatus)}>
                      {sync.syncStatus}
                    </Badge>
                    {sync.errorMessage && (
                      <p className="text-sm text-red-600 mt-1">{sync.errorMessage}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}