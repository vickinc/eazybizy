import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { Company } from '@/types';
import { CalendarEvent, CalendarEventFormData } from '@/types/calendar.types';

interface EventDialogProps {
  isDialogOpen: boolean;
  editingEvent: CalendarEvent | null;
  formData: CalendarEventFormData;
  companies: Company[];
  updateFormField: (field: keyof CalendarEventFormData, value: any) => void;
  handleAddEvent: () => void;
  handleUpdateEvent: () => void;
  openDialog: () => void;
  closeDialog: () => void;
  formatDateForInput: (date: Date) => string;
  parseDateFromInput: (dateString: string) => Date;
  isMutating?: boolean;
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
  isMutating = false
}) => {
  return (
    <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
      <DialogTrigger asChild>
        <Button className="bg-black hover:bg-gray-800 w-full sm:max-w-md py-3 px-4 sm:py-4 sm:px-8 text-base sm:text-lg font-bold text-white" onClick={openDialog}>
          <Plus className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 font-bold" />
          Add Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editingEvent ? "Edit Event" : "Add New Event"}
          </DialogTitle>
          <DialogDescription>
            {editingEvent ? "Update event details below." : "Create a new event for your calendar."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => updateFormField('title', e.target.value)}
              placeholder="Event title"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormField('description', e.target.value)}
              placeholder="Event description"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formatDateForInput(formData.date)}
                onChange={(e) => updateFormField('date', parseDateFromInput(e.target.value))}
                className="[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:top-1/2 [&::-webkit-calendar-picker-indicator]:-translate-y-1/2 [&::-webkit-calendar-picker-indicator]:cursor-pointer relative"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => updateFormField('time', e.target.value)}
                className="[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:top-1/2 [&::-webkit-calendar-picker-indicator]:-translate-y-1/2 [&::-webkit-calendar-picker-indicator]:cursor-pointer relative"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => updateFormField('type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="renewal">Renewal</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => updateFormField('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="company">Company</Label>
            <Select
              value={formData.company}
              onValueChange={(value) => updateFormField('company', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.tradingName}>
                    <div className="flex items-center justify-between w-full">
                      <span>{company.tradingName}</span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded ${
                        company.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
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
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={closeDialog}>
            Cancel
          </Button>
          <Button 
            onClick={editingEvent ? handleUpdateEvent : handleAddEvent}
            disabled={isMutating}
          >
            {isMutating ? "Saving..." : (editingEvent ? "Update Event" : "Add Event")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};