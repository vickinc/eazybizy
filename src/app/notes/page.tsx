"use client";

import React, { useState, useCallback, useMemo, useDeferredValue } from "react";
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StickyNote, Plus } from "lucide-react";
import { useCompanyFilter } from "@/contexts/CompanyFilterContext";
import { useNotesManagementDB } from "@/hooks/useNotesManagementDB";
import { VirtualizedNoteList } from "@/components/features/VirtualizedNoteList";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";

// Notes Page Skeleton Component
const NotesPageSkeleton = () => (
  <div className="min-h-screen bg-lime-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <div className="h-6 w-6 sm:h-8 sm:w-8 bg-yellow-200 rounded animate-pulse"></div>
            </div>
            <div>
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Filter Bar Skeleton */}
      <div className="mb-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Note Button Skeleton */}
      <div className="mb-6">
        <div className="h-12 w-full sm:max-w-md bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Notes List Skeleton */}
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex space-x-2">
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Dynamic imports for components only needed after user interaction
const NotesFilterBar = dynamic(
  () => import('@/components/features/NotesFilterBar').then(mod => ({ default: mod.NotesFilterBar })),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 h-32 w-full rounded mb-6"></div>
  }
);

const NoteDialog = dynamic(
  () => import('@/components/features/NoteDialog').then(mod => ({ default: mod.NoteDialog })),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 h-8 w-8 rounded"></div>
  }
);

const NoteDetailsDialog = dynamic(
  () => import('@/components/features/NoteDetailsDialog').then(mod => ({ default: mod.NoteDetailsDialog })),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 h-8 w-8 rounded"></div>
  }
);

export default function Notes() {
  const { selectedCompany: globalSelectedCompany, companies } = useCompanyFilter();
  
  // Clean up any old localStorage data on first load - deferred to idle time
  React.useEffect(() => {
    const cleanupStorage = () => {
      try {
        localStorage.removeItem('app-notes');
        localStorage.removeItem('notes-migration-completed');
      } catch (error) {
        // Ignore storage cleanup errors
      }
    };

    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(cleanupStorage);
      } else {
        // Fallback for browsers that don't support requestIdleCallback
        setTimeout(cleanupStorage, 100);
      }
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

  // Use deferred value for filtered notes to keep UI responsive during filtering
  const deferredFilteredNotes = useDeferredValue(filteredNotes);

  // Get current filter info - memoized to prevent unnecessary re-renders
  const selectedCompanyObj = useMemo(() => 
    globalSelectedCompany !== 'all' ? companies.find(c => c.id === globalSelectedCompany) : null, 
    [globalSelectedCompany, companies]
  );
  const isFiltered = useMemo(() => 
    globalSelectedCompany !== 'all', 
    [globalSelectedCompany]
  );

  // Memoized event handlers to prevent unnecessary re-renders
  const handleToggleArchiveView = useCallback(() => {
    toggleArchiveView();
  }, [toggleArchiveView]);

  const handleOpenDialog = useCallback(() => {
    openDialog();
  }, [openDialog]);

  // Pre-fetch dialog data on hover/focus for better UX
  const handleAddNoteHover = useCallback(() => {
    // Pre-warm events data if not already cached
    if (!formattedEvents || formattedEvents.length === 0) {
      // This would trigger refetch in the hook, but it's already handled by React Query
      // The useNotesManagementDB hook already fetches events data with proper caching
    }
  }, [formattedEvents]);

  const handleAddNoteFocus = useCallback(() => {
    // Pre-warm events data on focus as well
    handleAddNoteHover();
  }, [handleAddNoteHover]);

  const handleCloseDialog = useCallback(() => {
    closeDialog();
  }, [closeDialog]);

  const handleSelectChangeWrapper = useCallback((field: string, value: string | boolean) => {
    if (field === "isStandalone") {
      handleSelectChange(field, value === "true" || value === true);
    } else {
      handleSelectChange(field, value as string);
    }
  }, [handleSelectChange]);

  // Use delayed loading to prevent flash for cached data
  const showLoader = useDelayedLoading(isLoading);

  // Handle loading state with progressive skeleton
  if (showLoader) {
    return <NotesPageSkeleton />;
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
              onClick={handleToggleArchiveView}
              className={showArchived ? "bg-gray-600 hover:bg-gray-700" : ""}
            >
              {showArchived ? "View Active" : "View Archive"}
            </Button>
            {!showArchived && (
              <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
                <NoteDialog 
                  editingNote={editingNote}
                  formData={formData}
                  companies={companies}
                  formattedEvents={formattedEvents}
                  handleInputChange={handleInputChange}
                  handleSelectChange={handleSelectChangeWrapper}
                  handleSubmit={handleSubmit}
                  closeDialog={handleCloseDialog}
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
            onClick={handleOpenDialog}
            onMouseEnter={handleAddNoteHover}
            onFocus={handleAddNoteFocus}
          >
            <Plus className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 font-bold" />
            Add Note
          </Button>
        </div>
      )}

      {/* Notes List - Virtualized for Performance */}
      <VirtualizedNoteList 
        filteredNotes={deferredFilteredNotes}
        showArchived={showArchived}
        getFormattedEvent={getFormattedEvent}
        getPriorityColor={getPriorityColor}
        getCompanyName={getCompanyName}
        handleRestoreNote={handleRestoreNote}
        handleCompleteNote={handleCompleteNote}
        handleEditNote={handleEditNote}
        handleDeleteNote={handleDeleteNote}
        openDetailsDialog={openDetailsDialog}
        openDialog={handleOpenDialog}
        height={600} // Set fixed height for virtualization
        itemHeight={150} // Estimated height for note items
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