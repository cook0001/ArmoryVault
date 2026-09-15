import { BookOpen, Download, UploadCloud } from 'lucide-react';
import React from 'react';
import { exportToCSV } from '@/utils/csvExport';

interface ReportsSettingsSectionProps {
  onOpenCsvImport: () => void;
}

export const ReportsSettingsSection: React.FC<ReportsSettingsSectionProps> = ({
  onOpenCsvImport,
}) => {
  const handleGenerateReport = async () => {
    if (window.api && window.api.generateInsuranceReport) {
      try {
        const firearms = await window.api.getFirearms();
        const accessories = await window.api.getAccessories();
        const totalValue =
          firearms.reduce((sum, f) => sum + (Number(f.purchase_price) || 0), 0) +
          accessories.reduce(
            (sum, a) => sum + (Number(a.value) || 0) * (Number(a.quantity) || 1),
            0
          );

        const reportPath = await window.api.generateInsuranceReport({
          firearms,
          accessories,
          totalValue,
        });

        if (reportPath) {
          alert(`Report generated successfully at:\n${reportPath}`);
        }
      } catch (e) {
        console.error('Failed to generate report', e);
        alert('An error occurred while generating the report.');
      }
    }
  };

  const handleExportCSV = async () => {
    if (window.api && window.api.getFirearms && window.api.exportData) {
      try {
        const firearms = await window.api.getFirearms();
        const csvString = exportToCSV(firearms);
        await window.api.exportData(csvString, 'firearms_inventory.csv');
      } catch (e) {
        console.error('Failed to export CSV', e);
        alert('An error occurred while exporting CSV.');
      }
    }
  };

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-light)',
        borderRadius: '12px',
        padding: '1.25rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.5rem',
        }}
      >
        <BookOpen size={18} style={{ color: 'var(--accent)' }} />
        <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 600 }}>Insurance & Reports</h3>
      </div>
      <p
        style={{
          color: 'var(--text-secondary)',
          fontSize: '0.85rem',
          margin: '0 0 1rem',
        }}
      >
        Generate comprehensive documentation of your firearms and accessories for insurance or
        recordkeeping.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '0.75rem',
        }}
      >
        <button
          className="btn-secondary"
          onClick={handleGenerateReport}
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem',
            alignItems: 'center',
            padding: '0.65rem 1rem',
            fontSize: '0.85rem',
          }}
        >
          <BookOpen size={16} /> Insurance Report (PDF)
        </button>
        <button
          className="btn-secondary"
          onClick={handleExportCSV}
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem',
            alignItems: 'center',
            padding: '0.65rem 1rem',
            fontSize: '0.85rem',
          }}
        >
          <Download size={16} /> Export Firearms (CSV)
        </button>
        <button
          className="btn-primary"
          onClick={onOpenCsvImport}
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem',
            alignItems: 'center',
            padding: '0.65rem 1rem',
            fontSize: '0.85rem',
          }}
        >
          <UploadCloud size={16} /> Import Data (CSV)
        </button>
      </div>
    </div>
  );
};
