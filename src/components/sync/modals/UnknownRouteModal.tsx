import { X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';
import { SyncItem } from '../../../types';

export interface UnknownRouteModalProps {
  unknownRouteItem: { item: SyncItem; upc: string } | null;
  onClose: () => void;
  onRoute: (
    destination: 'ammo' | 'components' | 'accessories',
    item: SyncItem,
    upc: string
  ) => Promise<void> | void;
}

export const UnknownRouteModal: React.FC<UnknownRouteModalProps> = ({
  unknownRouteItem,
  onClose,
  onRoute,
}) => {
  if (!unknownRouteItem) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2>Item Not Found</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="modal-content">
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Barcode <strong>{unknownRouteItem.upc}</strong> wasn't found in the global database.
            What kind of item is this?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              className="btn-primary"
              onClick={() => onRoute('ammo', unknownRouteItem.item, unknownRouteItem.upc)}
            >
              Add as Ammo
            </button>
            <button
              className="btn-primary"
              onClick={() => onRoute('components', unknownRouteItem.item, unknownRouteItem.upc)}
            >
              Add as Component
            </button>
            <button
              className="btn-primary"
              onClick={() => onRoute('accessories', unknownRouteItem.item, unknownRouteItem.upc)}
            >
              Add as Accessory
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
