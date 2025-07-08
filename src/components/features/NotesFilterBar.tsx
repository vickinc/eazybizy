import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface NotesFilterBarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterType: "all" | "standalone" | "event-related";
  setFilterType: (value: "all" | "standalone" | "event-related") => void;
  filterPriority: string;
  setFilterPriority: (value: string) => void;
  sortBy: "event-soon" | "last-updated" | "last-created" | "first-created" | "event-first" | "standalone-first";
  setSortBy: (value: "event-soon" | "last-updated" | "last-created" | "first-created" | "event-first" | "standalone-first") => void;
}

export const NotesFilterBar: React.FC<NotesFilterBarProps> = ({
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  filterPriority,
  setFilterPriority,
  sortBy,
  setSortBy
}) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Filters & Search</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <Label htmlFor="search" className="text-sm font-medium">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="filterType" className="text-sm font-medium">Type</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Notes</SelectItem>
                <SelectItem value="standalone">Standalone</SelectItem>
                <SelectItem value="event-related">Event-Related</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="filterPriority" className="text-sm font-medium">Priority</Label>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="sortBy" className="text-sm font-medium">Sort By</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="event-soon">Event Soon (Default)</SelectItem>
                <SelectItem value="last-updated">Last Updated</SelectItem>
                <SelectItem value="last-created">Last Created</SelectItem>
                <SelectItem value="first-created">First Created</SelectItem>
                <SelectItem value="event-first">Event Related First</SelectItem>
                <SelectItem value="standalone-first">Standalone First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};