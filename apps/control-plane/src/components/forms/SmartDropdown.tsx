import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import type { OptionItem } from '../../types/admin';

export interface SmartDropdownProps {
  value: string;
  options: OptionItem[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  allowCustom?: boolean;
  label?: string;
  description?: string;
  icon?: string;
  showCreateNew?: boolean;
  onCreateNew?: () => void;
}

export function SmartDropdown({
  value,
  options,
  onChange,
  placeholder = 'Select option...',
  disabled = false,
  allowCustom = false,
  label,
  description,
  icon,
  showCreateNew = false,
  onCreateNew,
}: SmartDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = useMemo(() =>
    options.find(opt => opt.value === value),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    if (!query) return options;
    const lowered = query.toLowerCase();
    return options.filter((item) =>
      [item.value, item.label, item.description]
        .filter(Boolean)
        .some((token) => token!.toLowerCase().includes(lowered))
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return;

    const handleClick = (event: MouseEvent) => {
      const node = containerRef.current;
      if (!node || (event.target instanceof Node && !node.contains(event.target))) {
        setOpen(false);
        setQuery('');
      }
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
    setQuery('');
  };

  const handleCustomSubmit = () => {
    if (allowCustom && query.trim()) {
      onChange(query.trim());
      setOpen(false);
      setQuery('');
    }
  };

  return (
    <div ref={containerRef} className="relative space-y-2">
      {/* Label */}
      {label && (
        <div>
          <label className="text-sm font-medium text-white flex items-center gap-2">
            {icon && <span>{icon}</span>}
            {label}
          </label>
          {description && (
            <p className="text-xs text-slate-400 mt-1">{description}</p>
          )}
        </div>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={clsx(
          'flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition',
          'bg-surface-base border-surface-outline/60 text-slate-100',
          'hover:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50',
          disabled && 'opacity-50 cursor-not-allowed',
          open && 'border-accent-primary ring-2 ring-accent-primary/50'
        )}
      >
        <div className="flex items-center gap-3 truncate">
          {selectedOption ? (
            <div className="flex items-center gap-2">
              {selectedOption.group && (
                <span className="inline-flex items-center rounded-full bg-accent-primary/20 px-2 py-0.5 text-xs font-medium text-accent-primary">
                  {selectedOption.group}
                </span>
              )}
              <span className="truncate text-white font-medium">
                {selectedOption.label || selectedOption.value}
              </span>
            </div>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="rounded-full p-1 text-slate-400 hover:bg-surface-outline/20 hover:text-white"
              disabled={disabled}
            >
              ✕
            </button>
          )}
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-xs text-slate-400"
          >
            ▼
          </motion.span>
        </div>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-30 mt-2 w-full rounded-xl border border-surface-outline/60 bg-surface-raised/95 backdrop-blur-sm p-3 shadow-xl"
          >
            {/* Search Input */}
            <div className="flex items-center gap-2 rounded-lg border border-surface-outline/50 bg-surface-base px-3 py-2 mb-3">
              <span className="text-slate-400">🔍</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && allowCustom && query) {
                    handleCustomSubmit();
                  }
                }}
                placeholder="Search or type custom value..."
                className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
              {allowCustom && query && (
                <button
                  type="button"
                  onClick={handleCustomSubmit}
                  className="rounded-full bg-accent-primary/20 px-3 py-1 text-xs text-accent-primary transition hover:bg-accent-primary/30"
                >
                  Add
                </button>
              )}
            </div>

            {/* Create New Option */}
            {showCreateNew && onCreateNew && (
              <button
                type="button"
                onClick={() => {
                  onCreateNew();
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-accent-primary transition hover:bg-accent-primary/10 border border-accent-primary/30 mb-2"
              >
                <span className="text-lg">+</span>
                <span>Create New {label}</span>
              </button>
            )}

            {/* Options List */}
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={clsx(
                      'w-full flex items-start gap-3 rounded-lg px-3 py-2 text-left text-sm transition',
                      'hover:bg-slate-800/40 text-slate-200',
                      value === option.value && 'bg-accent-primary/20 text-accent-primary'
                    )}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {option.group && (
                          <span className="inline-flex items-center rounded-full bg-surface-outline/30 px-2 py-0.5 text-xs text-slate-400">
                            {option.group}
                          </span>
                        )}
                        <span className="font-medium text-white">
                          {option.label || option.value}
                        </span>
                      </div>
                      {option.description && (
                        <p className="text-xs text-slate-400 mt-1">
                          {option.description}
                        </p>
                      )}
                    </div>
                    {value === option.value && (
                      <span className="text-accent-primary text-sm">✓</span>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-sm text-slate-500">
                  {allowCustom && query ? (
                    <div>
                      <p>No matches found</p>
                      <p className="text-xs mt-1">Press Enter to add "{query}"</p>
                    </div>
                  ) : (
                    'No options available'
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SmartDropdown;