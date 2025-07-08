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
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Shield,
  Info
} from 'lucide-react';
import {
  VATTreatment,
  TableSortConfig,
  VATCategory,
  VATApplicability
} from '@/types/vatTreatment.types';
import { VATTreatmentBusinessService } from '@/services/business/vatTreatmentBusinessService';
import { cn } from '@/utils/cn';

interface VATTreatmentListProps {
  treatments: VATTreatment[];
  onEdit: (treatment: VATTreatment) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
  sortConfig: TableSortConfig;
  onSort: (field: TableSortConfig['field']) => void;
  isLoaded: boolean;
}

const getCategoryColor = (category: VATCategory) => {
  switch (category) {
    case 'standard':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'reduced':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'exempt':
      return 'bg-gray-50 text-gray-700 border-gray-200';
    case 'special':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'acquisition':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'margin':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'property':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const formatApplicability = (applicability: VATApplicability[]): string => {
  return applicability.map(app => 
    app.charAt(0).toUpperCase() + app.slice(1)
  ).join(', ');
};

const truncateText = (text: string, maxLength: number = 40): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Mobile Card Component
const TreatmentCard: React.FC<{
  treatment: VATTreatment;
  onEdit: (treatment: VATTreatment) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
}> = ({ treatment, onEdit, onDelete, onToggleActive }) => (
  <Card className={cn("mb-3", !treatment.isActive && "opacity-60")}>
    <CardContent className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm font-bold text-gray-900">
              {treatment.code}
            </span>
            {treatment.isDefault && (
              <Shield className="h-3 w-3 text-blue-600" />
            )}
          </div>
          <h3 className="font-medium text-gray-900 text-sm leading-tight">
            {treatment.name}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">
            {VATTreatmentBusinessService.formatRate(treatment.rate)}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(treatment)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {treatment.isActive ? (
                <DropdownMenuItem 
                  onClick={() => onToggleActive(treatment.id)}
                  disabled={treatment.isDefault}
                >
                  <EyeOff className="mr-2 h-4 w-4" />
                  Deactivate
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onToggleActive(treatment.id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Activate
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(treatment.id)}
                className="text-red-600"
                disabled={treatment.isDefault}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <p className="text-xs text-gray-600 mb-3 leading-relaxed">
        {truncateText(treatment.description, 80)}
      </p>
      
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          <Badge 
            variant="outline" 
            className={cn("text-xs capitalize", getCategoryColor(treatment.category))}
          >
            {treatment.category}
          </Badge>
          {treatment.applicability.slice(0, 2).map(app => (
            <Badge key={app} variant="outline" className="text-xs capitalize">
              {app}
            </Badge>
          ))}
          {treatment.applicability.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{treatment.applicability.length - 2}
            </Badge>
          )}
        </div>
        
        <Badge 
          variant={treatment.isActive ? "default" : "secondary"}
          className="text-xs"
        >
          {treatment.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>
    </CardContent>
  </Card>
);

export const VATTreatmentList: React.FC<VATTreatmentListProps> = ({
  treatments,
  onEdit,
  onDelete,
  onToggleActive,
  sortConfig,
  onSort,
  isLoaded
}) => {
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
            <div className="text-sm text-muted-foreground">Loading VAT treatments...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (treatments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No VAT treatments found</h3>
            <p className="text-sm text-muted-foreground">
              No VAT treatments match your current filter criteria, or none have been created yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Mobile View */}
      <div className="block md:hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">VAT Treatments</h3>
          <Badge variant="secondary">
            {treatments.length} treatment{treatments.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        <div className="space-y-3">
          {treatments.map((treatment) => (
            <TreatmentCard
              key={treatment.id}
              treatment={treatment}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleActive={onToggleActive}
            />
          ))}
        </div>
      </div>

      {/* Desktop View */}
      <Card className="hidden md:block overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="text-lg font-semibold">VAT Treatments</span>
            <Badge variant="secondary" className="ml-2">
              {treatments.length} treatment{treatments.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead 
                    className="w-[100px] cursor-pointer hover:bg-gray-100 py-2"
                    onClick={() => onSort('code')}
                  >
                    <div className="flex items-center space-x-1">
                      <span className="font-medium text-xs">Code</span>
                      {getSortIcon('code')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="min-w-[200px] cursor-pointer hover:bg-gray-100 py-2"
                    onClick={() => onSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span className="font-medium text-xs">Name</span>
                      {getSortIcon('name')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="w-[80px] text-right cursor-pointer hover:bg-gray-100 py-2"
                    onClick={() => onSort('rate')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span className="font-medium text-xs">Rate</span>
                      {getSortIcon('rate')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="w-[100px] cursor-pointer hover:bg-gray-100 py-2"
                    onClick={() => onSort('category')}
                  >
                    <div className="flex items-center space-x-1">
                      <span className="font-medium text-xs">Category</span>
                      {getSortIcon('category')}
                    </div>
                  </TableHead>
                  <TableHead className="w-[120px] py-2">
                    <span className="font-medium text-xs">Applicability</span>
                  </TableHead>
                  <TableHead className="w-[80px] text-center py-2">
                    <span className="font-medium text-xs">Status</span>
                  </TableHead>
                  <TableHead className="w-[50px] py-2"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {treatments.map((treatment) => (
                  <TableRow 
                    key={treatment.id}
                    className={cn(
                      "hover:bg-gray-50",
                      !treatment.isActive && "opacity-60"
                    )}
                  >
                    <TableCell className="py-2">
                      <div className="flex items-center space-x-1">
                        <span className="font-mono text-xs font-bold text-gray-900">
                          {treatment.code}
                        </span>
                        {treatment.isDefault && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Shield className="h-3 w-3 text-blue-600" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">System Default</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-gray-900 leading-tight">
                          {treatment.name}
                        </span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs text-gray-500 cursor-help truncate max-w-[200px]">
                                {truncateText(treatment.description, 35)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[300px]">
                              <p className="text-xs">{treatment.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-2 text-right">
                      <span className="font-bold text-sm">
                        {VATTreatmentBusinessService.formatRate(treatment.rate)}
                      </span>
                    </TableCell>
                    
                    <TableCell className="py-2">
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs capitalize", getCategoryColor(treatment.category))}
                      >
                        {treatment.category}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="py-2">
                      <div className="flex flex-wrap gap-1">
                        {treatment.applicability.slice(0, 2).map(app => (
                          <Badge key={app} variant="outline" className="text-xs capitalize">
                            {app}
                          </Badge>
                        ))}
                        {treatment.applicability.length > 2 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="outline" className="text-xs">
                                  +{treatment.applicability.length - 2}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">
                                  {formatApplicability(treatment.applicability)}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-2 text-center">
                      <Badge 
                        variant={treatment.isActive ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {treatment.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(treatment)}>
                            <Edit className="mr-2 h-3 w-3" />
                            Edit
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          {treatment.isActive ? (
                            <DropdownMenuItem 
                              onClick={() => onToggleActive(treatment.id)}
                              disabled={treatment.isDefault}
                            >
                              <EyeOff className="mr-2 h-3 w-3" />
                              Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => onToggleActive(treatment.id)}>
                              <Eye className="mr-2 h-3 w-3" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            onClick={() => onDelete(treatment.id)}
                            className="text-red-600"
                            disabled={treatment.isDefault}
                          >
                            <Trash2 className="mr-2 h-3 w-3" />
                            Delete
                          </DropdownMenuItem>
                          
                          {treatment.isDefault && (
                            <DropdownMenuItem disabled className="text-xs text-gray-500">
                              <Shield className="mr-2 h-3 w-3" />
                              Protected (Default)
                            </DropdownMenuItem>
                          )}
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
    </>
  );
};