import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { COUNTRIES } from '@/types/vendor.types';
import { cn } from '@/utils/index';

interface CountrySelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  value,
  onChange,
  placeholder = "Select country...",
  className = "",
  disabled = false
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Filter countries based on search input
  const filteredCountries = COUNTRIES.filter(country =>
    country.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (country: string) => {
    onChange(country);
    setOpen(false);
    setSearch('');
  };

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) setSearch('');
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            className
          )}
          disabled={disabled}
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder="Search country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 border-0 focus:ring-0 px-0"
          />
        </div>
        <div className="max-h-60 overflow-y-auto">
          {filteredCountries.length === 0 ? (
            <div className="py-6 text-center text-sm">No country found.</div>
          ) : (
            filteredCountries.map((country) => (
              <div
                key={country}
                className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSelect(country)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === country ? "opacity-100" : "opacity-0"
                  )}
                />
                {country}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};