import { X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';
import { SyncItem } from '../../../types';

export interface BoxSizePromptModalProps {
  pendingPrompt: { item: SyncItem; target: any } | null;
  customBoxSize: string;
  onCustomBoxSizeChange: (value: string) => void;
  onClose: () => void;
  onSave: () => Promise<void> | void;
}

export const BoxSizePromptModal: React.FC<BoxSizePromptModalProps> = ({
  pendingPrompt,
  customBoxSize,
  onCustomBoxSizeChange,
  onClose,
  onSave,
}) => {
  if (!pendingPrompt) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2>Unknown Box Size</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="modal-content">
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            We couldn't determine the standard box size for this item from the barcode. How many
            units (e.g. rounds, bullets) are in one box?
          </p>
          <div className="form-group">
            <label>Quantity per Box</label>
            <input
              type="number"
              value={customBoxSize}
              onChange={(e) => onCustomBoxSizeChange(e.target.value)}
              autoFocus
            />
          </div>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              marginTop: '1rem',
              fontStyle: 'italic',
            }}
          >
            This box size will be saved to your Custom SKUs database for all future scans of this
            item.
          </p>
        </div>
        <div
          className="modal-actions"
          style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-light)',
          }}
        >
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={onSave}>
            Save &amp; Approve
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
