import React from 'react';
import { JournalEntry } from '@/types';
import { JournalEntryCard } from './JournalEntryCard';

interface JournalEntriesListViewProps {
  entries: JournalEntry[];
  expandedEntries: Set<string>;
  selectedEntries: Set<string>;
  highlightedEntryId?: string;
  
  // Event handlers
  toggleEntryExpansion: (entryId: string) => void;
  toggleEntrySelection: (entryId: string) => void;
  handleEditEntry: (entry: JournalEntry) => void;
  handleDeleteEntry: (entry: JournalEntry) => void;
  handleReverseEntry?: (entry: JournalEntry) => void;
  handleViewReversalEntry?: (reversalEntryId: string) => void;
  handleDuplicateEntry?: (entry: JournalEntry) => void;
  
  // Utility functions
  formatCurrency: (amount: number, currency?: string) => string;
}

export const JournalEntriesListView: React.FC<JournalEntriesListViewProps> = ({
  entries,
  expandedEntries,
  selectedEntries,
  highlightedEntryId,
  toggleEntryExpansion,
  toggleEntrySelection,
  handleEditEntry,
  handleDeleteEntry,
  handleReverseEntry,
  handleViewReversalEntry,
  handleDuplicateEntry,
  formatCurrency
}) => {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">No journal entries found</div>
        <div className="text-gray-400 text-sm">
          Start by creating your first journal entry using the "Add Journal Entry" button above.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div 
          key={entry.id} 
          id={`entry-${entry.id}`}
          className={highlightedEntryId === entry.id ? 'ring-2 ring-blue-400 rounded-lg transition-all duration-500' : ''}
        >
          <JournalEntryCard
            entry={entry}
            isExpanded={expandedEntries.has(entry.id)}
            isSelected={selectedEntries.has(entry.id)}
            formatCurrency={formatCurrency}
            toggleEntryExpansion={toggleEntryExpansion}
            toggleEntrySelection={toggleEntrySelection}
            handleEditEntry={handleEditEntry}
            handleDeleteEntry={handleDeleteEntry}
            handleReverseEntry={handleReverseEntry}
            handleViewReversalEntry={handleViewReversalEntry}
            handleDuplicateEntry={handleDuplicateEntry}
          />
        </div>
      ))}
    </div>
  );
};