"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Building2 from "lucide-react/dist/esm/icons/building-2";
import Plus from "lucide-react/dist/esm/icons/plus";
import Home from "lucide-react/dist/esm/icons/home";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import { useCompanyFilter } from "@/contexts/CompanyFilterContext";
import { useDashboardManagement } from "@/hooks/useDashboardManagement";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { CompanyDetailsDialog } from "@/components/features/CompanyDetailsDialog";
import { EventDetailsDialog } from "@/components/features/EventDetailsDialog";
import { DashboardStats } from "@/components/features/DashboardStats";
import { isImageLogo, validateLogo } from '@/utils/logoUtils';

export default function Dashboard() {
  const { selectedCompany: globalSelectedCompany } = useCompanyFilter();
  
  // Use dashboard management hook
  const {
    // Data
    companies,
    activeCompanies,
    recentActiveCompanies,
    nextUpcomingEvents,
    stats,
    isLoading,
    isError,
    error,
    refetch,
    
    // UI State
    selectedCompany,
    isCompanyDialogOpen,
    selectedEvent,
    isEventDialogOpen,
    copiedFields,
    
    // Handlers
    handleAddCompany,
    handleViewCompanies,
    handleViewCalendar,
    handleViewCalendarWithDate,
    handleCompanyClick,
    handleEventClick,
    setIsCompanyDialogOpen,
    setIsEventDialogOpen,
    copyToClipboard,
    formatEventDate,
    getPriorityColor,
    getTypeIcon,
  } = useDashboardManagement(globalSelectedCompany);

  // Use delayed loading to prevent flash for cached data
  const showLoader = useDelayedLoading(isLoading);

  // Get current filter info
  const selectedCompanyObj = globalSelectedCompany !== 'all' ? companies.find(c => c.id === globalSelectedCompany) : null;
  const isFiltered = globalSelectedCompany !== 'all';


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
      <DashboardStats stats={stats} isLoading={isLoading} />

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
      <EventDetailsDialog
        event={selectedEvent}
        isOpen={isEventDialogOpen}
        onOpenChange={setIsEventDialogOpen}
        onViewInCalendar={handleViewCalendarWithDate}
        formatEventDate={formatEventDate}
        getPriorityColor={getPriorityColor}
        getTypeIcon={getTypeIcon}
      />

      {/* Company Details Dialog */}
      <CompanyDetailsDialog
        company={selectedCompany}
        isOpen={isCompanyDialogOpen}
        onOpenChange={setIsCompanyDialogOpen}
        copiedFields={copiedFields}
        onCopyToClipboard={copyToClipboard}
      />
      </div>
    </div>
  );
}