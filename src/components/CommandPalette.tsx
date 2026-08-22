import { Search, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface CommandItem {
  id: string;
  label: string;
  sublabel?: string;
  action: () => void;
  keywords?: string[];
}

/**
 * CommandPalette — Global Cmd+K search overlay for quick navigation
 * and common actions. Press Cmd+K (Mac) or Ctrl+K (Win/Linux) to open.
 */
export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  // Navigation commands
  const commands: CommandItem[] = useMemo(
    () => [
      {
        id: 'nav-dashboard',
        label: 'Go to Dashboard',
        sublabel: 'Home / Overview',
        action: () => navigate('/'),
        keywords: ['home', 'overview', 'main'],
      },
      {
        id: 'nav-add-firearm',
        label: 'Add New Firearm',
        sublabel: 'Create a new inventory entry',
        action: () => navigate('/add'),
        keywords: ['new', 'create', 'gun', 'rifle', 'pistol'],
      },
      {
        id: 'nav-bound-book',
        label: 'Go to Bound Book',
        sublabel: 'Acquisition & Disposition records',
        action: () => navigate('/bound-book'),
        keywords: ['a&d', 'records', 'ffl', 'ledger'],
      },
      {
        id: 'nav-ammo',
        label: 'Go to Ammo & Reloading',
        sublabel: 'Ammunition inventory',
        action: () => navigate('/ammo'),
        keywords: ['ammunition', 'rounds', 'cartridges', 'bullets'],
      },
      {
        id: 'nav-components',
        label: 'Go to Reloading Components',
        sublabel: 'Powder, Primers, Brass, Bullets',
        action: () => navigate('/components'),
        keywords: ['powder', 'primers', 'brass', 'handload'],
      },
      {
        id: 'nav-accessories',
        label: 'Go to Accessories',
        sublabel: 'Optics, Suppressors, Lights, Mounts',
        action: () => navigate('/accessories'),
        keywords: ['optics', 'scopes', 'suppressors', 'lights', 'holsters'],
      },
      {
        id: 'nav-maintenance',
        label: 'Go to Maintenance',
        sublabel: 'Cleaning & service schedules',
        action: () => navigate('/maintenance'),
        keywords: ['cleaning', 'service', 'repair', 'schedule'],
      },
      {
        id: 'nav-ballistics',
        label: 'Go to Ballistics Calculator',
        sublabel: 'Trajectory & drop tables',
        action: () => navigate('/ballistics'),
        keywords: ['trajectory', 'drop', 'calculator', 'ballistic'],
      },
      {
        id: 'nav-storage',
        label: 'Go to Storage Organizer',
        sublabel: 'Safes, Cases, Ammo Cans',
        action: () => navigate('/storage'),
        keywords: ['safe', 'case', 'organize', 'location', 'container'],
      },
      {
        id: 'nav-load-dev',
        label: 'Go to Load Development',
        sublabel: 'Ladder tests & load data',
        action: () => navigate('/load-development'),
        keywords: ['ladder', 'load', 'development', 'recipe'],
      },
      {
        id: 'nav-nfa',
        label: 'Go to NFA Tracker',
        sublabel: 'Form 4, SBR, Suppressor stamps',
        action: () => navigate('/nfa-tracker'),
        keywords: ['nfa', 'form4', 'sbr', 'stamp', 'tax'],
      },
      {
        id: 'nav-sync',
        label: 'Go to Sync Inbox',
        sublabel: 'Mobile companion sync queue',
        action: () => navigate('/sync'),
        keywords: ['mobile', 'phone', 'sync', 'queue', 'companion'],
      },
      {
        id: 'action-activity-log',
        label: 'View Activity Audit Log',
        sublabel: 'Encrypted timeline of vault events & history',
        action: () => window.dispatchEvent(new Event('armoryvault-open-activity-log')),
        keywords: ['audit', 'history', 'timeline', 'log', 'activity', 'events'],
      },
    ],
    [navigate]
  );

  // Filter commands by query
  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const lower = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lower) ||
        (cmd.sublabel && cmd.sublabel.toLowerCase().includes(lower)) ||
        (cmd.keywords && cmd.keywords.some((k) => k.includes(lower)))
    );
  }, [commands, query]);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Reset selected index when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered.length]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.children[selectedIndex] as HTMLElement;
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].action();
      close();
    } else if (e.key === 'Escape') {
      close();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={close}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        {/* Search Input */}
        <div className="command-palette-input-wrap">
          <Search size={18} className="command-palette-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
          <button className="command-palette-close" onClick={close} title="Close (Esc)">
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="command-palette-results" ref={listRef}>
          {filtered.length === 0 && (
            <div className="command-palette-empty">No results for &ldquo;{query}&rdquo;</div>
          )}
          {filtered.map((cmd, index) => (
            <button
              key={cmd.id}
              className={`command-palette-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => {
                cmd.action();
                close();
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="command-palette-item-label">{cmd.label}</div>
              {cmd.sublabel && <div className="command-palette-item-sublabel">{cmd.sublabel}</div>}
            </button>
          ))}
        </div>

        {/* Footer Hint */}
        <div className="command-palette-footer">
          <span className="command-palette-kbd">↑↓</span> Navigate
          <span className="command-palette-kbd" style={{ marginLeft: 12 }}>
            ↵
          </span>{' '}
          Select
          <span className="command-palette-kbd" style={{ marginLeft: 12 }}>
            Esc
          </span>{' '}
          Close
        </div>
      </div>
    </div>
  );
};
