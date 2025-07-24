import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Plus from "lucide-react/dist/esm/icons/plus";
import Home from "lucide-react/dist/esm/icons/home";
import Building2 from "lucide-react/dist/esm/icons/building-2";
import Clock from "lucide-react/dist/esm/icons/clock";
import { Company } from '@/types';
import { CalendarEvent, CalendarEventFormData } from '@/types/calendar.types';
import { useUserTimezone } from '@/hooks/useUserTimezone';

interface EventDialogProps {
  isDialogOpen: boolean;
  editingEvent: CalendarEvent | null;
  formData: CalendarEventFormData;
  companies: Company[];
  updateFormField: (field: keyof CalendarEventFormData, value: unknown) => void;
  handleAddEvent: () => void;
  handleUpdateEvent: () => void;
  openDialog: () => void;
  closeDialog: () => void;
  formatDateForInput: (date: Date) => string;
  parseDateFromInput: (dateString: string) => Date;
  isMutating?: boolean;
  selectedCompany?: string | number;
}

export const EventDialog: React.FC<EventDialogProps> = ({
  isDialogOpen,
  editingEvent,
  formData,
  companies,
  updateFormField,
  handleAddEvent,
  handleUpdateEvent,
  openDialog,
  closeDialog,
  formatDateForInput,
  parseDateFromInput,
  isMutating = false,
  selectedCompany
}) => {
  const isCompanyFiltered = selectedCompany !== 'all';
  const selectedCompanyObj = isCompanyFiltered ? companies.find(c => c.id === selectedCompany) : null;
  const { displayName: timezoneDisplay, loading: timezoneLoading } = useUserTimezone();
  return (
    <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
      <DialogTrigger asChild>
        <Button className="bg-black hover:bg-gray-800 w-full sm:max-w-md py-3 px-4 sm:py-4 sm:px-8 text-base sm:text-lg font-bold text-white" onClick={openDialog}>
          <Plus className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 font-bold" />
          Add Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold">
            {editingEvent ? "Edit Event" : "Add New Event"}
          </DialogTitle>
          <DialogDescription className="text-base">
            {editingEvent ? "Update your event details below" : "Create a new event for your calendar"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-6">
          {/* Event Scope Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">Event Type</Label>
            <div className="grid grid-cols-2 gap-3">
              {/* Show Company Event first when company is globally selected, Personal first otherwise */}
              {isCompanyFiltered ? (
                <>
                  <button
                    type="button"
                    onClick={() => updateFormField('eventScope', 'company')}
                    className={`relative flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      formData.eventScope === 'company'
                        ? 'border-lime-500 bg-lime-50 text-lime-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Building2 className="h-5 w-5" />
                    <span className="font-medium">Company</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateFormField('eventScope', 'personal')}
                    className={`relative flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      formData.eventScope === 'personal'
                        ? 'border-lime-500 bg-lime-50 text-lime-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Home className="h-5 w-5" />
                    <span className="font-medium">Personal</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => updateFormField('eventScope', 'personal')}
                    className={`relative flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      formData.eventScope === 'personal'
                        ? 'border-lime-500 bg-lime-50 text-lime-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Home className="h-5 w-5" />
                    <span className="font-medium">Personal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateFormField('eventScope', 'company')}
                    className={`relative flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      formData.eventScope === 'company'
                        ? 'border-lime-500 bg-lime-50 text-lime-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Building2 className="h-5 w-5" />
                    <span className="font-medium">Company</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Company info message for filtered company */}
          {isCompanyFiltered && formData.eventScope === 'company' && (
            <div className="bg-lime-50 border border-lime-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                  {selectedCompanyObj?.logo && (selectedCompanyObj.logo.startsWith('data:') || selectedCompanyObj.logo.includes('http') || selectedCompanyObj.logo.startsWith('/')) ? (
                    <img 
                      src={selectedCompanyObj.logo} 
                      alt={`${selectedCompanyObj.tradingName} logo`} 
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    selectedCompanyObj?.tradingName.charAt(0).toUpperCase()
                  )}
                </div>
                <p className="text-sm text-lime-700">
                  Using <span className="font-medium">{selectedCompanyObj?.tradingName}</span> from your current filter
                </p>
              </div>
            </div>
          )}

          {/* Company Selection - Show right after Event Scope when all companies selected and company scope chosen */}
          {formData.eventScope === 'company' && !isCompanyFiltered && (
            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-semibold text-gray-700">Select Company</Label>
              <Select
                value={formData.company}
                onValueChange={(value) => updateFormField('company', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.tradingName}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                          <div className="relative w-4 h-4 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                            {company.logo && (company.logo.startsWith('data:') || company.logo.includes('http') || company.logo.startsWith('/')) ? (
                              <img 
                                src={company.logo} 
                                alt={`${company.tradingName} logo`} 
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              company.tradingName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span>{company.tradingName}</span>
                        </div>
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          company.status === 'Active' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {company.status}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold text-gray-700">
              Event Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => updateFormField('title', e.target.value)}
              placeholder="Enter event title"
              className="w-full px-3 py-2 text-base bg-lime-50 border-lime-200 focus:bg-white"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormField('description', e.target.value)}
              placeholder="Add event details (optional)"
              className="min-h-[80px] resize-none"
            />
          </div>
          
          <div className="space-y-4 bg-white border border-gray-200 rounded-lg p-4">
            <Label className="text-sm font-semibold text-gray-700">Date & Time</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-xs text-gray-600">Date</Label>
                <div className="relative">
                  <Input
                    id="date"
                    type="date"
                    value={formatDateForInput(formData.date)}
                    onChange={(e) => updateFormField('date', parseDateFromInput(e.target.value))}
                    className="w-full pl-3 pr-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="time" className="text-xs text-gray-600">Time</Label>
                  <div className="flex items-center space-x-1 text-xs text-gray-600">
                    <Clock className="h-3 w-3" />
                    <span>{timezoneLoading ? 'Loading...' : timezoneDisplay}</span>
                  </div>
                </div>
                <div className="relative">
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => updateFormField('time', e.target.value)}
                    className="w-full pl-3 pr-10"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4 bg-white border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-xs text-gray-600">Event Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => updateFormField('type', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span>Meeting</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="deadline">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        <span>Deadline</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="renewal">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span>Renewal</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="anniversary">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full" />
                        <span>Anniversary</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="other">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full" />
                        <span>Other</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-xs text-gray-600">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => updateFormField('priority', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full" />
                        <span>Low</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                        <span>Medium</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        <span>High</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="critical">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-600 rounded-full" />
                        <span>Critical</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          
        </div>
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            {editingEvent ? "* Required field" : "* Required field"}
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={closeDialog}
              className="px-4 py-2 h-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={editingEvent ? handleUpdateEvent : handleAddEvent}
              disabled={isMutating || !formData.title}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 h-auto font-medium"
            >
              {isMutating ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                editingEvent ? "Update Event" : "Create Event"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};