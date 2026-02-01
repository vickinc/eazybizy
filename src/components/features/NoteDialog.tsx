import React from 'react';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Note, NoteFormData } from '@/types/calendar.types';
import { Company } from '@/types';
import { Badge } from "@/components/ui/badge";
import { Calendar, Building2, Tag, FileText, AlertCircle } from 'lucide-react';
import { isImageLogo, validateLogo } from '@/utils/logoUtils';

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
  selectedCompany?: number | 'all';
}

export const NoteDialog: React.FC<NoteDialogProps> = ({
  editingNote,
  formData,
  companies,
  formattedEvents,
  handleInputChange,
  handleSelectChange,
  handleSubmit,
  closeDialog,
  selectedCompany = 'all'
}) => {
  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      {/* Enhanced Header */}
      <DialogHeader className="px-6 pt-6 pb-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {editingNote ? "Edit Note" : "Add New Note"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {editingNote 
                ? "Update your note details, modify content, and adjust linked information" 
                : "Create a comprehensive note with content, priority, and organizational links"
              }
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-6">
        {/* Company Selection Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-lime-300 rounded-full"></div>
              Company Association
            </h3>
            <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full font-medium">
              Optional
            </span>
          </div>
          <div>
            <Label htmlFor="companyId" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Building2 className="h-4 w-4" />
              Related Company
            </Label>
            <Select 
              value={formData.companyId} 
              onValueChange={(value) => handleSelectChange("companyId", value)}
            >
              <SelectTrigger id="companyId" className="mt-1">
                <SelectValue placeholder="Choose a company to link this note to" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="py-2 text-gray-500">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    No company selected
                  </div>
                </SelectItem>
                {companies.filter(c => c.status === "Active").map((company) => (
                  <SelectItem key={company.id} value={company.id.toString()} className="py-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded flex items-center justify-center text-xs font-bold text-white overflow-hidden ${
                        isImageLogo(company.logo)
                          ? '' 
                          : 'bg-blue-600'
                      }`}>
                        {isImageLogo(company.logo) ? (
                          <img 
                            src={company.logo} 
                            alt={`${company.tradingName} logo`} 
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <span className="text-xs">
                            {validateLogo(company.logo, company.tradingName)}
                          </span>
                        )}
                      </div>
                      <span className="font-medium">{company.tradingName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">Link this note to a specific company for better organization</p>
          </div>
        </div>

        {/* Basic Information Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-lime-300 rounded-full"></div>
            Basic Information
          </h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FileText className="h-4 w-4" />
                Note Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter a clear and descriptive title for your note"
                required
                className="mt-1 bg-lime-50 border-lime-200 focus:bg-white"
              />
              <p className="text-xs text-gray-500 mt-1">Choose a title that summarizes the main purpose of this note</p>
            </div>
            
            <div>
              <Label htmlFor="content" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FileText className="h-4 w-4" />
                Note Content <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Write detailed note content here. Include all relevant information, ideas, or observations..."
                rows={4}
                required
                className="mt-1 resize-none bg-lime-50 border-lime-200 focus:bg-white"
              />
              <p className="text-xs text-gray-500 mt-1">Add comprehensive details to make this note useful for future reference</p>
            </div>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-lime-300 rounded-full"></div>
            Note Configuration
          </h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="isStandalone" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Tag className="h-4 w-4" />
                Note Type
              </Label>
              <Select 
                value={formData.isStandalone.toString()} 
                onValueChange={(value) => handleSelectChange("isStandalone", value)}
              >
                <SelectTrigger id="isStandalone" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true" className="py-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-600" />
                      <div>
                        <div className="font-medium">Standalone Note</div>
                        <div className="text-xs text-gray-500">Independent note not linked to any event</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="false" className="py-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="font-medium">Event-Related Note</div>
                        <div className="text-xs text-gray-500">Note connected to a specific calendar event</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Choose whether this note stands alone or relates to an event</p>
            </div>

            <div>
              <Label htmlFor="priority" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <AlertCircle className="h-4 w-4" />
                Priority Level
              </Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => handleSelectChange("priority", value as "low" | "medium" | "high" | "critical")}
              >
                <SelectTrigger id="priority" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low" className="py-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs px-2 py-1 shrink-0">Low</Badge>
                      <span className="text-sm">General information</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium" className="py-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 shrink-0">Medium</Badge>
                      <span className="text-sm">Important but not urgent</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="high" className="py-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs px-2 py-1 shrink-0">High</Badge>
                      <span className="text-sm">Important and time-sensitive</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="critical" className="py-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs px-2 py-1 shrink-0">Critical</Badge>
                      <span className="text-sm">Urgent action required</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Set priority to help organize and filter your notes</p>
            </div>
          </div>
        </div>

        {/* Event & Tagging Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-lime-300 rounded-full"></div>
              Event & Tagging
            </h3>
            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full font-medium">
              Optional
            </span>
          </div>
          <div className="space-y-4">
            {!formData.isStandalone && (
              <div>
                <Label htmlFor="eventId" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Calendar className="h-4 w-4" />
                  Related Event
                </Label>
                <Select 
                  value={formData.eventId} 
                  onValueChange={(value) => handleSelectChange("eventId", value)}
                >
                  <SelectTrigger id="eventId" className="mt-1">
                    <SelectValue placeholder="Choose an event to link this note to" />
                  </SelectTrigger>
                  <SelectContent>
                    {formattedEvents.length === 0 ? (
                      <SelectItem value="none" className="py-2 text-gray-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          No events available
                        </div>
                      </SelectItem>
                    ) : (
                      <>
                        <SelectItem value="none" className="py-2 text-gray-500">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            No event selected
                          </div>
                        </SelectItem>
                        {formattedEvents.map((event) => (
                          <SelectItem key={event.id} value={event.id} className="py-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-blue-500" />
                              <span className="truncate font-medium">{event.displayText}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Connect this note to a specific calendar event for context</p>
              </div>
            )}

            <div>
              <Label htmlFor="tags" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Tag className="h-4 w-4" />
                Tags
              </Label>
              <Input
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="e.g., meeting, important, follow-up, urgent, project-alpha"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Add comma-separated tags to organize and quickly find your notes. Use descriptive keywords.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={closeDialog}
            className="px-6"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 px-6"
          >
            {editingNote ? "Update Note" : "Create Note"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};