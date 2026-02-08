'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui';
import { cn } from '@/lib/utils/cn';

export interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  autoFocus?: boolean;
  initialValue?: string;
}

const SearchBar = ({
  onSearch,
  placeholder = 'Search jerseys by team, year, or name...',
  debounceMs = 300,
  className,
  autoFocus = false,
  initialValue = '',
}: SearchBarProps) => {
  const [query, setQuery] = useState(initialValue);
  const [debouncedQuery, setDebouncedQuery] = useState(initialValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [query, debounceMs]);

  const isSearching = query !== debouncedQuery;

  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleClear = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    onSearch('');
  }, [onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        
        <Input
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="pl-10 pr-10"
          aria-label="Search products"
          role="searchbox"
        />

        {(query || isSearching) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {isSearching ? (
              <Loader2 className="h-5 w-5 text-gray-400 animate-spin" aria-label="Searching..." />
            ) : (
              <button
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Clear search"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
      </div>

      {query && (
        <div className="mt-2 text-sm text-gray-600">
          {isSearching ? (
            'Searching...'
          ) : (
            <span>
              Showing results for <strong>&quot;{query}&quot;</strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
