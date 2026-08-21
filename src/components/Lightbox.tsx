import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface LightboxProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({ images, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  if (!images || images.length === 0) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(16px)',
        zIndex: 100300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'transparent',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          zIndex: 100301,
        }}
      >
        <X size={32} />
      </button>

      {images.length > 1 && (
        <button
          onClick={handlePrev}
          style={{
            position: 'absolute',
            left: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: 'white',
            borderRadius: '50%',
            padding: '10px',
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={32} />
        </button>
      )}

      <img
        src={
          images[currentIndex].startsWith('local-file://')
            ? images[currentIndex]
            : `local-file://${images[currentIndex]}`
        }
        alt={`Gallery image ${currentIndex + 1}`}
        style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }}
      />

      {images.length > 1 && (
        <button
          onClick={handleNext}
          style={{
            position: 'absolute',
            right: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: 'white',
            borderRadius: '50%',
            padding: '10px',
            cursor: 'pointer',
          }}
        >
          <ChevronRight size={32} />
        </button>
      )}

      {images.length > 1 && (
        <div style={{ position: 'absolute', bottom: '20px', color: 'white', fontSize: '1rem' }}>
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>,
    document.body
  );
};
