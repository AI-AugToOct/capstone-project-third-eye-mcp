import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export interface MultiSelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
}

interface SmartMultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  searchable?: boolean;
  showSelectAll?: boolean;
  maxDisplay?: number;
  error?: string;
  required?: boolean;
}

export function SmartMultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select options',
  label,
  disabled = false,
  searchable = true,
  showSelectAll = true,
  maxDisplay = 3,
  error,
  required = false,
}: SmartMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOptions = options.filter((opt) => value.includes(opt.value));
  const allSelected = options.length > 0 && value.length === options.length;

  const filteredOptions = searchable && searchQuery
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opt.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange(options.map((opt) => opt.value));
    }
  };

  const removeOption = (optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue));
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      {label && (
        <label className="mb-2 block text-sm font-medium text-white">
          {label}
          {required && <span className="ml-1 text-brand-orange-400">*</span>}
        </label>
      )}

      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={clsx(
          'w-full rounded-lg border px-4 py-3 text-left transition-all duration-200',
          'flex items-center justify-between gap-2 min-h-[48px]',
          'focus:outline-none focus:ring-2 focus:ring-brand-orange-400/50',
          error
            ? 'border-error bg-error/5'
            : 'border-surface-border bg-surface-raised hover:border-brand-orange-400/40',
          disabled && 'cursor-not-allowed opacity-50',
          isOpen && 'border-brand-orange-400 ring-2 ring-brand-orange-400/30'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex-1 min-w-0">
          {selectedOptions.length === 0 ? (
            <span className="text-sm text-slate-400">{placeholder}</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {selectedOptions.slice(0, maxDisplay).map((option) => (
                <span
                  key={option.value}
                  className="inline-flex items-center gap-1 rounded-md bg-brand-orange-400/20 px-2 py-1 text-xs font-medium text-brand-orange-300"
                >
                  {option.icon && <span>{option.icon}</span>}
                  {option.label}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeOption(option.value);
                    }}
                    className="ml-0.5 rounded-full hover:bg-brand-orange-400/30 p-0.5"
                  >
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </span>
              ))}
              {selectedOptions.length > maxDisplay && (
                <span className="inline-flex items-center rounded-md bg-surface-overlay px-2 py-1 text-xs font-medium text-slate-300">
                  +{selectedOptions.length - maxDisplay} more
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {selectedOptions.length > 0 && (
            <span className="rounded-full bg-brand-orange-400/20 px-2 py-0.5 text-xs font-semibold text-brand-orange-400">
              {selectedOptions.length}
            </span>
          )}
          <svg
            className={clsx(
              'h-5 w-5 text-slate-400 transition-transform',
              isOpen && 'rotate-180'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {error && (
        <p className="mt-1 text-xs text-error-light">{error}</p>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full rounded-lg border border-surface-border bg-surface-overlay shadow-glow backdrop-blur-sm"
          >
            {searchable && (
              <div className="border-b border-surface-border p-2">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search options..."
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-brand-orange-400 focus:outline-none focus:ring-2 focus:ring-brand-orange-400/30"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            <div className="max-h-60 overflow-auto p-1">
              {showSelectAll && filteredOptions.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="w-full rounded-md px-3 py-2 text-left transition-colors hover:bg-brand-orange-400/10 flex items-center gap-3 border-b border-surface-border mb-1"
                >
                  <div className={clsx(
                    'h-4 w-4 rounded border-2 flex items-center justify-center transition-all',
                    allSelected
                      ? 'border-brand-orange-400 bg-brand-orange-400'
                      : 'border-surface-border bg-surface-raised'
                  )}>
                    {allSelected && (
                      <svg className="h-3 w-3 text-surface-base" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-brand-orange-400">
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </span>
                  <span className="ml-auto text-xs text-slate-400">
                    ({options.length} {options.length === 1 ? 'option' : 'options'})
                  </span>
                </button>
              )}

              {filteredOptions.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-slate-400">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = value.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleOption(option.value)}
                      className="w-full rounded-md px-3 py-2 text-left transition-colors hover:bg-brand-orange-400/10 flex items-start gap-3"
                    >
                      <div className={clsx(
                        'mt-0.5 h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center transition-all',
                        isSelected
                          ? 'border-brand-orange-400 bg-brand-orange-400'
                          : 'border-surface-border bg-surface-raised'
                      )}>
                        {isSelected && (
                          <svg className="h-3 w-3 text-surface-base" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {option.icon && <span className="text-lg">{option.icon}</span>}
                          <span className="text-sm font-medium text-white truncate">
                            {option.label}
                          </span>
                        </div>
                        {option.description && (
                          <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">
                            {option.description}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
