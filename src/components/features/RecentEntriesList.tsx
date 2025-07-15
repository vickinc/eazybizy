import React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Plus from "lucide-react/dist/esm/icons/plus";
import Maximize2 from "lucide-react/dist/esm/icons/maximize-2";
import Minimize2 from "lucide-react/dist/esm/icons/minimize-2";
import { RecentEntriesListItem } from "./RecentEntriesListItem";

interface EnrichedEntry {
  id: string;
  type: 'income' | 'expense';
  description: string;
  category: string;
  date: string;
  amount: number;
  currency: string;
  reference?: string;
  isFromInvoice?: boolean;
  cogs?: number;
  cogsPaid?: number;
  accountsPayable: number;
  company?: {
    id: number;
    tradingName: string;
    logo: string;
  };
}

interface RecentEntriesListProps {
  enrichedEntries: EnrichedEntry[];
  filteredEntries: EnrichedEntry[];
  expandedEntries: Set<string>;
  isAllExpanded: boolean;
  onToggleEntryExpansion: (id: string) => void;
  onToggleAllEntriesExpansion: () => void;
  onEditEntry: (entry: EnrichedEntry) => void;
  onShowEntryDialog: (show: boolean) => void;
  formatCurrency: (amount: number, currency?: string) => string;
}

export const RecentEntriesList: React.FC<RecentEntriesListProps> = ({
  enrichedEntries,
  filteredEntries,
  expandedEntries,
  isAllExpanded,
  onToggleEntryExpansion,
  onToggleAllEntriesExpansion,
  onEditEntry,
  onShowEntryDialog,
  formatCurrency
}) => {
  return (
    <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-gray-700" />
            Recent Entries
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {filteredEntries.length} total
            </Badge>
            {filteredEntries.length > 0 && (
              <Button 
                variant="ghost"
                size="sm"
                onClick={onToggleAllEntriesExpansion}
                className="h-7 px-2 text-xs"
              >
                {isAllExpanded ? (
                  <>
                    <Minimize2 className="h-3 w-3 mr-1" />
                    Collapse
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-3 w-3 mr-1" />
                    Expand
                  </>
                )}
              </Button>
            )}
          </div>
        </CardTitle>
        <CardDescription>Latest income and expense transactions</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {filteredEntries.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No entries yet</h3>
            <p className="text-gray-500 mb-4">Start by adding your first income or expense entry</p>
            <Button variant="outline" size="sm" onClick={() => onShowEntryDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {enrichedEntries.map((entry) => (
              <RecentEntriesListItem
                key={entry.id}
                entry={entry}
                isExpanded={expandedEntries.has(entry.id)}
                onToggleExpansion={onToggleEntryExpansion}
                onEdit={onEditEntry}
                formatCurrency={formatCurrency}
              />
            ))}
            
            {filteredEntries.length > 5 && (
              <div className="p-3 text-center border-t">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  asChild
                  className="text-xs"
                >
                  <Link href="/accounting/bookkeeping/entries">
                    View all {filteredEntries.length} entries
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};