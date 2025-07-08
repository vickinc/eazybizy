"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Building2, Calendar, StickyNote, CreditCard, Plus, TrendingUp, Clock, CalendarDays, FileText, AlertCircle, Copy, ExternalLink, Home } from "lucide-react";
import { useCompanyFilter } from "@/contexts/CompanyFilterContext";
import { useHomeDashboard } from "@/hooks/useHomeDashboard";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { Company } from '@/types/company.types';
import { CalendarEvent, Note } from '@/types/calendar.types';
import { isImageLogo, validateLogo } from '@/utils/logoUtils';

export default function Dashboard() {
  const router = useRouter();
  const { selectedCompany: globalSelectedCompany } = useCompanyFilter();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);

  // Fetch all dashboard data from database
  const {
    companies,
    activeCompanies,
    recentActiveCompanies,
    nextUpcomingEvents,
    stats,
    isLoading,
    isError,
    error,
    refetch
  } = useHomeDashboard(globalSelectedCompany);

  // Use delayed loading to prevent flash for cached data
  const showLoader = useDelayedLoading(isLoading);

  // Get current filter info
  const selectedCompanyObj = globalSelectedCompany !== 'all' ? companies.find(c => c.id === globalSelectedCompany) : null;
  const isFiltered = globalSelectedCompany !== 'all';

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "meeting":
        return <Clock className="h-4 w-4" />;
      case "deadline":
        return <AlertCircle className="h-4 w-4" />;
      case "renewal":
        return <CalendarDays className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-50 border-red-200 text-red-800";
      case "high":
        return "bg-orange-50 border-orange-200 text-orange-800";
      case "medium":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      default:
        return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  // Format date for display
  const formatEventDate = (date: Date) => {
    const eventDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // Reset hours for comparison
    eventDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    
    if (eventDate.getTime() === today.getTime()) {
      return "Today";
    } else if (eventDate.getTime() === tomorrow.getTime()) {
      return "Tomorrow";
    } else {
      return eventDate.toLocaleDateString('en-GB');
    }
  };

  const handleAddCompany = () => {
    router.push('/companies/company-onboarding');
  };

  const handleViewCompanies = () => {
    router.push('/companies');
  };

  const handleViewCalendar = () => {
    router.push('/calendar');
  };

  const handleViewCalendarWithDate = (date: Date) => {
    // Save the selected date to localStorage so the calendar can navigate to it
    localStorage.setItem('calendar-selected-date', date.toISOString());
    router.push('/calendar');
  };

  const handleCompanyClick = (company: Company) => {
    setSelectedCompany(company);
    setIsCompanyDialogOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
      console.log(`${label} copied to clipboard`);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // Handle loading state
  if (showLoader) {
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
            <p className="text-sm sm:text-base text-gray-600 mt-2">Welcome to your business management platform</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 sm:mb-8">
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Building2 className="h-4 w-4 mr-2" />
                    Total Companies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{isLoading ? "..." : stats.totalCompanies}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeCompaniesCount} Active, {stats.passiveCompaniesCount} Passive
                  </p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Total number of companies in your portfolio (Active + Passive)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Upcoming Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{isLoading ? "..." : stats.upcomingEventsCount}</div>
                  <p className="text-xs text-muted-foreground">
                    Next 30 days
                  </p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Number of events scheduled in the next 30 days</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <StickyNote className="h-4 w-4 mr-2" />
                    Active Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{isLoading ? "..." : stats.activeNotesCount}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeNotesCount > 0 ? "View all notes" : "No active notes"}
                  </p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Number of incomplete notes (Standalone + Event-Related)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Business Cards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{isLoading ? "..." : stats.activeBusinessCardsCount}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeBusinessCardsCount > 0 ? 
                      `${stats.activeBusinessCardsCount} active, ${stats.archivedBusinessCardsCount} archived` : 
                      "Ready to download"
                    }
                  </p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Number of active business cards (not archived)</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Companies or Start Here Card */}
        {activeCompanies.length === 0 && !isLoading ? (
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
              <CardTitle>
                {isFiltered ? `${selectedCompanyObj?.tradingName || 'Selected Company'}` : 'Your Companies'}
              </CardTitle>
              <CardDescription>
                {isFiltered ? 'Filtered view' : 'Manage your business portfolio'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg animate-pulse">
                      <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-24"></div>
                      </div>
                      <div className="w-16 h-6 bg-gray-300 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : activeCompanies.length > 0 ? (
                <div className="space-y-4">
                  {recentActiveCompanies.map((company, index) => {
                    const colors = ['bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-orange-600', 'bg-red-600'];
                    const bgColor = colors[index % colors.length];
                    
                    return (
                      <div 
                        key={company.id} 
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => handleCompanyClick(company)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden ${
                            isImageLogo(company.logo)
                              ? '' 
                              : bgColor
                          }`}>
                            {isImageLogo(company.logo) ? (
                              <img 
                                src={company.logo} 
                                alt={`${company.tradingName} logo`} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white font-bold text-sm">{validateLogo(company.logo, company.tradingName)}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{company.tradingName}</p>
                            <p className="text-sm text-gray-600">{company.registrationNo}</p>
                          </div>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className="bg-green-100 text-green-800"
                        >
                          Active
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : companies.length > 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">No active companies</p>
                  <p className="text-sm text-gray-500">All your companies are currently passive</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">No companies added yet</p>
                  <p className="text-sm text-gray-500">Get started by adding your first company</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button className="flex-1" variant="outline" onClick={handleAddCompany}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Company
                </Button>
                <Button className="flex-1" variant="outline" onClick={handleViewCompanies}>
                  View All
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isFiltered ? `${selectedCompanyObj?.tradingName || 'Selected Company'} Events` : 'Upcoming Events'}
            </CardTitle>
            <CardDescription>
              {isFiltered ? 'Events for selected company' : 'Don\'t miss important deadlines'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg animate-pulse">
                    <div className="w-5 h-5 bg-gray-300 rounded mt-0.5"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 rounded w-40 mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-24"></div>
                    </div>
                  </div>
                ))}
        </div>
            ) : nextUpcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {nextUpcomingEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:shadow-md transition-shadow ${getPriorityColor(event.priority)}`}
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="mt-0.5">
                      {getTypeIcon(event.type)}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-gray-900 mb-1">
                        {formatEventDate(event.date)}, {event.time}
                      </p>
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-medium">
                          {event.title}
                          {event.company && (
                            <span className="text-sm font-normal"> - {event.company}</span>
                          )}
                        </p>
                        <Badge variant="outline" className="text-xs capitalize">
                          {event.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">No upcoming events</p>
                <p className="text-sm text-gray-500">Stay organized by adding events to your calendar</p>
              </div>
            )}

            <Button className="w-full mt-4" variant="outline" onClick={handleViewCalendar}>
              <Calendar className="w-4 h-4 mr-2" />
              View Full Calendar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              {selectedEvent && (
                <>
                  <div className="flex-shrink-0">
                    {getTypeIcon(selectedEvent.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold">{selectedEvent.title}</p>
                    <p className="text-sm text-gray-600">{formatEventDate(selectedEvent.date)} at {selectedEvent.time}</p>
                  </div>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Event details and information
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Date</p>
                  <p className="text-sm text-gray-900">{selectedEvent.date.toLocaleDateString('en-GB')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Time</p>
                  <p className="text-sm text-gray-900">{selectedEvent.time}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Type</p>
                  <Badge variant="outline" className="text-xs capitalize w-fit">
                    {selectedEvent.type}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Priority</p>
                  <Badge className={`text-xs w-fit ${getPriorityColor(selectedEvent.priority)}`}>
                    {selectedEvent.priority}
                  </Badge>
                </div>
              </div>
              
              {selectedEvent.company && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Company</p>
                  <p className="text-sm text-gray-900">{selectedEvent.company}</p>
                </div>
              )}
              
              {selectedEvent.description && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Description</p>
                  <p className="text-sm text-gray-900">{selectedEvent.description}</p>
                </div>
              )}
              
              {selectedEvent.participants && selectedEvent.participants.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Participants</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedEvent.participants.map((participant, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {participant}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => selectedEvent && handleViewCalendarWithDate(selectedEvent.date)}>
              <Calendar className="w-4 h-4 mr-2" />
              View in Calendar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Company Details Dialog */}
      <Dialog open={isCompanyDialogOpen} onOpenChange={setIsCompanyDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              {selectedCompany && (
                <>
                  <div className={`w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden ${
                    isImageLogo(selectedCompany.logo)
                      ? '' 
                      : 'bg-blue-600'
                  }`}>
                    {isImageLogo(selectedCompany.logo) ? (
                      <img 
                        src={selectedCompany.logo} 
                        alt={`${selectedCompany.tradingName} logo`} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-lg">{validateLogo(selectedCompany.logo, selectedCompany.tradingName)}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold">{selectedCompany.tradingName}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-600">{selectedCompany.legalName}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(selectedCompany.legalName, 'Legal name')}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Company information and details
            </DialogDescription>
          </DialogHeader>
          
          {selectedCompany && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Registration No.</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-900">{selectedCompany.registrationNo}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(selectedCompany.registrationNo, 'Registration number')}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Status</p>
                  <Badge 
                    className={`${selectedCompany.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {selectedCompany.status}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Registration Date</p>
                  <p className="text-sm text-gray-900">
                    {selectedCompany.registrationDate ? new Date(selectedCompany.registrationDate).toLocaleDateString('en-GB') : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Country</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-900">{selectedCompany.countryOfRegistration || 'N/A'}</p>
                    {selectedCompany.countryOfRegistration && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(selectedCompany.countryOfRegistration, 'Country')}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {selectedCompany.businessLicenseNr && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Business License</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-900">{selectedCompany.businessLicenseNr}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(selectedCompany.businessLicenseNr!, 'Business license number')}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              
              <div>
                <p className="text-sm font-medium text-gray-700">Industry</p>
                <p className="text-sm text-gray-900">{selectedCompany.industry}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Address</p>
                <div className="flex items-start">
                  <p className="text-sm text-gray-900">{selectedCompany.address}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(selectedCompany.address, 'Address')}
                    className="h-6 w-6 p-0 ml-2"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Phone</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-900">{selectedCompany.phone}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(selectedCompany.phone, 'Phone number')}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Email</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-900">{selectedCompany.email}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(selectedCompany.email, 'Email')}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Website</p>
                <div className="flex items-center space-x-2">
                  <a 
                    href={selectedCompany.website.startsWith('http') ? selectedCompany.website : `https://${selectedCompany.website}`}
          target="_blank"
          rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center space-x-1"
                  >
                    <span>{selectedCompany.website}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(selectedCompany.website, 'Website')}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}