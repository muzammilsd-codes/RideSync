import React, { useState } from 'react';
import { X, UserPlus, CheckCircle2, AlertCircle, Shield, Lock } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Carpool } from '../../types';
import { Avatar } from '../ui/Avatar';

interface AdminAssignRiderModalProps {
  isOpen: boolean;
  onClose: () => void;
  carpool: Carpool | null;
  onSuccess?: () => void;
}

export const AdminAssignRiderModal: React.FC<AdminAssignRiderModalProps> = ({
  isOpen,
  onClose,
  carpool,
  onSuccess,
}) => {
  const { allUsers, adminAssignPassenger } = useStore();
  const [selectedRiderId, setSelectedRiderId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !carpool) return null;

  // Filter out host and already joined members
  const memberIds = carpool.members.map((m) => m.passenger_id);
  const eligibleRiders = allUsers.filter(
    (u) => u.id !== carpool.host_id && !memberIds.includes(u.id)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRiderId) {
      setErrorMsg('Please select an employee to assign.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const ok = adminAssignPassenger(carpool.id, selectedRiderId);
      setIsSubmitting(false);
      if (ok) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMsg('Unable to assign passenger. Ensure seats are available.');
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('An error occurred while assigning passenger.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-soft border border-[#E3ECF5] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E3ECF5] bg-gradient-to-r from-white via-[#F5FAFF] to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#4DA8FF] text-[#0F1B2D] flex items-center justify-center shadow-xs">
              <UserPlus className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F1B2D]">
                Assign Employee to Ride
              </h2>
              <p className="text-xs text-[#5B6B80]">
                Direct corporate seat booking with secret pickup code.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#5B6B80] hover:text-[#0F1B2D] hover:bg-[#F5FAFF] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-[#FFEBEB] border border-[#E5484D]/30 flex items-start gap-2.5 text-xs text-[#E5484D]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Ride Details Summary */}
          <div className="p-3.5 rounded-2xl bg-[#F5FAFF] border border-[#E3ECF5] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#0F1B2D]">Ride {carpool.id}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                carpool.visibility === 'women_only'
                  ? 'bg-[#F3ECFF] text-[#B084F5]'
                  : 'bg-[#E8F3FF] text-[#2B8CEB]'
              }`}>
                {carpool.visibility.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-[#5B6B80] block">Driver</span>
                <span className="font-bold text-[#0F1B2D]">{carpool.host_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#5B6B80] block">Departure</span>
                <span className="font-bold text-[#0F1B2D]">{carpool.start_time}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#5B6B80] block">Route</span>
                <span className="font-bold text-[#0F1B2D] truncate block">{carpool.origin_label}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#5B6B80] block">Available Seats</span>
                <span className="font-bold text-[#22B07D]">{carpool.seats_available} open</span>
              </div>
            </div>
          </div>

          {/* Rider Selection List */}
          <div>
            <label className="block text-xs font-bold text-[#0F1B2D] mb-2 uppercase tracking-wider">
              Select Employee to Book
            </label>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {eligibleRiders.map((rider) => {
                const isSelected = selectedRiderId === rider.id;
                const isDisallowed = carpool.visibility === 'women_only' && rider.gender !== 'female';

                return (
                  <button
                    key={rider.id}
                    type="button"
                    disabled={isDisallowed}
                    onClick={() => {
                      setSelectedRiderId(rider.id);
                      setErrorMsg(null);
                    }}
                    className={`w-full p-2.5 rounded-2xl text-left border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-[#E8F3FF] border-[#2B8CEB]'
                        : isDisallowed
                        ? 'bg-gray-50 border-gray-200 opacity-40 cursor-not-allowed'
                        : 'bg-[#F5FAFF] border-[#E3ECF5] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar
                        name={rider.full_name}
                        image={rider.photo_url}
                        size="sm"
                        isWomenOnly={rider.gender === 'female'}
                      />
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-[#2B8CEB]' : 'text-[#0F1B2D]'}`}>
                          {rider.full_name}
                        </p>
                        <p className="text-[10px] text-[#5B6B80] truncate">
                          {rider.employee_id} • {rider.gender} • {rider.home_area}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 pl-2">
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-[#2B8CEB]" />
                      ) : isDisallowed ? (
                        <Lock className="w-3.5 h-3.5 text-gray-400" />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E3ECF5]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#5B6B80] hover:text-[#0F1B2D]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedRiderId}
              className="px-5 py-2.5 rounded-2xl bg-[#4DA8FF] text-[#0F1B2D] hover:bg-[#2B8CEB] text-xs font-bold shadow-soft flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4 stroke-[2.2]" />
              <span>{isSubmitting ? 'Booking...' : 'Confirm Seat Booking'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
