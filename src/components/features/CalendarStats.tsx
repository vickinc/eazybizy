import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import CalendarDays from "lucide-react/dist/esm/icons/calendar-days";
import Clock from "lucide-react/dist/esm/icons/clock";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import { CalendarEvent } from '@/types/calendar.types';

interface CalendarStatsProps {
  filteredEvents: CalendarEvent[];
  getTodaysEvents: () => CalendarEvent[];
  getThisWeekEvents: () => CalendarEvent[];
  getUpcomingEvents: () => CalendarEvent[];
}

export const CalendarStats: React.FC<CalendarStatsProps> = ({
  filteredEvents,
  getTodaysEvents,
  getThisWeekEvents,
  getUpcomingEvents
}) => {
  return (
    <TooltipProvider>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help flex flex-col h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Total Events
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-center items-center">
                <div className="text-xl sm:text-2xl font-bold">{filteredEvents.length}</div>
                <p className="text-xs text-muted-foreground">Total events in view</p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Total number of all events</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help flex flex-col h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Today
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-center items-center">
                <div className="text-xl sm:text-2xl font-bold">{getTodaysEvents().length}</div>
                <p className="text-xs text-muted-foreground">Events scheduled today</p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Number of events scheduled for today</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help flex flex-col h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  This Week
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-center items-center">
                <div className="text-xl sm:text-2xl font-bold">{getThisWeekEvents().length}</div>
                <p className="text-xs text-muted-foreground">Events this week</p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Number of events scheduled for this week (Sunday to Saturday)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help flex flex-col h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Upcoming
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-center items-center">
                <div className="text-xl sm:text-2xl font-bold">{getUpcomingEvents().length}</div>
                <p className="text-xs text-muted-foreground">Future events</p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Number of future events (after today)</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};