import { CheckCircle, DownloadCloud, FolderOpen, HardDrive, UploadCloud } from 'lucide-react';
import React from 'react';

interface BackupSettingsSectionProps {
  backupPath: string | null;
  onSelectBackup: () => void | Promise<void>;
  onCreateZipBackup: () => void | Promise<void>;
  onRestoreBackup: () => void | Promise<void>;
}

export const BackupSettingsSection: React.FC<BackupSettingsSectionProps> = ({
  backupPath,
  onSelectBackup,
  onCreateZipBackup,
  onRestoreBackup,
}) => {
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
        <HardDrive size={18} style={{ color: 'var(--accent)' }} />
        <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 600 }}>Backups & Redundancy</h3>
      </div>
      <p
        style={{
          color: 'var(--text-secondary)',
          fontSize: '0.85rem',
          margin: '0 0 1rem',
        }}
      >
        Keep your encrypted inventory safe across external drives or cloud sync folders (e.g.
        Dropbox, OneDrive).
      </p>

      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          marginBottom: '0.75rem',
        }}
      >
        <div
          style={{
            flex: 1,
            background: 'rgba(0,0,0,0.25)',
            padding: '0.65rem 0.9rem',
            borderRadius: '6px',
            border: '1px solid var(--border-light)',
            fontSize: '0.85rem',
            color: backupPath ? 'var(--text-primary)' : 'var(--text-secondary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {backupPath || 'No auto-backup folder configured.'}
        </div>
        <button
          className="btn-secondary"
          onClick={onSelectBackup}
          style={{
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.65rem 1rem',
            fontSize: '0.85rem',
          }}
        >
          <FolderOpen size={16} /> Choose Folder...
        </button>
      </div>

      {backupPath && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--success)',
            fontSize: '0.8rem',
            marginBottom: '1rem',
          }}
        >
          <CheckCircle size={14} /> Auto-rotates up to 5 date-stamped encrypted vault backups in
          this folder.
        </div>
      )}

      <div
        style={{
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-light)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '0.75rem',
        }}
      >
        <button
          className="btn-primary"
          onClick={onCreateZipBackup}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'var(--success)',
            justifyContent: 'center',
            padding: '0.65rem 1rem',
            fontSize: '0.85rem',
          }}
        >
          <DownloadCloud size={16} />
          Create Full .zip Archive
        </button>
        <button
          className="btn-secondary"
          onClick={onRestoreBackup}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            justifyContent: 'center',
            padding: '0.65rem 1rem',
            fontSize: '0.85rem',
            color: 'var(--accent)',
            borderColor: 'rgba(59, 130, 246, 0.4)',
          }}
          title="Restore database from an encrypted .enc or .zip backup"
        >
          <UploadCloud size={16} />
          Restore from Backup (.enc / .zip)
        </button>
      </div>
    </div>
  );
};
