import React, { useState, useEffect } from 'react';
import { AlertTriangle, Share2, X, PhoneCall, ShieldAlert, Check } from 'lucide-react';
import { Button } from './Button';

interface SOSButtonProps {
  rideId?: string;
  driverName?: string;
  vehicleInfo?: string;
  corporateHelpline?: string;
}

export const SOSButton: React.FC<SOSButtonProps> = ({
  rideId = 'RIDE-1049',
  driverName = 'Alex M.',
  vehicleInfo = 'White Honda City (KA-03-MG-4421)',
  corporateHelpline = '+91 80 4900 1200',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [isTriggered, setIsTriggered] = useState(false);
  const [copied, setCopied] = useState(false);

  // Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isOpen && !isTriggered) {
      if (secondsLeft > 0) {
        interval = setInterval(() => {
          setSecondsLeft((prev) => prev - 1);
        }, 1000);
      } else {
        setIsTriggered(true);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, secondsLeft, isTriggered]);

  const handleOpen = () => {
    setSecondsLeft(5);
    setIsTriggered(false);
    setIsOpen(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    setSecondsLeft(5);
    setIsTriggered(false);
  };

  const handleShareLink = () => {
    const url = `${window.location.origin}/live/${rideId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const progressOffset = ((5 - secondsLeft) / 5) * 283; // 2 * PI * 45 ≈ 283

  return (
    <>
      {/* Docked 56px Round Red Button */}
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Emergency SOS"
        className="fixed bottom-[164px] right-4 z-40 w-14 h-14 rounded-full bg-[#E5484D] text-white flex items-center justify-center shadow-lg hover:bg-[#d4373c] active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-[#E5484D]/40"
      >
        <span className="sr-only">Emergency SOS</span>
        <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
      </button>

      {/* Full-Screen Confirmation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1B2D]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-[#E3ECF5] text-center space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#E5484D] bg-[#FFEBEB] px-2.5 py-1 rounded-full">
                Safety Protocol
              </span>
              <button
                type="button"
                onClick={handleCancel}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#5B6B80] hover:bg-[#F5FAFF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!isTriggered ? (
              <>
                {/* 5-Second Countdown Ring */}
                <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#F5FAFF"
                      strokeWidth="6"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#E5484D"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray="283"
                      strokeDashoffset={progressOffset}
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-36 font-bold text-[#E5484D] tracking-tight">{secondsLeft}</span>
                    <span className="text-[10px] font-semibold text-[#5B6B80] uppercase tracking-wider">Seconds</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-[#0F1B2D]">Alerting Corporate Security</h3>
                  <p className="text-xs text-[#5B6B80] leading-relaxed">
                    Live GPS coordinates and vehicle details will be transmitted to company dispatch and your emergency contacts.
                  </p>
                </div>

                <div className="pt-2 space-y-2.5">
                  <Button
                    variant="danger"
                    size="cta"
                    onClick={handleCancel}
                    className="w-full text-base font-bold shadow-md"
                  >
                    Cancel Alert
                  </Button>

                  <button
                    type="button"
                    onClick={handleShareLink}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-[#E3ECF5] text-xs font-semibold text-[#0F1B2D] hover:bg-[#F5FAFF] transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-[#22B07D]" /> : <Share2 className="w-4 h-4 text-[#2B8CEB]" />}
                    <span>{copied ? 'Live Link Copied!' : 'Share Live Trip Link'}</span>
                  </button>
                </div>
              </>
            ) : (
              /* Emergency Triggered State */
              <div className="space-y-4 py-2">
                <div className="w-16 h-16 rounded-full bg-[#FFEBEB] text-[#E5484D] mx-auto flex items-center justify-center animate-bounce">
                  <ShieldAlert className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-[#E5484D]">Security Dispatched</h3>
                  <p className="text-xs text-[#5B6B80]">
                    Enterprise safety desk notified with live telematics. An agent is dialing your phone.
                  </p>
                </div>

                <div className="p-3 bg-[#F5FAFF] rounded-2xl border border-[#E3ECF5] text-left text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#5B6B80]">Vehicle</span>
                    <span className="font-semibold text-[#0F1B2D]">{vehicleInfo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5B6B80]">Driver</span>
                    <span className="font-semibold text-[#0F1B2D]">{driverName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5B6B80]">Helpline</span>
                    <span className="font-bold text-[#2B8CEB]">{corporateHelpline}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <a
                    href={`tel:${corporateHelpline.replace(/\s+/g, '')}`}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#22B07D] text-white font-bold rounded-xl text-sm shadow-md"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Call Enterprise Helpline</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCancel}
                    className="py-2.5 text-xs font-semibold text-[#5B6B80] hover:text-[#0F1B2D]"
                  >
                    Dismiss Modal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
