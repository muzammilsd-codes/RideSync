import React from 'react';
import { ArrowLeft, Menu, Crosshair, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MapControlsProps {
  onBack?: () => void;
  showBack?: boolean;
  onRecenter?: () => void;
  onOpenMenu?: () => void;
  title?: string;
  badge?: string;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onBack,
  showBack = false,
  onRecenter,
  onOpenMenu,
  title,
  badge,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <>
      {/* Floating Top Bar (Top-Left Back/Menu + optional Header Pill) */}
      <div className="absolute top-4 left-4 right-4 z-30 pointer-events-none flex items-center justify-between">
        <div className="flex items-center gap-2 pointer-events-auto">
          {showBack ? (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Go back"
              className="w-11 h-11 rounded-full bg-white text-[#0F1B2D] border border-[#E3ECF5] shadow-soft flex items-center justify-center hover:bg-[#F5FAFF] hover:border-[#4DA8FF] active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-[#2B8CEB]"
            >
              <ArrowLeft className="w-5 h-5 text-[#0F1B2D]" strokeWidth={2} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenMenu}
              aria-label="Open menu"
              className="w-11 h-11 rounded-full bg-white text-[#0F1B2D] border border-[#E3ECF5] shadow-soft flex items-center justify-center hover:bg-[#F5FAFF] hover:border-[#4DA8FF] active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-[#2B8CEB]"
            >
              <Menu className="w-5 h-5 text-[#0F1B2D]" strokeWidth={2} />
            </button>
          )}

          {title && (
            <div className="px-3.5 py-2 rounded-full bg-white/95 backdrop-blur-md border border-[#E3ECF5] shadow-soft flex items-center gap-2">
              <span className="text-xs font-bold text-[#0F1B2D]">{title}</span>
              {badge && (
                <span className="text-[10px] font-semibold bg-[#E8F3FF] text-[#2B8CEB] px-2 py-0.5 rounded-full">
                  {badge}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Corporate Trust Badge */}
        <div className="pointer-events-auto hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#E3ECF5] shadow-xs text-xs font-medium text-[#5B6B80]">
          <Shield className="w-3.5 h-3.5 text-[#22B07D]" />
          <span>Verified Employees Only</span>
        </div>
      </div>

      {/* Recenter Button Above Sheet */}
      {onRecenter && (
        <button
          type="button"
          onClick={onRecenter}
          aria-label="Recenter map"
          className="absolute right-4 bottom-[232px] z-30 w-11 h-11 rounded-full bg-white text-[#0F1B2D] border border-[#E3ECF5] shadow-soft flex items-center justify-center hover:bg-[#F5FAFF] hover:border-[#4DA8FF] active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-[#2B8CEB]"
          title="Recenter to my location"
        >
          <Crosshair className="w-5 h-5 text-[#2B8CEB]" strokeWidth={2} />
        </button>
      )}
    </>
  );
};
