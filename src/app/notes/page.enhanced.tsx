"use client";

import React from "react";
import { StickyNote, Plus, TrendingUp, BarChart3, Archive, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCompanyFilter } from "@/contexts/CompanyFilterContext";
import { useNotesManagementEnhanced } from "@/hooks/useNotesManagementEnhanced";
import { VirtualScrollContainer } from "@/components/ui/virtual-scroll";
import { LoadingStates } from "@/components/ui/loading-states";
import { Pagination } from "@/components/ui/pagination";

// Statistics Cards Component
const NotesStatsCards: React.FC<{
  statistics: any;
  showArchived: boolean;
}> = ({ statistics, showArchived }) => {
  if (!statistics) return null;

  const stats = [
    {
      title: "Total Notes",
      value: statistics.totalNotes,
      icon: <FileText className="h-4 w-4" />,
      color: "bg-blue-50 text-blue-600"
    },
    {
      title: showArchived ? "Completed Notes" : "Active Notes", 
      value: showArchived ? statistics.completedNotes : statistics.activeNotes,
      icon: showArchived ? <Archive className="h-4 w-4" /> : <StickyNote className="h-4 w-4" />,
      color: showArchived ? "bg-gray-50 text-gray-600" : "bg-green-50 text-green-600"
    },
    {
      title: "Standalone Notes",
      value: statistics.standaloneNotes,
      icon: <FileText className="h-4 w-4" />,
      color: "bg-purple-50 text-purple-600"
    },
    {
      title: "Linked Notes",
      value: statistics.linkedNotes,
      icon: <TrendingUp className="h-4 w-4" />,
      color: "bg-orange-50 text-orange-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className={`rounded-md p-2 ${stat.color}`}>
              {stat.icon}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Notes Filter Bar Component
const NotesFilterBar: React.FC<{
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  filterPriority: string;
  setFilterPriority: (priority: string) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
}> = ({
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  filterPriority,
  setFilterPriority,
  sortBy,
  setSortBy
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Types</option>
            <option value="standalone">Standalone</option>
            <option value="linked">Linked to Events</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Sort */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="created">Created Date</option>
            <option value="updated">Updated Date</option>
            <option value="title">Title</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// Note Item Component
const NoteItem: React.FC<{
  note: any;
  showArchived: boolean;
  getPriorityColor: (priority: string) => string;
  getCompanyName: (companyId: number | undefined) => string;
  handleEditNote: (note: any) => void;
  handleDeleteNote: (id: string) => void;
  handleCompleteNote: (id: string) => void;
  handleRestoreNote: (id: string) => void;
  openDetailsDialog: (note: any) => void;
}> = ({
  note,
  showArchived,
  getPriorityColor,
  getCompanyName,
  handleEditNote,
  handleDeleteNote,
  handleCompleteNote,
  handleRestoreNote,
  openDetailsDialog
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 
              className="text-lg font-semibold text-gray-900 truncate cursor-pointer hover:text-blue-600"
              onClick={() => openDetailsDialog(note)}
            >
              {note.title}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(note.priority)}`}>
              {note.priority}
            </span>
            {note.isStandalone ? (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                Standalone
              </span>
            ) : (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                Linked
              </span>
            )}
          </div>
          
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {note.content}
          </p>
          
          <div className="flex items-center text-xs text-gray-500 space-x-4">
            <span>Company: {getCompanyName(note.companyId)}</span>
            <span>Created: {note.createdAt.toLocaleDateString()}</span>
            {note.tags && note.tags.length > 0 && (
              <span>Tags: {note.tags.join(', ')}</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          {showArchived ? (
            <Button
              onClick={() => handleRestoreNote(note.id)}
              size="sm"
              variant="outline"
              className="text-green-600 hover:text-green-700"
            >
              Restore
            </Button>
          ) : (
            <>
              <Button
                onClick={() => handleCompleteNote(note.id)}
                size="sm"
                variant="outline"
                className="text-gray-600 hover:text-gray-700"
              >
                Complete
              </Button>
              <Button
                onClick={() => handleEditNote(note)}
                size="sm"
                variant="outline"
              >
                Edit
              </Button>
            </>
          )}
          <Button
            onClick={() => handleDeleteNote(note.id)}
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-700"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function NotesPageEnhanced() {
  const { selectedCompany: globalSelectedCompany, companies } = useCompanyFilter();
  
  const {
    // Data
    filteredNotes,
    statistics,
    
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
    
    // Loading & Error States
    isLoading,
    isError,
    error,
    isMutating,
    
    // Infinite Query States
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    
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
    
    // Data Refresh
    refetch
  } = useNotesManagementEnhanced(globalSelectedCompany, companies);

  // Get current filter info
  const selectedCompanyObj = globalSelectedCompany !== 'all' ? companies.find(c => c.id === globalSelectedCompany) : null;
  const isFiltered = globalSelectedCompany !== 'all';

  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Loading State */}
        {isLoading && (
          <div className="mb-6">
            <Alert>
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <AlertDescription>Loading your notes...</AlertDescription>
              </div>
            </Alert>
          </div>
        )}

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

        {/* Page Header */}
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
                <p className="text-sm sm:text-base text-gray-600">
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
                <Archive className="h-4 w-4 mr-2" />
                {showArchived ? "View Active" : "View Archive"}
              </Button>
              {!showArchived && (
                <Button 
                  className="bg-black hover:bg-gray-800"
                  onClick={openDialog}
                  disabled={isMutating}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isMutating ? "Adding..." : "Add Note"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <NotesStatsCards 
          statistics={statistics}
          showArchived={showArchived}
        />

        {/* Filters */}
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

        {/* Notes List */}
        <div className="bg-white rounded-lg shadow-sm border">
          {filteredNotes.length === 0 && !isLoading ? (
            <div className="p-8 text-center">
              <StickyNote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {showArchived ? "No archived notes" : "No notes found"}
              </h3>
              <p className="text-gray-500 mb-4">
                {showArchived 
                  ? "You don't have any archived notes yet."
                  : "Get started by creating your first note."
                }
              </p>
              {!showArchived && (
                <Button onClick={openDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              )}
            </div>
          ) : (
            <VirtualScrollContainer
              items={filteredNotes}
              itemHeight={120}
              renderItem={(note, index) => (
                <div key={note.id} className="p-4 border-b border-gray-200 last:border-b-0">
                  <NoteItem
                    note={note}
                    showArchived={showArchived}
                    getPriorityColor={getPriorityColor}
                    getCompanyName={getCompanyName}
                    handleEditNote={handleEditNote}
                    handleDeleteNote={handleDeleteNote}
                    handleCompleteNote={handleCompleteNote}
                    handleRestoreNote={handleRestoreNote}
                    openDetailsDialog={openDetailsDialog}
                  />
                </div>
              )}
              loadMore={hasNextPage ? fetchNextPage : undefined}
              loading={isFetchingNextPage}
              className="max-h-[600px]"
            />
          )}
        </div>

        {/* Load More Button */}
        {hasNextPage && (
          <div className="mt-6 text-center">
            <Button 
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              variant="outline"
            >
              {isFetchingNextPage ? "Loading..." : "Load More Notes"}
            </Button>
          </div>
        )}

        {/* Note Dialog would go here - using existing components */}
        {/* Note Details Dialog would go here - using existing components */}
      </div>
    </div>
  );
}