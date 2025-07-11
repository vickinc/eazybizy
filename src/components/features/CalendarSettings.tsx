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
import { Calendar, Clock, RefreshCw, Settings, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getTimezoneOptions, detectUserTimezone, getTimezoneInfo } from '@/lib/timezone';

interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary: boolean;
  selected: boolean;
  accessRole: string;
  backgroundColor?: string;
  foregroundColor?: string;
}

interface SyncStatus {
  googleSyncEnabled: boolean;
  lastGoogleSync: string | null;
  googleEmail: string | null;
  timezoneId: string;
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
  const [googleCalendars, setGoogleCalendars] = useState<GoogleCalendar[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
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
        fetchGoogleCalendars();
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

  // Fetch Google calendars only when sync is enabled
  useEffect(() => {
    if (syncStatus?.googleSyncEnabled) {
      fetchGoogleCalendars();
    }
  }, [syncStatus?.googleSyncEnabled]);

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
        
        // Determine timezone mode and value based on stored timezone
        const storedTimezone = data.timezoneId || detectUserTimezone();
        if (storedTimezone === detectUserTimezone()) {
          setTimezoneMode('device');
        } else if (data.googleSyncEnabled && data.googleTimezone && storedTimezone === data.googleTimezone) {
          setTimezoneMode('google');
        } else {
          setTimezoneMode('custom');
        }
        setSelectedTimezone(storedTimezone);
      }
    } catch (error) {
      console.error('Error fetching sync status:', error);
    }
  };

  const fetchGoogleCalendars = async () => {
    try {
      const response = await fetch('/api/calendar/google/calendars');
      if (response.ok) {
        const data = await response.json();
        setGoogleCalendars(data.calendars || []);
      }
    } catch (error) {
      console.error('Error fetching Google calendars:', error);
    }
  };

  const handleConnectGoogle = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/google');
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.authUrl;
      } else {
        toast.error('Failed to connect to Google Calendar');
      }
    } catch (error) {
      toast.error('Failed to connect to Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/google', { method: 'DELETE' });
      if (response.ok) {
        setSyncStatus(null);
        setGoogleCalendars([]);
        toast.success('Google Calendar disconnected');
      } else {
        toast.error('Failed to disconnect Google Calendar');
      }
    } catch (error) {
      toast.error('Failed to disconnect Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const selectedCalendar = googleCalendars.find(cal => cal.selected);
      const response = await fetch('/api/calendar/sync/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarId: selectedCalendar?.id || 'primary' })
      });

      if (response.ok) {
        const data = await response.json();
        const deletedMsg = data.deleted > 0 ? `, ${data.deleted} deleted` : '';
        toast.success(`Sync completed: ${data.pushed} pushed, ${data.pulled} pulled${deletedMsg}`);
        if (data.errors.length > 0) {
          toast.warning(`${data.errors.length} errors occurred during sync`);
        }
        
        // Refresh sync status and trigger page refresh
        await fetchSyncStatus();
        
        // Trigger a page refresh to show new events
        window.location.reload();
      } else {
        toast.error('Failed to sync with Google Calendar');
      }
    } catch (error) {
      toast.error('Failed to sync with Google Calendar');
    } finally {
      setSyncing(false);
    }
  };

  const handleSetPrimaryCalendar = async (calendarId: string) => {
    try {
      const response = await fetch('/api/calendar/google/calendars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarId })
      });

      if (response.ok) {
        setGoogleCalendars(prev => 
          prev.map(cal => ({ ...cal, selected: cal.id === calendarId }))
        );
        toast.success('Primary calendar updated');
      } else {
        toast.error('Failed to update primary calendar');
      }
    } catch (error) {
      toast.error('Failed to update primary calendar');
    }
  };

  const handleTimezoneChange = async (timezone: string) => {
    setSelectedTimezone(timezone);
    try {
      const response = await fetch('/api/user/timezone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timezoneId: timezone })
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
    
    if (newTimezone !== selectedTimezone) {
      await handleTimezoneChange(newTimezone);
    }
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
      {/* Google Calendar Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar Integration
          </CardTitle>
          <CardDescription>
            Connect your Google Calendar for two-way synchronization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {syncStatus?.googleSyncEnabled ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Connected to Google Calendar</p>
                    <p className="text-sm text-green-600">{syncStatus.googleEmail}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnectGoogle}
                  disabled={loading}
                >
                  Disconnect
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Last Sync</Label>
                  <p className="text-sm text-gray-600">
                    {syncStatus.lastGoogleSync 
                      ? new Date(syncStatus.lastGoogleSync).toLocaleString()
                      : 'Never'
                    }
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Sync Statistics (24h)</Label>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(syncStatus.syncStats).map(([status, count]) => (
                      <Badge key={status} className={getSyncStatusColor(status)}>
                        {status}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSyncNow}
                  disabled={syncing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Connect Google Calendar</h3>
              <p className="text-gray-600 mb-4">
                Sync your events with Google Calendar for seamless integration
              </p>
              <Button
                onClick={handleConnectGoogle}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Connect Google Calendar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendar Selection */}
      {googleCalendars.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Calendar Selection</CardTitle>
            <CardDescription>
              Choose which Google Calendar to sync with
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {googleCalendars.map((calendar) => (
                <div
                  key={calendar.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    calendar.selected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleSetPrimaryCalendar(calendar.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full border-2"
                        style={{
                          backgroundColor: calendar.backgroundColor || '#3b82f6',
                          borderColor: calendar.foregroundColor || '#ffffff'
                        }}
                      />
                      <div>
                        <p className="font-medium">{calendar.summary}</p>
                        {calendar.description && (
                          <p className="text-sm text-gray-600">{calendar.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {calendar.primary && (
                        <Badge variant="secondary">Primary</Badge>
                      )}
                      {calendar.selected && (
                        <Badge>Selected</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                <Select value={selectedTimezone} onValueChange={handleTimezoneChange}>
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