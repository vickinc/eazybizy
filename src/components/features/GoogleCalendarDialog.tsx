"use client";

import React, { useState, useEffect } from "react";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import Settings from "lucide-react/dist/esm/icons/settings";
import Zap from "lucide-react/dist/esm/icons/zap";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Skeleton, LoadingSpinner } from "@/components/ui/loading-states";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GoogleCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
  googleEmail?: string;
  lastGoogleSync?: string;
  syncStats: {
    [key: string]: number;
  };
}

// Skeleton components for loading states
const ConnectionStatusSkeleton = () => (
  <div className="p-4 rounded-lg border">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-5 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  </div>
);

const SyncInfoSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="space-y-2">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-32" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  </div>
);

const CalendarSelectionSkeleton = () => (
  <div className="space-y-4">
    <div>
      <Skeleton className="h-6 w-32 mb-2" />
      <Skeleton className="h-4 w-48" />
    </div>
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <div key={i} className="p-3 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-4 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export function GoogleCalendarDialog({ open, onOpenChange }: GoogleCalendarDialogProps) {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [googleCalendars, setGoogleCalendars] = useState<GoogleCalendar[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [calendarsLoading, setCalendarsLoading] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [defaultCalendarId, setDefaultCalendarId] = useState<string>('primary');

  useEffect(() => {
    if (open) {
      setInitialLoading(true);
      setCalendarsLoading(false);
      fetchSyncStatus();
    }
  }, [open]);

  // Fetch Google calendars only when sync is enabled
  useEffect(() => {
    if (syncStatus?.googleSyncEnabled) {
      fetchGoogleCalendars();
      fetchAutoSyncSettings();
    }
  }, [syncStatus?.googleSyncEnabled]);

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('/api/calendar/sync/google');
      if (response.ok) {
        const data = await response.json();
        setSyncStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchGoogleCalendars = async () => {
    setCalendarsLoading(true);
    try {
      const response = await fetch('/api/calendar/google/calendars');
      if (response.ok) {
        const data = await response.json();
        const calendars = data.calendars || [];
        setGoogleCalendars(calendars);
        
        // Set primary calendar as default if no default is set
        const primaryCalendar = calendars.find(cal => cal.primary);
        if (primaryCalendar && defaultCalendarId === 'primary') {
          setDefaultCalendarId(primaryCalendar.id);
        }
      }
    } catch (error) {
      console.error('Error fetching Google calendars:', error);
    } finally {
      setCalendarsLoading(false);
    }
  };

  const fetchAutoSyncSettings = async () => {
    try {
      const response = await fetch('/api/calendar/sync/settings');
      if (response.ok) {
        const data = await response.json();
        setAutoSyncEnabled(data.autoSyncEnabled !== false);
        setDefaultCalendarId(data.defaultCalendarId || 'primary');
      }
    } catch (error) {
      console.error('Error fetching auto-sync settings:', error);
    }
  };

  const saveAutoSyncSettings = async (autoSync: boolean, defaultCalendar?: string) => {
    try {
      const response = await fetch('/api/calendar/sync/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          autoSyncEnabled: autoSync,
          defaultCalendarId: defaultCalendar || defaultCalendarId
        })
      });
      
      if (response.ok) {
        toast.success('Settings saved successfully');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving auto-sync settings:', error);
      toast.error('Failed to save settings');
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
      console.error('Failed to connect Google Calendar:', error);
      toast.error('Failed to connect to Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar? This will stop syncing events.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/google', { method: 'DELETE' });
      if (response.ok) {
        setSyncStatus({ googleSyncEnabled: false, syncStats: {} });
        toast.success('Google Calendar disconnected');
      } else {
        toast.error('Failed to disconnect Google Calendar');
      }
    } catch (error) {
      console.error('Failed to disconnect Google Calendar:', error);
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
        
        // Refresh sync status
        await fetchSyncStatus();
        
        // Trigger a page refresh to show new events
        window.location.reload();
      } else {
        toast.error('Failed to sync with Google Calendar');
      }
    } catch (error) {
      console.error('Failed to sync calendar:', error);
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

  const handleBulkSync = async (syncType: 'all' | 'auto-generated') => {
    setSyncing(true);
    try {
      const response = await fetch('/api/calendar/sync/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          syncType,
          targetCalendarId: googleCalendars.find(cal => cal.selected)?.id || 'primary'
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Bulk sync completed: ${data.synced} events synced`);
        await fetchSyncStatus();
      } else {
        toast.error('Failed to perform bulk sync');
      }
    } catch (error) {
      console.error('Failed to bulk sync:', error);
      toast.error('Failed to perform bulk sync');
    } finally {
      setSyncing(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Google Calendar Integration</DialogTitle>
          <DialogDescription>
            Connect your Google Calendar for two-way synchronization of events
          </DialogDescription>
        </DialogHeader>
        
        {initialLoading ? (
          <div className="space-y-6">
            <div className="text-center py-4">
              <LoadingSpinner size="lg" text="Loading Google Calendar status..." />
            </div>
            <ConnectionStatusSkeleton />
            <SyncInfoSkeleton />
            <div className="flex justify-center">
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
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
                
                {/* Calendar Selection */}
                {calendarsLoading ? (
                  <>
                    <Separator />
                    <div className="text-center py-4">
                      <LoadingSpinner text="Loading calendars..." />
                    </div>
                    <CalendarSelectionSkeleton />
                  </>
                ) : googleCalendars.length > 0 ? (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-lg font-medium">Calendar Selection</h4>
                        <p className="text-sm text-gray-600">Choose which Google Calendar to sync with</p>
                      </div>
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
                    </div>
                  </>
                ) : null}
                
                {/* Bulk Sync Options */}
                <Separator />
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-medium flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Bulk Sync Options
                    </h4>
                    <p className="text-sm text-gray-600">Manage sync settings for all events</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      onClick={() => handleBulkSync('all')}
                      disabled={syncing}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                      {syncing ? 'Syncing...' : 'Sync All Events'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleBulkSync('auto-generated')}
                      disabled={syncing}
                      className="flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      {syncing ? 'Syncing...' : 'Sync Auto-Generated Only'}
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${autoSyncEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <div>
                          <Label className="text-sm font-medium">Auto-sync new events</Label>
                          <p className="text-xs text-gray-600">
                            {autoSyncEnabled 
                              ? 'New events will automatically sync to Google Calendar' 
                              : 'New events will not sync automatically'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${autoSyncEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                          {autoSyncEnabled ? 'ON' : 'OFF'}
                        </span>
                        <Switch
                          checked={autoSyncEnabled}
                          onCheckedChange={async (checked) => {
                            setAutoSyncEnabled(checked);
                            await saveAutoSyncSettings(checked);
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Default calendar for new events</Label>
                      <Select 
                        value={defaultCalendarId}
                        onValueChange={async (value) => {
                          setDefaultCalendarId(value);
                          await saveAutoSyncSettings(autoSyncEnabled, value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select default calendar" />
                        </SelectTrigger>
                        <SelectContent>
                          {googleCalendars.map((calendar) => (
                            <SelectItem key={calendar.id} value={calendar.id}>
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4" />
                                <span>{calendar.summary}</span>
                                {calendar.primary && (
                                  <span className="text-xs text-blue-600">(Primary)</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}