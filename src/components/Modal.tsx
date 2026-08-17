import { useEffect, useRef, useState } from 'react';
import { ModalProps } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const isMobile = useIsMobile();
  const [dragY, setDragY] = useState(0);
  const touchStartY = useRef(0);
  const dragging = useRef(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setDragY(0);
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    dragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) setDragY(delta);
  };

  const handleTouchEnd = () => {
    dragging.current = false;
    if (dragY > 80) {
      onClose();
    }
    setDragY(0);
  };

  if (!isOpen) return null;

  // ── Mobile: bottom sheet ─────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex items-end">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div
          className="relative w-full bg-white dark:bg-stone-900 rounded-t-3xl shadow-2xl max-h-[92dvh] flex flex-col animate-slide-up"
          style={{
            transform: `translateY(${dragY}px)`,
            transition: dragY === 0 ? 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
          }}
        >
          {/* drag handle — swipe down here to close */}
          <div
            className="flex justify-center pt-3 pb-2 flex-shrink-0"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="w-10 h-1.5 bg-stone-300 dark:bg-stone-600 rounded-full" />
          </div>

          {/* header — also draggable */}
          <div
            className="flex items-center px-6 py-3 border-b border-stone-100 dark:border-stone-800 flex-shrink-0"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-50">{title}</h2>
          </div>

          {/* scrollable content */}
          <div className="overflow-y-auto px-6 py-5 pb-10 flex-1">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // ── Desktop: centered modal ──────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">{title}</h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition-colors p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
