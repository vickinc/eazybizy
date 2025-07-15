"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Building2 from "lucide-react/dist/esm/icons/building-2";
import Plus from "lucide-react/dist/esm/icons/plus";
import Home from "lucide-react/dist/esm/icons/home";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { useOptimizedDashboard } from "@/hooks/useOptimizedDashboard";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { dashboardApiService } from "@/services/api/dashboardApiService";
import { toast } from "sonner";
import { isImageLogo, validateLogo } from '@/utils/logoUtils';

export default function OptimizedDashboard() {
  const router = useRouter();
  const [copiedFields, setCopiedFields] = useState<Record<string, boolean>>({});
  
  const { data, isLoading, isError, error, refetch } = useOptimizedDashboard();
  const showLoading = useDelayedLoading(isLoading);

  // Navigation handlers
  const handleAddCompany = useCallback(() => {
    router.push('/companies/company-onboarding');
  }, [router]);

  const handleViewCompanies = useCallback(() => {
    router.push('/companies');
  }, [router]);

  const handleViewCalendar = useCallback(() => {
    router.push('/calendar');
  }, [router]);

  const handleViewCalendarWithDate = useCallback((date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    router.push(`/calendar?date=${dateString}`);
  }, [router]);

  const handleViewNotes = useCallback(() => {
    router.push('/notes');
  }, [router]);

  // Utility functions
  const copyToClipboard = useCallback(async (text: string, fieldName: string, companyId: number) => {
    const success = await dashboardApiService.copyToClipboard(text);
    if (success) {
      setCopiedFields(prev => ({ ...prev, [`${companyId}-${fieldName}`]: true }));
      toast.success(`${fieldName} copied to clipboard`);
      setTimeout(() => {
        setCopiedFields(prev => ({ ...prev, [`${companyId}-${fieldName}`]: false }));
      }, 2000);
    } else {
      toast.error(`Failed to copy ${fieldName}`);
    }
  }, []);

  const formatEventDate = useCallback((date: Date) => {
    return dashboardApiService.formatEventDate(date);
  }, []);

  const getPriorityColor = useCallback((priority: string) => {
    return dashboardApiService.getPriorityColor(priority);
  }, []);

  // Show loading screen
  if (showLoading) {
    return <LoadingScreen />;
  }

  // Handle error state
  if (isError) {
    return (
      <div className="min-h-screen bg-lime-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <div className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
            <p className="text-gray-600 mb-4">
              {error?.message || 'Failed to load dashboard data'}
            </p>
            <Button onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Extract data with defaults
  const {
    stats = {
      totalCompanies: 0,
      activeCompaniesCount: 0,
      passiveCompaniesCount: 0,
      upcomingEventsCount: 0,
      activeNotesCount: 0,
      activeBusinessCardsCount: 0,
      archivedBusinessCardsCount: 0
    },
    recentActiveCompanies = [],
    nextUpcomingEvents = [],
    activeNotes = [],
    cached = false,
    responseTime = 0
  } = data || {};

  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Home className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2">
                Welcome to your business management platform
                {cached && <span className="text-green-600 ml-2">(cached · {responseTime}ms)</span>}
              </p>
            </div>
          </div>
        </div>


        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Companies or Start Here Card */}
          {recentActiveCompanies.length === 0 ? (
            <Card 
              className="bg-lime-100 hover:bg-lime-200 transition-colors cursor-pointer"
              onClick={handleAddCompany}
            >
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                <p className="text-2xl font-bold text-gray-900 mb-2">Start here!</p>
                <p className="text-gray-600">Set up your first company</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Recent Companies</CardTitle>
                    <CardDescription>Your latest active companies</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleViewCompanies}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActiveCompanies.map((company) => (
                    <div key={company.id} className="flex items-center space-x-3 p-2 border rounded-lg hover:bg-lime-50 transition-colors">
                      <div className="flex-shrink-0">
                        {isImageLogo(company.logo) ? (
                          <img 
                            src={company.logo} 
                            alt={`${company.tradingName} logo`}
                            className="h-8 w-8 rounded object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 bg-blue-100 rounded flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-blue-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {company.tradingName}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {company.legalName}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {company.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    Upcoming Events <span className="text-sm font-normal text-gray-500">(Next 30 days)</span>
                  </CardTitle>
                  <CardDescription>Your next scheduled events</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleViewCalendar}
                >
                  View Calendar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {nextUpcomingEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No upcoming events</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {nextUpcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-lime-50 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{event.title}</p>
                        <p className="text-sm text-gray-500">{event.company}</p>
                        <p className="text-xs text-gray-400">
                          {formatEventDate(new Date(event.date))} at {event.time}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={getPriorityColor(event.priority)}>
                          {event.priority}
                        </Badge>
                        <Badge variant="secondary">
                          {event.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Notes */}
        {activeNotes.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Active Notes</CardTitle>
                  <CardDescription>Your recent notes and tasks</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleViewNotes}
                >
                  View All Notes
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeNotes.map((note) => (
                  <div key={note.id} className="p-4 border rounded-lg hover:bg-lime-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{note.title}</h4>
                      <Badge variant="outline" className={getPriorityColor(note.priority)}>
                        {note.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {note.content}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card className="bg-lime-100 border-lime-200 hover:bg-lime-200 transition-colors cursor-pointer" onClick={handleAddCompany}>
            <CardContent className="p-6 text-center">
              <Plus className="h-8 w-8 text-lime-600 mx-auto mb-2" />
              <p className="font-medium text-lime-900">Add Company</p>
              <p className="text-sm text-lime-600">Create a new company profile</p>
            </CardContent>
          </Card>
          
          <Card className="bg-lime-100 border-lime-200 hover:bg-lime-200 transition-colors cursor-pointer" onClick={handleViewCalendar}>
            <CardContent className="p-6 text-center">
              <Calendar className="h-8 w-8 text-lime-600 mx-auto mb-2" />
              <p className="font-medium text-lime-900">View Calendar</p>
              <p className="text-sm text-lime-600">Manage your events</p>
            </CardContent>
          </Card>
          
          <Card className="bg-lime-100 border-lime-200 hover:bg-lime-200 transition-colors cursor-pointer" onClick={handleViewCompanies}>
            <CardContent className="p-6 text-center">
              <Building2 className="h-8 w-8 text-lime-600 mx-auto mb-2" />
              <p className="font-medium text-lime-900">Manage Companies</p>
              <p className="text-sm text-lime-600">View all companies</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}