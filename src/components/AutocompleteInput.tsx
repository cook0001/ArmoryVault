import { Check, ChevronDown } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

export type DropdownOption =
  | string
  | {
      value: string;
      label: string;
      sublabel?: string;
    };

export interface AutocompleteInputProps {
  id?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onSelectOption?: (val: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  mode?: 'autocomplete' | 'select';
  maxDropdownHeight?: number;
  style?: React.CSSProperties;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  id,
  name,
  value,
  onChange,
  onBlur,
  onSelectOption,
  options,
  placeholder,
  required,
  disabled,
  className = 'form-input',
  mode = 'autocomplete',
  maxDropdownHeight = 260,
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Normalize options to object format
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  // Find currently selected option for display
  const currentOption = normalizedOptions.find((opt) => opt.value === value || opt.label === value);
  const displayValue =
    mode === 'select' ? (currentOption ? currentOption.label : value || '') : value;

  // Filter options based on typed query
  const filteredOptions = normalizedOptions.filter((opt) => {
    if (mode === 'select') return true;
    const query = (value || '').trim().toLowerCase();
    if (!query) return true;
    return (
      opt.label.toLowerCase().includes(query) ||
      opt.value.toLowerCase().includes(query) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(query))
    );
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const highlightedEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedEl && typeof highlightedEl.scrollIntoView === 'function') {
        highlightedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (selectedVal: string) => {
    // Synthesize a change event
    const syntheticEvent = {
      target: {
        name,
        value: selectedVal,
      },
    } as React.ChangeEvent<HTMLInputElement>;

    onChange(syntheticEvent);
    if (onSelectOption) {
      onSelectOption(selectedVal);
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(filteredOptions.length - 1);
      } else {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
      }
    } else if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        e.preventDefault();
        handleSelect(filteredOptions[highlightedIndex].value);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div
      ref={containerRef}
      className="autocomplete-container"
      style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        ...style,
      }}
    >
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="text"
        autoComplete="off"
        readOnly={mode === 'select'}
        className={className}
        value={displayValue}
        onChange={(e) => {
          onChange(e);
          if (!isOpen) setIsOpen(true);
          setHighlightedIndex(0);
        }}
        onClick={() => {
          if (mode === 'select') {
            setIsOpen((prev) => !prev);
          } else if (!isOpen) {
            setIsOpen(true);
          }
        }}
        onFocus={() => {
          setIsOpen(true);
          setHighlightedIndex(-1);
        }}
        onBlur={(e) => {
          if (onBlur) onBlur(e);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        style={{
          width: '100%',
          paddingRight: '2.5rem',
          cursor: mode === 'select' ? 'pointer' : 'text',
        }}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
          if (!isOpen && inputRef.current) {
            inputRef.current.focus();
          }
        }}
        style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          transition: 'transform 0.15s ease, color 0.15s ease',
        }}
        aria-label="Toggle options"
      >
        <ChevronDown
          size={16}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      {isOpen && filteredOptions.length > 0 && (
        <div
          ref={listRef}
          className="autocomplete-dropdown-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 999,
            maxHeight: `${maxDropdownHeight}px`,
            overflowY: 'auto',
            background: 'rgba(15, 23, 42, 0.96)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--border-light, rgba(255, 255, 255, 0.12))',
            borderRadius: '8px',
            boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4)',
            padding: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {filteredOptions.map((opt, idx) => {
            const isSelected =
              opt.value === value || opt.label.toLowerCase() === (value || '').trim().toLowerCase();
            const isHighlighted = idx === highlightedIndex;

            return (
              <div
                key={`${opt.value}-${idx}`}
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent input onBlur from firing before click
                  handleSelect(opt.value);
                }}
                onMouseEnter={() => setHighlightedIndex(idx)}
                style={{
                  padding: '0.6rem 0.85rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  color: isSelected
                    ? '#38bdf8'
                    : isHighlighted
                      ? '#ffffff'
                      : 'var(--text-primary, #e2e8f0)',
                  background: isHighlighted
                    ? 'rgba(56, 189, 248, 0.18)'
                    : isSelected
                      ? 'rgba(56, 189, 248, 0.08)'
                      : 'transparent',
                  transition: 'background 0.1s ease, color 0.1s ease',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontWeight: isSelected ? 600 : 400 }}>{opt.label}</span>
                  {opt.sublabel && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                      {opt.sublabel}
                    </span>
                  )}
                </div>
                {isSelected && <Check size={14} color="#38bdf8" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
