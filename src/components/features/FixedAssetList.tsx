import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal";
import Edit from "lucide-react/dist/esm/icons/edit";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Package from "lucide-react/dist/esm/icons/package";
import ArrowUpDown from "lucide-react/dist/esm/icons/arrow-up-down";
import ArrowUp from "lucide-react/dist/esm/icons/arrow-up";
import ArrowDown from "lucide-react/dist/esm/icons/arrow-down";
import Calculator from "lucide-react/dist/esm/icons/calculator";
import FileText from "lucide-react/dist/esm/icons/file-text";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import {
  FixedAsset,
  TableSortConfig,
  AssetStatus
} from '@/types/fixedAssets.types';
import { cn } from '@/utils/cn';

interface FixedAssetListProps {
  assets: FixedAsset[];
  onEdit: (asset: FixedAsset) => void;
  onDelete: (id: string) => void;
  onDispose: (asset: FixedAsset) => void;
  onViewSchedule: (asset: FixedAsset) => void;
  sortConfig: TableSortConfig;
  onSort: (field: TableSortConfig['field']) => void;
  isLoaded: boolean;
}

const getStatusColor = (status: AssetStatus) => {
  switch (status) {
    case 'active':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'under_maintenance':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'disposed':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'written_off':
      return 'bg-gray-50 text-gray-700 border-gray-200';
    case 'held_for_sale':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const FixedAssetList: React.FC<FixedAssetListProps> = ({
  assets,
  onEdit,
  onDelete,
  onDispose,
  onViewSchedule,
  sortConfig,
  onSort,
  isLoaded
}) => {
  const SortIcon = ({ field }: { field: TableSortConfig['field'] }) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  const SortButton = ({ field, children }: { field: TableSortConfig['field'], children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => onSort(field)}
    >
      {children}
      <SortIcon field={field} />
    </Button>
  );

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">
            Loading assets...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (assets.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No assets found
            </h3>
            <p className="text-gray-500">
              Get started by adding your first fixed asset.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fixed Assets Register</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">
                  <SortButton field="code">Code</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="name">Name</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="category">Category</SortButton>
                </TableHead>
                <TableHead className="text-right">
                  <SortButton field="acquisitionDate">Acquired</SortButton>
                </TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Depreciation</TableHead>
                <TableHead className="text-right">
                  <SortButton field="bookValue">Book Value</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="status">Status</SortButton>
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => {
                const depreciationRate = asset.acquisitionCost > 0
                  ? (asset.accumulatedDepreciation / asset.acquisitionCost) * 100
                  : 0;
                const isFullyDepreciated = asset.currentBookValue <= asset.residualValue;

                return (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">
                      {asset.code}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{asset.name}</div>
                        {asset.location && (
                          <div className="text-sm text-gray-500">{asset.location}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{asset.category}</div>
                        {asset.subcategory && (
                          <div className="text-gray-500">{asset.subcategory}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatDate(asset.acquisitionDate)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(asset.acquisitionCost)}
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">
                              <div className="font-medium">
                                {formatCurrency(asset.accumulatedDepreciation)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {depreciationRate.toFixed(1)}%
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <div>Method: {asset.depreciationMethod.replace('_', ' ')}</div>
                              <div>Useful life: {asset.usefulLifeYears} years</div>
                              <div>Residual: {formatCurrency(asset.residualValue)}</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className={cn(
                        "font-medium",
                        isFullyDepreciated && "text-gray-500"
                      )}>
                        {formatCurrency(asset.currentBookValue)}
                      </div>
                      {isFullyDepreciated && (
                        <div className="text-xs text-gray-500">Fully depreciated</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={cn("capitalize", getStatusColor(asset.status))}
                      >
                        {asset.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(asset)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onViewSchedule(asset)}>
                            <Calculator className="mr-2 h-4 w-4" />
                            View Depreciation Schedule
                          </DropdownMenuItem>
                          {asset.status === 'active' && (
                            <DropdownMenuItem onClick={() => onDispose(asset)}>
                              <Package className="mr-2 h-4 w-4" />
                              Record Disposal
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(asset.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Asset
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};