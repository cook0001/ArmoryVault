import React from 'react';
import { X, ExternalLink } from 'lucide-react';

interface DocumentViewerProps {
  url: string;
  title: string;
  onClose: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ url, title, onClose }) => {
  const [base64Data, setBase64Data] = React.useState<string | null>(null);
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  const isPDF = /\.pdf$/i.test(url);

  React.useEffect(() => {
    if (isPDF && window.api && window.api.readFileBase64) {
      window.api.readFileBase64(url.replace('file://', '')).then(data => {
        if (data) setBase64Data(`data:application/pdf;base64,${data}`);
      });
    }
  }, [url, isPDF]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.9)',
      zIndex: 9999, display: 'flex', flexDirection: 'column'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(0,0,0,0.5)' }}>
        <h3 style={{ margin: 0, color: 'white' }}>{title}</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => {
              if (window.api && window.api.openExternalFile) {
                window.api.openExternalFile(url.replace('file://', ''));
              }
            }}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white' }}
          >
            <ExternalLink size={16} /> Open in System Viewer
          </button>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <X size={24} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', overflow: 'hidden' }}>
        {isImage && (
          <img 
            src={url.startsWith('file://') ? url : `file://${url}`} 
            alt={title} 
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        )}
        
        {isPDF && base64Data && (
          <iframe 
            src={base64Data} 
            style={{ width: '100%', height: '100%', border: 'none', background: 'white' }}
            title={title}
          />
        )}

        {isPDF && !base64Data && (
          <div style={{ color: 'white' }}>Loading document...</div>
        )}

        {!isImage && !isPDF && (
          <div style={{ color: 'white', textAlign: 'center' }}>
            <p>Preview not available for this file type.</p>
            <button className="btn-primary" onClick={() => window.api?.openExternalFile(url.replace('file://', ''))}>
              Open in System Viewer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
