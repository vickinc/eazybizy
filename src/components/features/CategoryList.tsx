import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal";
import Edit from "lucide-react/dist/esm/icons/edit";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Eye from "lucide-react/dist/esm/icons/eye";
import EyeOff from "lucide-react/dist/esm/icons/eye-off";
import Building2 from "lucide-react/dist/esm/icons/building-2";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import TrendingDown from "lucide-react/dist/esm/icons/trending-down";
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
import { ChartOfAccount } from "@/types/chartOfAccounts.types";
import { cn } from "@/utils/cn";

interface CategoryListProps {
  accounts: ChartOfAccount[];
  onEditAccount: (account: ChartOfAccount) => void;
  onDeleteAccount: (id: string) => void;
  onDeactivateAccount: (id: string) => void;
  onReactivateAccount: (id: string) => void;
  isLoaded: boolean;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  accounts,
  onEditAccount,
  onDeleteAccount,
  onDeactivateAccount,
  onReactivateAccount,
  isLoaded
}) => {
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
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Liability':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Revenue':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Expense':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getVATColor = (vat: string) => {
    if (vat.includes('22%')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    } else if (vat.includes('9%')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    } else if (vat.includes('0%')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (vat.includes('exempt')) {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200';
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
                ? "Click 'Load Default Chart of Accounts' above to populate with 220+ predefined accounts from your CSV file."
                : "No accounts match your current filter criteria."
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Chart of Accounts</span>
          <Badge variant="secondary" className="ml-2">
            {accounts.length} account{accounts.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead className="w-[120px]">Type</TableHead>
                <TableHead className="w-[200px]">VAT Treatment</TableHead>
                <TableHead className="w-[120px]">Related Vendor</TableHead>
                <TableHead className="w-[100px]">Class</TableHead>
                <TableHead className="w-[80px]">Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow 
                  key={account.id}
                  className={cn(
                    "hover:bg-muted/50",
                    !account.isActive && "opacity-60"
                  )}
                >
                  <TableCell className="font-mono text-sm font-medium">
                    {account.code}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start space-x-2">
                      {getTypeIcon(account.type)}
                      <div>
                        <div className="font-medium">{account.name}</div>
                        {account.relatedVendor && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Vendor: {account.relatedVendor}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", getTypeColor(account.type))}
                    >
                      {account.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", getVATColor(account.vat))}
                    >
                      {account.vat.length > 25 ? `${account.vat.substring(0, 25)}...` : account.vat}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {account.relatedVendor || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {account.accountType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={account.isActive ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {account.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditAccount(account)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {account.isActive ? (
                          <DropdownMenuItem onClick={() => onDeactivateAccount(account.id)}>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => onReactivateAccount(account.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Reactivate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => onDeleteAccount(account.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};