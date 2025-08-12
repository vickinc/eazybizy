import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CalendarIcon from "lucide-react/dist/esm/icons/calendar";
import { 
  AccountTypeFilter, 
  BalanceGroupBy,
  BalanceFilterState 
} from '@/types/balance.types';

interface BalanceFilterBarProps {
  filters: BalanceFilterState;
  onUpdateFilters: (filters: Partial<BalanceFilterState>) => void;
  onResetFilters: () => void;
  loading?: boolean;
}

export const BalanceFilterBar: React.FC<BalanceFilterBarProps> = ({
  filters,
  onUpdateFilters,
  onResetFilters,
  loading = false
}) => {
  const handleAsOfDateChange = (value: string) => {
    onUpdateFilters({ 
      asOfDate: value,
      selectedPeriod: 'asOfDate' 
    });
  };

  const handleAccountTypeChange = (accountType: AccountTypeFilter) => {
    onUpdateFilters({ accountTypeFilter: accountType });
  };

  const handleGroupByChange = (groupBy: BalanceGroupBy) => {
    onUpdateFilters({ groupBy });
  };

  // Initialize with today's date and asOfDate mode
  React.useEffect(() => {
    if (!filters.asOfDate) {
      const today = new Date().toISOString().split('T')[0];
      onUpdateFilters({ 
        asOfDate: today,
        selectedPeriod: 'asOfDate' 
      });
    }
  }, []);

  return (
    <div className="mb-6 bg-white rounded-lg shadow border p-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Simple Date Picker */}
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-gray-500" />
            <Label className="text-sm font-medium">Balance as of:</Label>
          </div>
          
          <Input
            type="date"
            value={filters.asOfDate || new Date().toISOString().split('T')[0]}
            onChange={(e) => handleAsOfDateChange(e.target.value)}
            className="w-[160px]"
            disabled={loading}
            max={new Date().toISOString().split('T')[0]}
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAsOfDateChange(new Date().toISOString().split('T')[0])}
            disabled={loading}
          >
            Today
          </Button>
        </div>

        {/* Simple Filters */}
        <div className="flex gap-2">
          <Select 
            value={filters.accountTypeFilter} 
            onValueChange={handleAccountTypeChange}
            disabled={loading}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              <SelectItem value="banks">Banks</SelectItem>
              <SelectItem value="wallets">Wallets</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={filters.groupBy} 
            onValueChange={handleGroupByChange}
            disabled={loading}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Group</SelectItem>
              <SelectItem value="account">By Account</SelectItem>
              <SelectItem value="currency">By Currency</SelectItem>
              <SelectItem value="type">By Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};