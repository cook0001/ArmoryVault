import { Building2 } from 'lucide-react';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FflPickerModal } from '../../modals/FflPickerModal';

export interface SoldFormData {
  seller_name: string;
  sold_to_name: string;
  sold_date: string;
  sold_price: string;
  sale_notes: string;
}

interface MarkAsSoldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSale: (formData: SoldFormData) => void | Promise<void>;
  initialData?: Partial<SoldFormData>;
}

export const MarkAsSoldModal: React.FC<MarkAsSoldModalProps> = ({
  isOpen,
  onClose,
  onConfirmSale,
  initialData,
}) => {
  const [isFflPickerOpen, setIsFflPickerOpen] = useState(false);
  const [sellForm, setSellForm] = useState<SoldFormData>({
    seller_name: initialData?.seller_name || '',
    sold_to_name: initialData?.sold_to_name || '',
    sold_date: initialData?.sold_date || new Date().toISOString().split('T')[0],
    sold_price: initialData?.sold_price || '',
    sale_notes: initialData?.sale_notes || '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirmSale(sellForm);
  };

  return createPortal(
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h2>Mark Firearm as Sold</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Your Name (Seller)</label>
              <input
                required
                type="text"
                className="form-input"
                value={sellForm.seller_name}
                onChange={(e) => setSellForm({ ...sellForm, seller_name: e.target.value })}
                placeholder="e.g. John Doe"
              />
            </div>
            <div className="form-group">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                }}
              >
                <label style={{ margin: 0 }}>Buyer Name</label>
                <button
                  type="button"
                  onClick={() => setIsFflPickerOpen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#3b82f6',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 600,
                  }}
                >
                  <Building2 size={13} />
                  Lookup Licensed FFL
                </button>
              </div>
              <input
                required
                type="text"
                className="form-input"
                value={sellForm.sold_to_name}
                onChange={(e) => setSellForm({ ...sellForm, sold_to_name: e.target.value })}
                placeholder="e.g. Jane Smith or Apex Armory FFL"
              />
            </div>
            <div className="form-group">
              <label>Sale Date</label>
              <input
                required
                type="date"
                value={sellForm.sold_date}
                onChange={(e) => setSellForm({ ...sellForm, sold_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Sale Price ($)</label>
              <input
                required
                type="number"
                step="0.01"
                value={sellForm.sold_price}
                onChange={(e) => setSellForm({ ...sellForm, sold_price: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Sale Notes (Optional Secondary Info)</label>
              <textarea
                rows={3}
                value={sellForm.sale_notes}
                onChange={(e) => setSellForm({ ...sellForm, sale_notes: e.target.value })}
              ></textarea>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Confirm Sale
              </button>
            </div>
          </form>
        </div>
      </div>

      <FflPickerModal
        isOpen={isFflPickerOpen}
        onClose={() => setIsFflPickerOpen(false)}
        onSelect={(dealer) => {
          const fflName = dealer.trade_name
            ? `${dealer.business_name} (DBA: ${dealer.trade_name})`
            : dealer.business_name;
          const fflDetails = `FFL: ${dealer.license_num}\nAddress: ${dealer.street ? `${dealer.street}, ` : ''}${dealer.city}, ${dealer.state} ${dealer.zip}\nPhone: ${dealer.phone || 'N/A'}`;
          setSellForm((prev) => ({
            ...prev,
            sold_to_name: fflName,
            sale_notes: prev.sale_notes
              ? `${prev.sale_notes}\n\n[Transfer FFL Dealer]\n${fflDetails}`
              : `[Transfer FFL Dealer]\n${fflDetails}`,
          }));
        }}
      />
    </>,
    document.body
  );
};
