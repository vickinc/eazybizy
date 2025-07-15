import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal";
import Edit from "lucide-react/dist/esm/icons/edit";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Eye from "lucide-react/dist/esm/icons/eye";
import EyeOff from "lucide-react/dist/esm/icons/eye-off";
import Building2 from "lucide-react/dist/esm/icons/building-2";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import TrendingDown from "lucide-react/dist/esm/icons/trending-down";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import ArrowUpDown from "lucide-react/dist/esm/icons/arrow-up-down";
import ArrowUp from "lucide-react/dist/esm/icons/arrow-up";
import ArrowDown from "lucide-react/dist/esm/icons/arrow-down";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChartOfAccount, AccountGroup, TableSortConfig } from "@/types";
import { ChartOfAccountsBusinessService } from "@/services/business";
import { cn } from "@/utils/cn";

interface ProfessionalAccountTableProps {
  accounts: ChartOfAccount[];
  onEditAccount: (account: ChartOfAccount) => void;
  onDeleteAccount: (id: string) => void;
  onDeactivateAccount: (id: string) => void;
  onReactivateAccount: (id: string) => void;
  isLoaded: boolean;
}

// Utility function to truncate long text
const truncateText = (text: string, maxLength: number = 30): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const ProfessionalAccountTable: React.FC<ProfessionalAccountTableProps> = ({
  accounts,
  onEditAccount,
  onDeleteAccount,
  onDeactivateAccount,
  onReactivateAccount,
  isLoaded
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<TableSortConfig>({ field: 'code', direction: 'asc' });

  // Enrich accounts with calculated fields
  const enrichedAccounts = useMemo(() => {
    return ChartOfAccountsBusinessService.enrichAccountsWithCalculatedFields(accounts);
  }, [accounts]);

  // Group accounts by type
  const accountGroups = useMemo(() => {
    const sorted = ChartOfAccountsBusinessService.sortAccounts(enrichedAccounts, sortConfig);
    return ChartOfAccountsBusinessService.groupAccountsByType(sorted);
  }, [enrichedAccounts, sortConfig]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Assets':
        return <Building2 className="h-4 w-4 text-blue-600" />;
      case 'Liability':
        return <CreditCard className="h-4 w-4 text-red-600" />;
      case 'Revenue':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'Expense':
        return <TrendingDown className="h-4 w-4 text-orange-600" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Assets':
        return 'bg-blue-50 border-blue-200';
      case 'Liability':
        return 'bg-red-50 border-red-200';
      case 'Revenue':
        return 'bg-green-50 border-green-200';
      case 'Expense':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const toggleGroupExpansion = (groupType: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupType)) {
      newExpanded.delete(groupType);
    } else {
      newExpanded.add(groupType);
    }
    setExpandedGroups(newExpanded);
  };

  const handleSort = (field: TableSortConfig['field']) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (field: TableSortConfig['field']) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-3 w-3 text-blue-600" />
      : <ArrowDown className="h-3 w-3 text-blue-600" />;
  };

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-sm text-muted-foreground">Loading accounts...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts found</h3>
            <p className="text-sm text-muted-foreground">
              {isLoaded 
                ? "Click 'Load Default Chart of Accounts' above to populate with 45+ predefined accounts."
                : "No accounts match your current filter criteria."
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-semibold">Chart of Accounts</span>
          <Badge variant="secondary" className="ml-2">
            {accounts.length} account{accounts.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead 
                  className="w-[100px] cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('code')}
                >
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">Code</span>
                    {getSortIcon('code')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">Account Name</span>
                    {getSortIcon('name')}
                  </div>
                </TableHead>
                <TableHead 
                  className="w-[200px] max-w-[200px] cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">Category</span>
                    {getSortIcon('category')}
                  </div>
                </TableHead>
                <TableHead 
                  className="w-[140px] cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('classification')}
                >
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">Classification</span>
                    {getSortIcon('classification')}
                  </div>
                </TableHead>
                <TableHead className="w-[100px] text-center">
                  <span className="font-medium">VAT Rate</span>
                </TableHead>
                <TableHead 
                  className="w-[120px] text-right cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('balance')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span className="font-medium">Balance</span>
                    {getSortIcon('balance')}
                  </div>
                </TableHead>
                <TableHead className="w-[100px] text-center">
                  <span className="font-medium">Status</span>
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountGroups.map((group) => (
                <React.Fragment key={group.type}>
                  {/* Group Header Row */}
                  <TableRow 
                    className={cn(
                      "border-b-2 cursor-pointer hover:bg-gray-50",
                      getTypeColor(group.type)
                    )}
                    onClick={() => toggleGroupExpansion(group.type)}
                  >
                    <TableCell className="py-3">
                      {expandedGroups.has(group.type) ? (
                        <ChevronDown className="h-4 w-4 text-gray-600" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-600" />
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(group.type)}
                        <span className="font-semibold text-gray-900">{group.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-sm text-gray-600">
                        {group.count} account{group.count !== 1 ? 's' : ''}
                      </span>
                    </TableCell>
                    <TableCell className="py-3"></TableCell>
                    <TableCell className="py-3"></TableCell>
                    <TableCell className="py-3"></TableCell>
                    <TableCell className="py-3 text-right">
                      <span className="font-medium">
                        {ChartOfAccountsBusinessService.formatCurrency(group.totalBalance)}
                      </span>
                    </TableCell>
                    <TableCell className="py-3"></TableCell>
                    <TableCell className="py-3"></TableCell>
                  </TableRow>

                  {/* Account Detail Rows */}
                  {expandedGroups.has(group.type) && group.accounts.map((account) => (
                    <TableRow 
                      key={account.id}
                      className={cn(
                        "hover:bg-gray-50 border-b border-gray-100",
                        !account.isActive && "opacity-60"
                      )}
                    >
                      <TableCell className="py-2 pl-8"></TableCell>
                      <TableCell className="py-2">
                        <span className="font-mono text-sm font-medium text-gray-700">
                          {account.code}
                        </span>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{account.name}</span>
                          {account.relatedVendor && (
                            <span className="text-xs text-gray-500 mt-1">
                              Vendor: {account.relatedVendor}
                            </span>
                          )}
                          {account.hasTransactions && (
                            <span className="text-xs text-blue-600 mt-1">
                              {account.transactionCount || 0} transaction{(account.transactionCount || 0) !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 max-w-[200px]">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge 
                                variant="outline" 
                                className="text-xs bg-blue-50 text-blue-700 border-blue-200 max-w-full truncate cursor-help"
                              >
                                {truncateText(account.category, 25)}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[300px]">
                              <p className="text-xs">{account.category}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant="outline" className="text-xs">
                          {account.classification}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 text-center">
                        <Badge 
                          variant="outline" 
                          className="text-xs bg-gray-50"
                        >
                          {ChartOfAccountsBusinessService.formatVATRate(account.vat)}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <span className={cn(
                          "font-medium text-sm",
                          account.balance && account.balance > 0 ? "text-green-700" : 
                          account.balance && account.balance < 0 ? "text-red-700" : "text-gray-500"
                        )}>
                          {ChartOfAccountsBusinessService.formatCurrency(account.balance || 0)}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 text-center">
                        <Badge 
                          variant={account.isActive ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {account.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-7 w-7 p-0">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEditAccount(account)}>
                              <Edit className="mr-2 h-3 w-3" />
                              Edit
                            </DropdownMenuItem>
                            {account.isActive ? (
                              <DropdownMenuItem onClick={() => onDeactivateAccount(account.id)}>
                                <EyeOff className="mr-2 h-3 w-3" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => onReactivateAccount(account.id)}>
                                <Eye className="mr-2 h-3 w-3" />
                                Reactivate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => onDeleteAccount(account.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-3 w-3" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};