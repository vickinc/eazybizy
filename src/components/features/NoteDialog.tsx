import React from 'react';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Note, NoteFormData } from '@/types/calendar.types';
import { Company } from '@/types';

interface FormattedEvent {
  id: string;
  displayText: string;
}

interface NoteDialogProps {
  editingNote: Note | null;
  formData: NoteFormData;
  companies: Company[];
  formattedEvents: FormattedEvent[];
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (field: string, value: string | boolean) => void;
  handleSubmit: (e: React.FormEvent) => void;
  closeDialog: () => void;
}

export const NoteDialog: React.FC<NoteDialogProps> = ({
  editingNote,
  formData,
  companies,
  formattedEvents,
  handleInputChange,
  handleSelectChange,
  handleSubmit,
  closeDialog
}) => {
  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{editingNote ? "Edit Note" : "Add New Note"}</DialogTitle>
        <DialogDescription>
          {editingNote ? "Update your note details" : "Create a new note. You can link it to events and companies."}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter note title"
              required
            />
          </div>
          
          <div className="col-span-2">
            <Label htmlFor="content">
              Content <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Enter note content"
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="isStandalone">Note Type</Label>
            <Select 
              value={formData.isStandalone.toString()} 
              onValueChange={(value) => handleSelectChange("isStandalone", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Standalone Note</SelectItem>
                <SelectItem value="false">Event-Related Note</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select 
              value={formData.priority} 
              onValueChange={(value) => handleSelectChange("priority", value as "low" | "medium" | "high" | "critical")}
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

          {!formData.isStandalone && (
            <div>
              <Label htmlFor="eventId">Related Event</Label>
              <Select 
                value={formData.eventId} 
                onValueChange={(value) => handleSelectChange("eventId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                  {formattedEvents.length === 0 ? (
                    <SelectItem value="none">No events available</SelectItem>
                  ) : (
                    <>
                      <SelectItem value="none">No event selected</SelectItem>
                      {formattedEvents.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.displayText}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="companyId">Related Company</Label>
            <Select 
              value={formData.companyId} 
              onValueChange={(value) => handleSelectChange("companyId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No company selected</SelectItem>
                {companies.filter(c => c.status === "Active").map((company) => (
                  <SelectItem key={company.id} value={company.id.toString()}>
                    {company.tradingName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="meeting, important, follow-up"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={closeDialog}>
            Cancel
          </Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            {editingNote ? "Update Note" : "Add Note"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};