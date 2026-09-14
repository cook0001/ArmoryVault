import { ChevronLeft, ChevronRight, Maximize2, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface LightboxProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({ images, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  // Reset zoom & pan when image changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && zoom === 1) handleNext();
      if (e.key === 'ArrowLeft' && zoom === 1) handlePrev();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-' || e.key === '_') handleZoomOut();
      if (e.key === '0' || e.key.toLowerCase() === 'r') handleResetZoom();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length, zoom]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(5, Math.round((prev + 0.5) * 10) / 10));
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(1, Math.round((prev - 0.5) * 10) / 10);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(5, Math.round((z + 0.25) * 100) / 100));
    } else {
      setZoom((z) => {
        const next = Math.max(1, Math.round((z - 0.25) * 100) / 100);
        if (next === 1) setPan({ x: 0, y: 0 });
        return next;
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    if (zoom === 1) {
      setZoom(2.5);
    } else {
      handleResetZoom();
    }
  };

  const getAngleLabel = (index: number) => {
    switch (index) {
      case 0:
        return 'Slot 1: Left Profile';
      case 1:
        return 'Slot 2: Right Profile';
      case 2:
        return 'Slot 3: Rollmark & Serial';
      case 3:
        return 'Slot 4: Proofs & Bore';
      default:
        return `Angle ${index + 1} (Additional)`;
    }
  };

  if (!images || images.length === 0) return null;

  const currentImageSrc = images[currentIndex].startsWith('local-file://')
    ? images[currentIndex]
    : `local-file://${images[currentIndex]}`;

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
        backgroundColor: 'rgba(5, 8, 15, 0.95)',
        backdropFilter: 'blur(20px)',
        zIndex: 100300,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Inspection Toolbar */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '20px',
          right: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 100302,
        }}
      >
        {/* Angle Badge & Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(30, 41, 59, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              padding: '6px 12px',
              borderRadius: '8px',
              color: '#38bdf8',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            <span>{getAngleLabel(currentIndex)}</span>
          </div>
          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
            {currentIndex + 1} of {images.length}
          </span>
        </div>

        {/* Loupe & Zoom Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(51, 65, 85, 0.8)',
            padding: '4px 8px',
            borderRadius: '10px',
          }}
        >
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            style={{
              background: 'transparent',
              border: 'none',
              color: zoom <= 1 ? '#475569' : '#f8fafc',
              cursor: zoom <= 1 ? 'default' : 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '6px',
            }}
            title="Zoom Out (-)"
          >
            <ZoomOut size={18} />
          </button>

          <span
            style={{
              color: zoom > 1 ? '#38bdf8' : '#cbd5e1',
              fontSize: '0.8rem',
              fontWeight: 700,
              minWidth: '46px',
              textAlign: 'center',
            }}
          >
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={zoom >= 5}
            style={{
              background: 'transparent',
              border: 'none',
              color: zoom >= 5 ? '#475569' : '#f8fafc',
              cursor: zoom >= 5 ? 'default' : 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '6px',
            }}
            title="Zoom In (+)"
          >
            <ZoomIn size={18} />
          </button>

          <div style={{ width: '1px', height: '18px', backgroundColor: '#334155' }} />

          <button
            onClick={handleResetZoom}
            disabled={zoom === 1 && pan.x === 0 && pan.y === 0}
            style={{
              background: 'transparent',
              border: 'none',
              color: zoom === 1 && pan.x === 0 && pan.y === 0 ? '#475569' : '#f8fafc',
              cursor: zoom === 1 && pan.x === 0 && pan.y === 0 ? 'default' : 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '6px',
            }}
            title="Reset Zoom & Pan (R)"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(51, 65, 85, 0.8)',
            color: '#f8fafc',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Close (Esc)"
        >
          <X size={20} />
        </button>
      </div>

      {/* Prev Navigation Arrow */}
      {images.length > 1 && (
        <button
          onClick={handlePrev}
          style={{
            position: 'absolute',
            left: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(51, 65, 85, 0.8)',
            color: 'white',
            borderRadius: '50%',
            padding: '12px',
            cursor: 'pointer',
            zIndex: 100302,
            transition: 'background 0.2s',
          }}
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {/* Viewport Canvas */}
      <div
        style={{
          width: '88vw',
          height: '76vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        <img
          src={currentImageSrc}
          alt={`Studio inspection ${getAngleLabel(currentIndex)}`}
          draggable={false}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            transformOrigin: 'center center',
          }}
        />
      </div>

      {/* Next Navigation Arrow */}
      {images.length > 1 && (
        <button
          onClick={handleNext}
          style={{
            position: 'absolute',
            right: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(51, 65, 85, 0.8)',
            color: 'white',
            borderRadius: '50%',
            padding: '12px',
            cursor: 'pointer',
            zIndex: 100302,
            transition: 'background 0.2s',
          }}
        >
          <ChevronRight size={28} />
        </button>
      )}

      {/* Bottom Thumbnail Strip */}
      {images.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(51, 65, 85, 0.8)',
            padding: '8px 12px',
            borderRadius: '12px',
            maxWidth: '85vw',
            overflowX: 'auto',
            zIndex: 100302,
          }}
        >
          {images.map((img, idx) => {
            const src = img.startsWith('local-file://') ? img : `local-file://${img}`;
            const isActive = idx === currentIndex;
            return (
              <div
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                style={{
                  position: 'relative',
                  width: '54px',
                  height: '42px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: isActive ? '2px solid #38bdf8' : '1px solid #334155',
                  opacity: isActive ? 1 : 0.6,
                  transition: 'opacity 0.2s, border-color 0.2s',
                  flexShrink: 0,
                }}
              >
                <img
                  src={src}
                  alt={`Thumb ${idx + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>,
    document.body
  );
};
