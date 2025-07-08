'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  BookOpenIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DownloadIcon,
  ExternalLinkIcon,
  HashIcon,
  TableIcon,
  InfoIcon
} from 'lucide-react';
import { 
  FinancialStatementNote, 
  FinancialStatementSubNote, 
  NoteTable,
  NoteCategory 
} from '@/types/financialStatements.types';

interface FinancialStatementsNotesProps {
  notes: FinancialStatementNote[];
  showCrossReferences?: boolean;
  showIFRSReferences?: boolean;
  onExport?: (format: 'PDF' | 'Excel') => void;
  className?: string;
}

interface NotesSectionProps {
  notes: FinancialStatementNote[];
  showCrossReferences: boolean;
  showIFRSReferences: boolean;
}

interface NoteTableComponentProps {
  table: NoteTable;
}

interface SubNoteComponentProps {
  subNote: FinancialStatementSubNote;
  showCrossReferences: boolean;
  noteNumber: string;
}

/**
 * Table component for displaying structured note data
 */
const NoteTableComponent: React.FC<NoteTableComponentProps> = ({ table }) => {
  return (
    <div className="my-4">
      {table.title && (
        <h5 className="font-medium text-sm mb-2 flex items-center">
          <TableIcon className="h-4 w-4 mr-2" />
          {table.title}
        </h5>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 rounded-lg text-sm">
          <thead>
            <tr className="bg-gray-50">
              {table.headers.map((header, index) => (
                <th 
                  key={index} 
                  className="px-3 py-2 text-left font-medium text-gray-700 border-b border-gray-200"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr 
                key={row.id} 
                className={`
                  ${row.isTotal ? 'font-bold bg-blue-50' : ''} 
                  ${row.isSubtotal ? 'font-medium bg-gray-25' : ''}
                  ${row.emphasis ? 'bg-blue-25' : ''}
                  hover:bg-gray-25 transition-colors
                `}
              >
                {row.cells.map((cell, cellIndex) => (
                  <td 
                    key={cellIndex} 
                    className={`
                      px-3 py-2 border-b border-gray-100
                      ${cellIndex === 0 ? 'text-left' : 'text-right'}
                      ${row.isTotal || row.isSubtotal ? 'font-medium' : ''}
                    `}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {table.footnotes && table.footnotes.length > 0 && (
        <div className="mt-2 space-y-1">
          {table.footnotes.map((footnote, index) => (
            <p key={index} className="text-xs text-muted-foreground italic">
              {footnote}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Sub-note component with tables and cross-references
 */
const SubNoteComponent: React.FC<SubNoteComponentProps> = ({ 
  subNote, 
  showCrossReferences, 
  noteNumber 
}) => {
  return (
    <div className="ml-4 border-l-2 border-gray-100 pl-4 mt-3">
      <h4 className="font-medium text-sm mb-2">
        {noteNumber}.{subNote.id.split('-').pop()} {subNote.title}
      </h4>
      
      {/* Sub-note content */}
      <div className="text-sm text-gray-700 mb-3 whitespace-pre-line leading-relaxed">
        {subNote.content}
      </div>
      
      {/* Tables */}
      {subNote.tables && subNote.tables.map((table, index) => (
        <NoteTableComponent key={table.id} table={table} />
      ))}
      
      {/* Cross-references */}
      {showCrossReferences && subNote.crossReferences && subNote.crossReferences.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {subNote.crossReferences.map((ref, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              <ExternalLinkIcon className="h-3 w-3 mr-1" />
              {ref}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Main notes section with collapsible notes
 */
const NotesSection: React.FC<NotesSectionProps> = ({ 
  notes, 
  showCrossReferences, 
  showIFRSReferences 
}) => {
  const [expandedNotes, setExpandedNotes] = useState<string[]>([]);

  const toggleNote = (noteId: string) => {
    setExpandedNotes(prev => 
      prev.includes(noteId) 
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    );
  };

  const getCategoryColor = (category?: NoteCategory): string => {
    switch (category) {
      case 'AccountingPolicies': return 'bg-blue-100 text-blue-800';
      case 'CriticalEstimates': return 'bg-amber-100 text-amber-800';
      case 'Revenue': return 'bg-green-100 text-green-800';
      case 'Assets': return 'bg-purple-100 text-purple-800';
      case 'Equity': return 'bg-indigo-100 text-indigo-800';
      case 'CashFlow': return 'bg-cyan-100 text-cyan-800';
      case 'RiskManagement': return 'bg-red-100 text-red-800';
      case 'RelatedParties': return 'bg-orange-100 text-orange-800';
      case 'SubsequentEvents': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {notes.map((note) => {
        const isExpanded = expandedNotes.includes(note.id);
        
        return (
          <Card key={note.id} className="border border-gray-200">
            <Collapsible open={isExpanded} onOpenChange={() => toggleNote(note.id)}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base font-semibold flex items-center">
                        <HashIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        Note {note.noteNumber}: {note.title}
                        {isExpanded ? (
                          <ChevronDownIcon className="h-4 w-4 ml-2" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4 ml-2" />
                        )}
                      </CardTitle>
                      
                      <div className="flex items-center space-x-2 mt-2">
                        {note.category && (
                          <Badge className={`text-xs ${getCategoryColor(note.category)}`}>
                            {note.category}
                          </Badge>
                        )}
                        
                        {note.isRequired && (
                          <Badge variant="outline" className="text-xs">
                            Required
                          </Badge>
                        )}
                        
                        {showIFRSReferences && note.ifrsReference && (
                          <Badge variant="outline" className="text-xs">
                            <ExternalLinkIcon className="h-3 w-3 mr-1" />
                            {note.ifrsReference}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0">
                  {/* Main note content */}
                  <div className="text-sm text-gray-700 mb-4 whitespace-pre-line leading-relaxed">
                    {note.content}
                  </div>
                  
                  {/* Sub-notes */}
                  {note.subNotes && note.subNotes.length > 0 && (
                    <div className="space-y-4">
                      <Separator />
                      {note.subNotes.map((subNote) => (
                        <SubNoteComponent 
                          key={subNote.id} 
                          subNote={subNote} 
                          showCrossReferences={showCrossReferences}
                          noteNumber={note.noteNumber}
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Statement references */}
                  {note.statementReferences && note.statementReferences.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <p className="text-xs text-muted-foreground mb-1">
                        Referenced in statements:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {note.statementReferences.map((ref, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {ref}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}
    </div>
  );
};

/**
 * Main Financial Statements Notes Component
 */
export const FinancialStatementsNotes: React.FC<FinancialStatementsNotesProps> = ({
  notes,
  showCrossReferences = true,
  showIFRSReferences = true,
  onExport,
  className = ''
}) => {
  const [expandAllNotes, setExpandAllNotes] = useState(false);

  // Categorize notes
  const categorizedNotes = notes.reduce((acc, note) => {
    const category = note.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(note);
    return acc;
  }, {} as Record<string, FinancialStatementNote[]>);

  const categoryOrder: NoteCategory[] = [
    'AccountingPolicies',
    'CriticalEstimates', 
    'Revenue',
    'Assets',
    'Equity',
    'CashFlow',
    'RiskManagement',
    'RelatedParties',
    'SubsequentEvents'
  ];

  const handleExpandAll = () => {
    setExpandAllNotes(!expandAllNotes);
    // This would trigger expansion/collapse of all notes
    // Implementation depends on how you want to handle state management
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BookOpenIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Notes to the Financial Statements</h2>
            <p className="text-muted-foreground text-sm">
              IFRS-compliant disclosures and accounting policies
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExpandAll}
          >
            {expandAllNotes ? 'Collapse All' : 'Expand All'}
          </Button>
          
          {onExport && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('PDF')}
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('Excel')}
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Notes Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <InfoIcon className="h-4 w-4 mr-2" />
            Notes Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium">Total Notes</p>
              <p className="text-2xl font-bold text-blue-600">{notes.length}</p>
            </div>
            <div>
              <p className="font-medium">Required Notes</p>
              <p className="text-2xl font-bold text-green-600">
                {notes.filter(n => n.isRequired).length}
              </p>
            </div>
            <div>
              <p className="font-medium">Categories</p>
              <p className="text-2xl font-bold text-purple-600">
                {Object.keys(categorizedNotes).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes organized by category */}
      {categoryOrder.map(category => {
        const categoryNotes = categorizedNotes[category];
        if (!categoryNotes || categoryNotes.length === 0) return null;

        return (
          <div key={category}>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className={`px-2 py-1 rounded text-sm mr-3 ${
                category === 'AccountingPolicies' ? 'bg-blue-100 text-blue-800' :
                category === 'CriticalEstimates' ? 'bg-amber-100 text-amber-800' :
                category === 'Revenue' ? 'bg-green-100 text-green-800' :
                category === 'Assets' ? 'bg-purple-100 text-purple-800' :
                category === 'Equity' ? 'bg-indigo-100 text-indigo-800' :
                category === 'CashFlow' ? 'bg-cyan-100 text-cyan-800' :
                category === 'RiskManagement' ? 'bg-red-100 text-red-800' :
                category === 'RelatedParties' ? 'bg-orange-100 text-orange-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {category}
              </span>
              ({categoryNotes.length} {categoryNotes.length === 1 ? 'note' : 'notes'})
            </h3>
            
            <NotesSection
              notes={categoryNotes}
              showCrossReferences={showCrossReferences}
              showIFRSReferences={showIFRSReferences}
            />
          </div>
        );
      })}

      {/* Uncategorized notes */}
      {categorizedNotes.Other && categorizedNotes.Other.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Other Notes ({categorizedNotes.Other.length})
          </h3>
          <NotesSection
            notes={categorizedNotes.Other}
            showCrossReferences={showCrossReferences}
            showIFRSReferences={showIFRSReferences}
          />
        </div>
      )}
    </div>
  );
};