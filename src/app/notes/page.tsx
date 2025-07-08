"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StickyNote, Plus } from "lucide-react";
import { useCompanyFilter } from "@/contexts/CompanyFilterContext";
import { useNotesManagementDB } from "@/hooks/useNotesManagementDB";
import { NotesFilterBar } from "@/components/features/NotesFilterBar";
import { NoteDialog } from "@/components/features/NoteDialog";
import { NoteList } from "@/components/features/NoteList";
import { NoteDetailsDialog } from "@/components/features/NoteDetailsDialog";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";

export default function Notes() {
  const { selectedCompany: globalSelectedCompany, companies } = useCompanyFilter();
  
  // Clean up any old localStorage data on first load
  React.useEffect(() => {
    try {
      localStorage.removeItem('app-notes');
      localStorage.removeItem('notes-migration-completed');
    } catch (error) {
      // Ignore storage cleanup errors
    }
  }, []);
  
  const {
    // Data
    filteredNotes,
    formattedEvents,
    
    // UI State
    isDialogOpen,
    editingNote,
    selectedNote,
    isDetailsDialogOpen,
    showArchived,
    
    // Filter State
    searchTerm,
    filterType,
    filterPriority,
    sortBy,
    
    // Form State
    formData,
    
    // Actions
    handleEditNote,
    handleDeleteNote,
    handleCompleteNote,
    handleRestoreNote,
    openDialog,
    closeDialog,
    openDetailsDialog,
    closeDetailsDialog,
    toggleArchiveView,
    
    // Form Actions
    handleInputChange,
    handleSelectChange,
    handleSubmit,
    
    // Filter Actions
    setSearchTerm,
    setFilterType,
    setFilterPriority,
    setSortBy,
    
    // Utility Functions
    getPriorityColor,
    getCompanyName,
    getFormattedEvent,
    navigateToCalendar,
    
    // Loading & Error States
    isLoading,
    isError,
    error,
    
    // Data Refresh
    refetch
  } = useNotesManagementDB(globalSelectedCompany, companies);

  // Get current filter info
  const selectedCompanyObj = globalSelectedCompany !== 'all' ? companies.find(c => c.id === globalSelectedCompany) : null;
  const isFiltered = globalSelectedCompany !== 'all';

  // Use delayed loading to prevent flash for cached data
  const showLoader = useDelayedLoading(isLoading);

  // Handle loading state
  if (showLoader) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Error State */}
        {isError && (
          <div className="mb-6">
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load notes: {error?.message || 'Unknown error'}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetch()}
                  className="ml-2"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <StickyNote className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                {isFiltered ? 
                  `${selectedCompanyObj?.tradingName || 'Selected Company'} ${showArchived ? "Archived Notes" : "Notes"}` : 
                  (showArchived ? "Archived Notes" : "Notes")
                }
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2">
                {isFiltered ? 
                  `${showArchived ? "Archived notes" : "Notes"} for ${selectedCompanyObj?.tradingName || 'selected company'}` :
                  (showArchived 
                    ? "View and manage your archived notes" 
                    : "Manage your notes and link them to events and companies"
                  )
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={showArchived ? "default" : "outline"}
              onClick={toggleArchiveView}
              className={showArchived ? "bg-gray-600 hover:bg-gray-700" : ""}
            >
              {showArchived ? "View Active" : "View Archive"}
            </Button>
            {!showArchived && (
              <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
                <NoteDialog 
                  editingNote={editingNote}
                  formData={formData}
                  companies={companies}
                  formattedEvents={formattedEvents}
                  handleInputChange={handleInputChange}
                  handleSelectChange={(field: string, value: string | boolean) => {
                    if (field === "isStandalone") {
                      handleSelectChange(field, value === "true" || value === true);
                    } else {
                      handleSelectChange(field, value as string);
                    }
                  }}
                  handleSubmit={handleSubmit}
                  closeDialog={closeDialog}
                />
              </Dialog>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <NotesFilterBar 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterType={filterType}
        setFilterType={setFilterType}
        filterPriority={filterPriority}
        setFilterPriority={setFilterPriority}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      {/* Add Note Button */}
      {!showArchived && (
        <div className="mb-6 flex justify-start">
          <Button 
            className="bg-black hover:bg-gray-800 w-full sm:max-w-md py-3 px-4 sm:py-4 sm:px-8 text-base sm:text-lg font-bold text-white" 
            onClick={openDialog}
          >
            <Plus className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 font-bold" />
            Add Note
          </Button>
        </div>
      )}

      {/* Notes List */}
      <NoteList 
        filteredNotes={filteredNotes}
        showArchived={showArchived}
        getFormattedEvent={getFormattedEvent}
        getPriorityColor={getPriorityColor}
        getCompanyName={getCompanyName}
        handleRestoreNote={handleRestoreNote}
        handleCompleteNote={handleCompleteNote}
        handleEditNote={handleEditNote}
        handleDeleteNote={handleDeleteNote}
        openDetailsDialog={openDetailsDialog}
        openDialog={openDialog}
      />

      {/* Note Details Dialog */}
      <NoteDetailsDialog 
        isDetailsDialogOpen={isDetailsDialogOpen}
        closeDetailsDialog={closeDetailsDialog}
        selectedNote={selectedNote}
        getFormattedEvent={getFormattedEvent}
        getPriorityColor={getPriorityColor}
        getCompanyName={getCompanyName}
        handleRestoreNote={handleRestoreNote}
        handleCompleteNote={handleCompleteNote}
        handleEditNote={handleEditNote}
        handleDeleteNote={handleDeleteNote}
        navigateToCalendar={navigateToCalendar}
      />
      </div>
    </div>
  );
} 