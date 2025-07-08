"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormattedVendor } from "@/types/vendor.types";
import { VendorListItem } from "./VendorListItem";

interface VendorListProps {
  filteredVendors: FormattedVendor[];
  expandedVendors: Set<string>;
  viewMode: 'active' | 'archived';
  searchTerm: string;
  statusFilter: 'all' | 'active' | 'inactive';
  globalSelectedCompany: string;
  onToggleVendorExpansion: (vendorId: string) => void;
  onEdit: (vendor: FormattedVendor) => void;
  onToggleStatus: (vendorId: string) => void;
  onDelete: (vendorId: string) => void;
  onDuplicate?: (vendorId: string) => void;
}

export const VendorList: React.FC<VendorListProps> = ({
  filteredVendors,
  expandedVendors,
  viewMode,
  searchTerm,
  statusFilter,
  globalSelectedCompany,
  onToggleVendorExpansion,
  onEdit,
  onToggleStatus,
  onDelete,
  onDuplicate
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {viewMode === 'active' ? 'Vendor Directory' : 'Archived Vendors'}
        </CardTitle>
        <CardDescription>
          {viewMode === 'active' ? 'Manage and view all your vendors' : 'View and restore archived vendors'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {filteredVendors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || statusFilter !== 'all' || globalSelectedCompany !== 'all'
                ? 'No vendors match your filters' 
                : 'No vendors yet. Add your first vendor!'}
            </div>
          ) : (
            filteredVendors.map((vendor) => (
              <VendorListItem
                key={vendor.id}
                vendor={vendor}
                isExpanded={expandedVendors.has(vendor.id)}
                viewMode={viewMode}
                onToggleExpansion={onToggleVendorExpansion}
                onEdit={onEdit}
                onToggleStatus={onToggleStatus}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};