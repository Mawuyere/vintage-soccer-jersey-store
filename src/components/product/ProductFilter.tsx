'use client';

import { useState, useEffect } from 'react';
import { X, Filter } from 'lucide-react';
import { ProductFilters } from '@/types';
import { Button, Input, Select, Badge } from '@/components/ui';
import { cn } from '@/lib/utils/cn';

export interface ProductFilterProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  availableTeams?: string[];
  availableYears?: string[];
  className?: string;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

const ProductFilter = ({
  filters,
  onFiltersChange,
  availableTeams = [],
  availableYears = [],
  className,
  isMobile = false,
  isOpen = true,
  onClose,
}: ProductFilterProps) => {
  const [localFilters, setLocalFilters] = useState<ProductFilters>(filters);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  useEffect(() => {
    const count = Object.values(localFilters).filter(
      (value) => value !== undefined && value !== '' && value !== null
    ).length;
    setActiveFiltersCount(count);
  }, [localFilters]);

  const handleFilterChange = (key: keyof ProductFilters, value: string | number | undefined) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const clearFilters = () => {
    const emptyFilters: ProductFilters = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const conditionOptions = [
    { value: '', label: 'All Conditions' },
    { value: 'Mint', label: 'Mint' },
    { value: 'Excellent', label: 'Excellent' },
    { value: 'Good', label: 'Good' },
    { value: 'Fair', label: 'Fair' },
  ];

  const sizeOptions = [
    { value: '', label: 'All Sizes' },
    { value: 'XS', label: 'XS' },
    { value: 'S', label: 'S' },
    { value: 'M', label: 'M' },
    { value: 'L', label: 'L' },
    { value: 'XL', label: 'XL' },
    { value: 'XXL', label: 'XXL' },
  ];

  const teamOptions = [
    { value: '', label: 'All Teams' },
    ...availableTeams.map((team) => ({ value: team, label: team })),
  ];

  const yearOptions = [
    { value: '', label: 'All Years' },
    ...availableYears.map((year) => ({ value: year, label: year })),
  ];

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          {activeFiltersCount > 0 && (
            <Badge variant="info" size="sm">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close filters"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Team Filter */}
      <div>
        <label htmlFor="team-filter" className="block text-sm font-medium text-gray-700 mb-2">
          Team
        </label>
        <Select
          id="team-filter"
          value={localFilters.team || ''}
          onChange={(e) => handleFilterChange('team', e.target.value || undefined)}
          options={teamOptions}
        />
      </div>

      {/* Year Filter */}
      <div>
        <label htmlFor="year-filter" className="block text-sm font-medium text-gray-700 mb-2">
          Year
        </label>
        <Select
          id="year-filter"
          value={localFilters.year || ''}
          onChange={(e) => handleFilterChange('year', e.target.value || undefined)}
          options={yearOptions}
        />
      </div>

      {/* Condition Filter */}
      <div>
        <label htmlFor="condition-filter" className="block text-sm font-medium text-gray-700 mb-2">
          Condition
        </label>
        <Select
          id="condition-filter"
          value={localFilters.condition || ''}
          onChange={(e) => handleFilterChange('condition', e.target.value || undefined)}
          options={conditionOptions}
        />
      </div>

      {/* Size Filter */}
      <div>
        <label htmlFor="size-filter" className="block text-sm font-medium text-gray-700 mb-2">
          Size
        </label>
        <Select
          id="size-filter"
          value={localFilters.size || ''}
          onChange={(e) => handleFilterChange('size', e.target.value || undefined)}
          options={sizeOptions}
        />
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Price Range
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="min-price" className="sr-only">
              Minimum price
            </label>
            <Input
              id="min-price"
              type="number"
              placeholder="Min"
              value={localFilters.minPrice || ''}
              onChange={(e) =>
                handleFilterChange('minPrice', e.target.value ? parseFloat(e.target.value) : undefined)
              }
              min="0"
              step="10"
            />
          </div>
          <div>
            <label htmlFor="max-price" className="sr-only">
              Maximum price
            </label>
            <Input
              id="max-price"
              type="number"
              placeholder="Max"
              value={localFilters.maxPrice || ''}
              onChange={(e) =>
                handleFilterChange('maxPrice', e.target.value ? parseFloat(e.target.value) : undefined)
              }
              min="0"
              step="10"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <Button onClick={clearFilters} variant="secondary" className="flex-1">
          Clear All
        </Button>
        <Button onClick={applyFilters} variant="primary" className="flex-1">
          Apply Filters
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div
        className={cn(
          'fixed inset-0 z-50 bg-white overflow-y-auto transition-transform duration-300',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          className
        )}
      >
        <div className="p-6">{content}</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-white border border-gray-200 rounded-lg p-6',
        className
      )}
    >
      {content}
    </div>
  );
};

export default ProductFilter;
