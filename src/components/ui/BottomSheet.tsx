import React, { useState, useRef } from 'react';

export type SnapPoint = 'peek' | 'half' | 'full';

export interface BottomSheetProps {
  snapPoint?: SnapPoint;
  initialSnap?: SnapPoint;
  defaultHeight?: SnapPoint;
  bottomOffset?: string;
  onSnapChange?: (snap: SnapPoint) => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  stickyFooter?: React.ReactNode;
  headerContent?: React.ReactNode;
  className?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  snapPoint: controlledSnap,
  initialSnap = 'half',
  defaultHeight,
  bottomOffset = 'bottom-16',
  onSnapChange,
  children,
  footer,
  stickyFooter,
  headerContent,
  className = '',
}) => {
  const initial = defaultHeight || initialSnap || 'half';
  const [internalSnap, setInternalSnap] = useState<SnapPoint>(initial);
  const snap = controlledSnap !== undefined ? controlledSnap : internalSnap;
  const activeFooter = stickyFooter || footer;

  const setSnap = (newSnap: SnapPoint) => {
    setInternalSnap(newSnap);
    if (onSnapChange) onSnapChange(newSnap);
  };

  const startYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startYRef.current = clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (startYRef.current === null) return;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;
    const deltaY = clientY - startYRef.current;
    startYRef.current = null;

    if (deltaY < -40) {
      // Swiped UP -> expand
      if (snap === 'peek') setSnap('half');
      else if (snap === 'half') setSnap('full');
    } else if (deltaY > 40) {
      // Swiped DOWN -> collapse
      if (snap === 'full') setSnap('half');
      else if (snap === 'half') setSnap('peek');
    }
  };

  const toggleSnap = () => {
    if (snap === 'peek') setSnap('half');
    else if (snap === 'half') setSnap('full');
    else setSnap('peek');
  };

  // Height mappings for the 3 snap points (adjusted so full snap clears top navbar)
  const snapHeights: Record<SnapPoint, string> = {
    peek: 'h-[140px]',
    half: 'h-[50vh] max-h-[500px]',
    full: 'h-[calc(100vh-140px)]',
  };

  return (
    <div
      className={`fixed ${bottomOffset} left-0 right-0 z-30 transition-all duration-200 ease-out flex justify-center pointer-events-none ${className}`}
    >
      <div
        className={`w-full max-w-lg bg-white rounded-t-[24px] border-t border-[#E3ECF5] shadow-soft flex flex-col pointer-events-auto overflow-hidden ${snapHeights[snap]}`}
      >
        {/* Drag Handle Bar (44px touch target) */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseUp={handleTouchEnd}
          onClick={toggleSnap}
          className="w-full flex flex-col items-center justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing select-none hover:bg-[#F5FAFF] transition-colors"
          role="button"
          aria-label="Drag or click to toggle sheet size"
        >
          <div className="w-12 h-1.5 rounded-full bg-[#E3ECF5] hover:bg-[#4DA8FF] transition-colors" />
          {headerContent && <div className="w-full px-5 mt-2">{headerContent}</div>}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-5 overscroll-contain no-scrollbar">
          {children}
          {/* Breathing room so bottom-most inputs/cards scroll completely clear of the sticky footer */}
          {activeFooter && <div className="h-20 shrink-0" />}
        </div>

        {/* Sticky Pinned 56px Footer CTA (Positioned cleanly above BottomNav) */}
        {activeFooter && (
          <div className="sticky bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-[#E3ECF5] shrink-0 z-10">
            {activeFooter}
          </div>
        )}
      </div>
    </div>
  );
};
