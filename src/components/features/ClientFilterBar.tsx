import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Search from "lucide-react/dist/esm/icons/search";

interface ClientFilterBarProps {
  searchTerm: string;
  filterStatus: string;
  filterIndustry: string;
  availableStatuses: Array<{ value: string; label: string }>;
  availableIndustries: string[];
  onSearchTermChange: (value: string) => void;
  onFilterStatusChange: (value: string) => void;
  onFilterIndustryChange: (value: string) => void;
}

export const ClientFilterBar: React.FC<ClientFilterBarProps> = ({
  searchTerm,
  filterStatus,
  filterIndustry,
  availableStatuses,
  availableIndustries,
  onSearchTermChange,
  onFilterStatusChange,
  onFilterIndustryChange,
}) => {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, email, industry, or company..."
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterStatus} onValueChange={onFilterStatusChange}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {availableStatuses.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterIndustry} onValueChange={onFilterIndustryChange}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {availableIndustries.map(industry => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};