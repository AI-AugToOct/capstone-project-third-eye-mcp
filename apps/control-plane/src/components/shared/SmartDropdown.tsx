import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export interface DropdownOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
  meta?: string;
}

interface SmartDropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
  searchable?: boolean;
  allowCustom?: boolean;
  error?: string;
  required?: boolean;
}

export function SmartDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  description: _description,
  icon: _icon,
  disabled = false,
  searchable = true,
  allowCustom = false,
  error,
  required = false,
}: SmartDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = searchable && searchQuery
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opt.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const showCustomOption = allowCustom && searchQuery.trim() &&
    !filteredOptions.some(opt => opt.value.toLowerCase() === searchQuery.toLowerCase());

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
        setFocusedIndex(-1);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % filteredOptions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && filteredOptions[focusedIndex]) {
          onChange(filteredOptions[focusedIndex].value);
          setIsOpen(false);
          setSearchQuery('');
          setFocusedIndex(-1);
        } else if (allowCustom && searchQuery.trim()) {
          onChange(searchQuery.trim());
          setIsOpen(false);
          setSearchQuery('');
          setFocusedIndex(-1);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        setFocusedIndex(-1);
        break;
    }
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
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={clsx(
          'w-full rounded-lg border px-4 py-3 text-left transition-all duration-200',
          'flex items-center justify-between gap-2',
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
        <span className="flex items-center gap-2 flex-1 min-w-0">
          {selectedOption?.icon && (
            <span className="text-lg shrink-0">{selectedOption.icon}</span>
          )}
          <span className="truncate text-sm">
            {selectedOption ? (
              <span className="text-white">{selectedOption.label}</span>
            ) : (
              <span className="text-slate-400">{placeholder}</span>
            )}
          </span>
        </span>
        <svg
          className={clsx(
            'h-5 w-5 shrink-0 text-slate-400 transition-transform',
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
                  placeholder="Search..."
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-brand-orange-400 focus:outline-none focus:ring-2 focus:ring-brand-orange-400/30"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            <div className="max-h-60 overflow-auto p-1" role="listbox">
              {filteredOptions.length === 0 && !showCustomOption ? (
                <div className="px-3 py-6 text-center text-sm text-slate-400">
                  No options found
                </div>
              ) : (
                <>
                  {showCustomOption && (
                    <button
                      type="button"
                      onClick={() => {
                        onChange(searchQuery.trim());
                        setIsOpen(false);
                        setSearchQuery('');
                        setFocusedIndex(-1);
                      }}
                      className={clsx(
                        'w-full rounded-md px-3 py-2 text-left transition-colors',
                        'flex items-start gap-2',
                        'hover:bg-brand-orange-400/10 border border-dashed border-brand-orange-400/30'
                      )}
                    >
                      <span className="text-lg shrink-0">➕</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-brand-orange-400">
                          Add custom: "{searchQuery}"
                        </span>
                        <p className="mt-0.5 text-xs text-slate-400">
                          Press Enter to use this custom value
                        </p>
                      </div>
                    </button>
                  )}
                  {filteredOptions.map((option, index) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearchQuery('');
                      setFocusedIndex(-1);
                    }}
                    className={clsx(
                      'w-full rounded-md px-3 py-2 text-left transition-colors',
                      'flex items-start gap-2',
                      'hover:bg-brand-orange-400/10',
                      focusedIndex === index && 'bg-brand-orange-400/20',
                      option.value === value && 'bg-brand-orange-400/10'
                    )}
                    role="option"
                    aria-selected={option.value === value}
                  >
                    {option.icon && (
                      <span className="text-lg shrink-0">{option.icon}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-white truncate">
                          {option.label}
                        </span>
                        {option.meta && (
                          <span className="text-2xs text-slate-400 shrink-0">
                            {option.meta}
                          </span>
                        )}
                      </div>
                      {option.description && (
                        <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">
                          {option.description}
                        </p>
                      )}
                    </div>
                    {option.value === value && (
                      <svg
                        className="h-5 w-5 shrink-0 text-brand-orange-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
