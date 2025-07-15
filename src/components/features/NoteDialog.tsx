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
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader className="space-y-3">
        <DialogTitle className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          {editingNote ? "Edit Note" : "Add New Note"}
        </DialogTitle>
        <DialogDescription className="text-gray-600 leading-relaxed">
          {editingNote ? "Update your note details and modify any linked information." : "Create a new note with rich content and link it to events and companies for better organization."}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-6 pt-2">
        {/* Company Selection Section */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Company Selection</h3>
            <div>
              <Label htmlFor="companyId" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Related Company
              </Label>
              <Select 
                value={formData.companyId} 
                onValueChange={(value) => handleSelectChange("companyId", value)}
              >
                <SelectTrigger className="mt-1 h-11">
                  <SelectValue placeholder="Choose a company to link this note to" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="py-3 text-gray-500">
                    No company selected
                  </SelectItem>
                  {companies.filter(c => c.status === "Active").map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()} className="py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold text-white overflow-hidden ${
                          isImageLogo(company.logo)
                            ? '' 
                            : 'bg-gradient-to-br from-blue-500 to-purple-600'
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
            </div>
          </div>

          {/* Basic Information Section */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter a descriptive title for your note"
                  required
                  className="mt-1 h-11"
                />
              </div>
              
              <div>
                <Label htmlFor="content" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Content <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Write your note content here..."
                  rows={5}
                  required
                  className="mt-1 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Configuration Section */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="isStandalone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Note Type
                </Label>
                <Select 
                  value={formData.isStandalone.toString()} 
                  onValueChange={(value) => handleSelectChange("isStandalone", value)}
                >
                  <SelectTrigger className="mt-1 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true" className="py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>Standalone Note</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="false" className="py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Event-Related Note</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Priority
                </Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => handleSelectChange("priority", value as "low" | "medium" | "high" | "critical")}
                >
                  <SelectTrigger className="mt-1 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low" className="py-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Low</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="medium" className="py-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="high" className="py-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">High</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="critical" className="py-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-red-100 text-red-800">Critical</Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Additional Options Section */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Options</h3>
            <div className="space-y-4">
              {!formData.isStandalone && (
                <div>
                  <Label htmlFor="eventId" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Related Event
                  </Label>
                  <Select 
                    value={formData.eventId} 
                    onValueChange={(value) => handleSelectChange("eventId", value)}
                  >
                    <SelectTrigger className="mt-1 h-11">
                      <SelectValue placeholder="Choose an event to link this note to" />
                    </SelectTrigger>
                    <SelectContent>
                      {formattedEvents.length === 0 ? (
                        <SelectItem value="none" className="py-3 text-gray-500">
                          No events available
                        </SelectItem>
                      ) : (
                        <>
                          <SelectItem value="none" className="py-3 text-gray-500">
                            No event selected
                          </SelectItem>
                          {formattedEvents.map((event) => (
                            <SelectItem key={event.id} value={event.id} className="py-3">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-blue-500" />
                                <span className="truncate">{event.displayText}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="tags" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags (comma separated)
                </Label>
                <Input
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="e.g., meeting, important, follow-up, urgent"
                  className="mt-1 h-11"
                />
                <p className="mt-1 text-xs text-gray-500">Use tags to organize and search your notes effectively</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button 
            type="button" 
            variant="outline" 
            onClick={closeDialog}
            className="px-6 py-2.5 h-auto"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2.5 h-auto font-medium"
          >
            {editingNote ? "Update Note" : "Add Note"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};