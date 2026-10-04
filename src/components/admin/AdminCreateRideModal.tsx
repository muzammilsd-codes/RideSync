import React, { useState, useId } from 'react';
import { 
  X, 
  Car, 
  Users, 
  Clock, 
  MapPin, 
  Shield, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles, 
  Calendar,
  Send,
  CheckCircle2,
  Lock,
  Tag,
  Repeat
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { HYDERABAD_ROUTES } from '../../data/fallbackRoutes';
import { RideVisibility } from '../../types';
import { Avatar } from '../ui/Avatar';

interface AdminCreateRideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (carpoolId: string) => void;
}

const DISPATCH_CATEGORIES = [
  { id: 'shift_commute', label: 'Regular Shift Commute', icon: Car },
  { id: 'late_night_escort', label: 'Late-Night Safe Escort (Women Drop)', icon: ShieldCheck, womenRecommended: true },
  { id: 'team_shuttle', label: 'Project Team Carpool', icon: Users },
  { id: 'client_transfer', label: 'Executive / Client Transfer', icon: Sparkles },
];

export const AdminCreateRideModal: React.FC<AdminCreateRideModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { allUsers, vehicles, currentCompany, adminCreateRide } = useStore();
  const formId = useId();

  // Eligible hosts (verified employees)
  const eligibleHosts = allUsers.filter((u) => u.verified);

  // Form State
  const [selectedHostId, setSelectedHostId] = useState<string>(eligibleHosts[0]?.id || 'user-ananya');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('kondapur-to-mindspace');
  const [customOrigin, setCustomOrigin] = useState<string>('Kondapur RTO / Botanical Garden');
  const [customDest, setCustomDest] = useState<string>('Mindspace Tech Park, HITEC City');
  const [departureDate, setDepartureDate] = useState<string>('Today');
  const [departureTime, setDepartureTime] = useState<string>('08:30');
  const [seatsTotal, setSeatsTotal] = useState<number>(4);
  const [visibility, setVisibility] = useState<RideVisibility>('public');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [dispatchCategory, setDispatchCategory] = useState<string>('Regular Shift Commute');
  const [preAssignedRiderIds, setPreAssignedRiderIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const selectedHost = allUsers.find((u) => u.id === selectedHostId) || eligibleHosts[0];

  // Vehicles matching this host or company fleet
  const hostVehicles = vehicles.filter((v) => v.owner_id === selectedHostId);
  const activeVehicle = vehicles.find((v) => v.id === selectedVehicleId) || hostVehicles[0] || vehicles[0];

  // Selected route definition
  const activeRoute = HYDERABAD_ROUTES.find((r) => r.id === selectedRouteId) || HYDERABAD_ROUTES[0];
  const isCustomRoute = selectedRouteId === 'custom';

  const originLabel = isCustomRoute ? customOrigin : activeRoute.origin.label;
  const originLat = isCustomRoute ? 17.4646 : activeRoute.origin.lat;
  const originLng = isCustomRoute ? 78.3619 : activeRoute.origin.lng;

  const destLabel = isCustomRoute ? customDest : activeRoute.dest.label;
  const destLat = isCustomRoute ? 17.4435 : activeRoute.dest.lat;
  const destLng = isCustomRoute ? 78.3772 : activeRoute.dest.lng;

  const distanceKm = isCustomRoute ? 6.5 : activeRoute.distance_km;
  const durationMin = isCustomRoute ? 20 : activeRoute.duration_min;

  // Potential riders to pre-assign (cannot be the host)
  const availableRiders = allUsers.filter((u) => u.id !== selectedHostId);

  // Toggle rider pre-assignment
  const toggleRiderAssignment = (riderId: string) => {
    const rider = allUsers.find((u) => u.id === riderId);
    if (!rider) return;

    if (visibility === 'women_only' && rider.gender !== 'female') {
      setErrorMsg(`Cannot assign male employee ${rider.full_name} to a Women-Only corporate ride.`);
      return;
    }

    setErrorMsg(null);
    if (preAssignedRiderIds.includes(riderId)) {
      setPreAssignedRiderIds((prev) => prev.filter((id) => id !== riderId));
    } else {
      if (preAssignedRiderIds.length >= seatsTotal) {
        setErrorMsg(`Cannot assign more than total seat capacity (${seatsTotal}).`);
        return;
      }
      setPreAssignedRiderIds((prev) => [...prev, riderId]);
    }
  };

  const handleHostChange = (newHostId: string) => {
    setSelectedHostId(newHostId);
    const newHost = allUsers.find((u) => u.id === newHostId);
    const newVeh = vehicles.find((v) => v.owner_id === newHostId);
    if (newVeh) setSelectedVehicleId(newVeh.id);

    // If women-only is active and host is male, reset or warn
    if (visibility === 'women_only' && newHost?.gender !== 'female') {
      setVisibility('public');
    }

    // Remove new host from pre-assigned riders if present
    setPreAssignedRiderIds((prev) => prev.filter((id) => id !== newHostId));
    setErrorMsg(null);
  };

  const handleVisibilityChange = (newVisibility: RideVisibility) => {
    if (newVisibility === 'women_only') {
      if (selectedHost.gender !== 'female') {
        setErrorMsg(`Designated host ${selectedHost.full_name} is male. Choose a verified female driver to schedule a Women-Only ride.`);
        return;
      }
      // Remove any non-female pre-assigned riders
      const invalidRiders = preAssignedRiderIds.filter((id) => {
        const u = allUsers.find((user) => user.id === id);
        return u && u.gender !== 'female';
      });
      if (invalidRiders.length > 0) {
        setPreAssignedRiderIds((prev) =>
          prev.filter((id) => {
            const u = allUsers.find((user) => user.id === id);
            return u && u.gender === 'female';
          })
        );
      }
    }
    setErrorMsg(null);
    setVisibility(newVisibility);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const newRide = adminCreateRide({
        hostId: selectedHostId,
        vehicleId: activeVehicle.id,
        originLabel,
        originLat,
        originLng,
        destLabel,
        destLat,
        destLng,
        startTime: departureTime,
        seatsTotal,
        visibility,
        inviteCode: visibility === 'private' ? `CORP-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
        recurrenceRule: isRecurring ? 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR' : undefined,
        dispatchCategory,
        preAssignedRiderIds,
      });

      setIsSubmitting(false);
      if (onSuccess) onSuccess(newRide.id);
      onClose();
    } catch (err: unknown) {
      setIsSubmitting(false);
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to dispatch ride. Please check inputs.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-white rounded-3xl shadow-soft border border-[#E3ECF5] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E3ECF5] bg-gradient-to-r from-white via-[#F5FAFF] to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#4DA8FF] text-[#0F1B2D] flex items-center justify-center shadow-xs">
              <Send className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#0F1B2D]">
                  Corporate Dispatch: Create Ride for Employee
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F3FF] text-[#2B8CEB] uppercase">
                  Admin Action
                </span>
              </div>
              <p className="text-xs text-[#5B6B80]">
                Designate host, set corporate corridor, pre-assign employees, and trigger server compliance.
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-[#FFEBEB] border border-[#E5484D]/30 flex items-start gap-2.5 text-xs text-[#E5484D] font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Host Employee Assignment */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor={`${formId}-host`} className="text-xs font-bold text-[#0F1B2D] uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#2B8CEB]" />
                1. Designate Driver / Host Employee
              </label>
              <span className="text-[11px] text-[#5B6B80]">
                {eligibleHosts.length} verified drivers in {currentCompany.name}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor={`${formId}-host`} className="block text-[11px] font-semibold text-[#5B6B80] mb-1">
                  Employee Driver
                </label>
                <select
                  id={`${formId}-host`}
                  value={selectedHostId}
                  onChange={(e) => handleHostChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5FAFF] border border-[#E3ECF5] text-xs font-semibold text-[#0F1B2D] focus:outline-none focus:border-[#2B8CEB]"
                >
                  {eligibleHosts.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.employee_id}) — {u.gender} • Trust: {u.trust_score}%
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor={`${formId}-vehicle`} className="block text-[11px] font-semibold text-[#5B6B80] mb-1">
                  Assigned Vehicle
                </label>
                <select
                  id={`${formId}-vehicle`}
                  value={activeVehicle.id}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5FAFF] border border-[#E3ECF5] text-xs font-semibold text-[#0F1B2D] focus:outline-none focus:border-[#2B8CEB]"
                >
                  {hostVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.make} {v.model} ({v.reg_no}) — {v.type}, {v.seats} seats
                    </option>
                  ))}
                  {/* Company Fleet fallbacks */}
                  <option value="veh-ananya">Fleet Pool: Hyundai i20 (TS 09 EZ 4082) - Hatchback</option>
                  <option value="veh-vikram">Fleet Pool: Tata Nexon EV (TS 08 FD 3341) - Electric SUV</option>
                  <option value="veh-sneha">Fleet Pool: Honda City e:HEV (TS 07 HK 9021) - Hybrid Sedan</option>
                  <option value="veh-bike-ather">Fleet Bike: Ather 450X EV (TS 10 EK 7712) - 1 seat</option>
                </select>
              </div>
            </div>

            {/* Host info preview chip */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F5FAFF] border border-[#E3ECF5]">
              <Avatar
                name={selectedHost.full_name}
                image={selectedHost.photo_url}
                size="md"
                isWomenOnly={selectedHost.gender === 'female'}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-[#0F1B2D] truncate">{selectedHost.full_name}</p>
                  <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-white border border-[#E3ECF5] text-[#5B6B80]">
                    {selectedHost.employee_id}
                  </span>
                  <span className="text-[10px] font-bold text-[#22B07D] bg-[#EBFBF5] px-2 py-0.2 rounded-full">
                    ★ {selectedHost.trust_score}% Trust
                  </span>
                </div>
                <p className="text-[11px] text-[#5B6B80] truncate mt-0.5">
                  Home: {selectedHost.home_area} • Vehicle: {activeVehicle.make} {activeVehicle.model} ({activeVehicle.reg_no})
                </p>
              </div>
            </div>
          </div>

          {/* 2. Corridor & Timing */}
          <div className="space-y-3 pt-1 border-t border-[#E3ECF5]">
            <label htmlFor={`${formId}-corridor`} className="text-xs font-bold text-[#0F1B2D] uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#2B8CEB]" />
              2. Corporate Commute Corridor & Timing
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label htmlFor={`${formId}-corridor`} className="block text-[11px] font-semibold text-[#5B6B80] mb-1">
                  Preset Corridor
                </label>
                <select
                  id={`${formId}-corridor`}
                  value={selectedRouteId}
                  onChange={(e) => setSelectedRouteId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5FAFF] border border-[#E3ECF5] text-xs font-semibold text-[#0F1B2D] focus:outline-none focus:border-[#2B8CEB]"
                >
                  {HYDERABAD_ROUTES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.distance_km} km, ~{r.duration_min} min)
                    </option>
                  ))}
                  <option value="custom">Custom Corridor (Manual Points)</option>
                </select>
              </div>

              <div>
                <label htmlFor={`${formId}-time`} className="block text-[11px] font-semibold text-[#5B6B80] mb-1">
                  Departure Time
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id={`${formId}-time`}
                    type="time"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl bg-[#F5FAFF] border border-[#E3ECF5] text-xs font-bold text-[#0F1B2D] focus:outline-none focus:border-[#2B8CEB]"
                  />
                </div>
              </div>
            </div>

            {/* Quick departure slot pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-bold text-[#5B6B80] mr-1">Shift Presets:</span>
              {[
                { label: '08:30 (Morning Core)', time: '08:30' },
                { label: '09:15 (Flexible Shift)', time: '09:15' },
                { label: '18:00 (Evening Core)', time: '18:00' },
                { label: '21:30 (Late Night Escort)', time: '21:30' },
              ].map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => setDepartureTime(slot.time)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                    departureTime === slot.time
                      ? 'bg-[#E8F3FF] text-[#2B8CEB] font-bold border border-[#2B8CEB]/30'
                      : 'bg-[#F5FAFF] text-[#5B6B80] hover:text-[#0F1B2D] border border-[#E3ECF5]'
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>

            {/* Custom Origin & Destination fields if custom is selected */}
            {isCustomRoute && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label htmlFor={`${formId}-custom-orig`} className="block text-[11px] font-semibold text-[#5B6B80] mb-1">Origin Label</label>
                  <input
                    id={`${formId}-custom-orig`}
                    type="text"
                    value={customOrigin}
                    onChange={(e) => setCustomOrigin(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl bg-[#F5FAFF] border border-[#E3ECF5] text-xs font-semibold"
                    placeholder="e.g. Ameerpet Metro Gate 2"
                  />
                </div>
                <div>
                  <label htmlFor={`${formId}-custom-dest`} className="block text-[11px] font-semibold text-[#5B6B80] mb-1">Destination Campus</label>
                  <input
                    id={`${formId}-custom-dest`}
                    type="text"
                    value={customDest}
                    onChange={(e) => setCustomDest(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl bg-[#F5FAFF] border border-[#E3ECF5] text-xs font-semibold"
                    placeholder="e.g. TechCorp Campus Main Gate"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Safety Policy & Category */}
          <div className="space-y-3 pt-1 border-t border-[#E3ECF5]">
            <label className="text-xs font-bold text-[#0F1B2D] uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#2B8CEB]" />
              3. Governance, Capacity & Eligibility
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Visibility */}
              <div>
                <label className="block text-[11px] font-semibold text-[#5B6B80] mb-1.5">
                  Ride Eligibility Policy
                </label>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleVisibilityChange('public')}
                    className={`px-3 py-2 rounded-xl text-left text-xs font-semibold border transition-all ${
                      visibility === 'public'
                        ? 'bg-[#E8F3FF] border-[#2B8CEB] text-[#2B8CEB] font-bold'
                        : 'bg-[#F5FAFF] border-[#E3ECF5] text-[#5B6B80]'
                    }`}
                  >
                    🏢 Company Public
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVisibilityChange('women_only')}
                    className={`px-3 py-2 rounded-xl text-left text-xs font-semibold border transition-all ${
                      visibility === 'women_only'
                        ? 'bg-[#F3ECFF] border-[#B084F5] text-[#B084F5] font-bold'
                        : 'bg-[#F5FAFF] border-[#E3ECF5] text-[#5B6B80]'
                    }`}
                  >
                    ♀ Women-Only (Strict)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVisibilityChange('private')}
                    className={`px-3 py-2 rounded-xl text-left text-xs font-semibold border transition-all ${
                      visibility === 'private'
                        ? 'bg-[#E8F3FF] border-[#2B8CEB] text-[#2B8CEB] font-bold'
                        : 'bg-[#F5FAFF] border-[#E3ECF5] text-[#5B6B80]'
                    }`}
                  >
                    🔒 Team Private (Code)
                  </button>
                </div>
              </div>

              {/* Total Seats & Recurrence */}
              <div className="space-y-3">
                <div>
                  <label htmlFor={`${formId}-seats`} className="block text-[11px] font-semibold text-[#5B6B80] mb-1">
                    Passenger Capacity: <span className="font-bold text-[#0F1B2D]">{seatsTotal} seats</span>
                  </label>
                  <input
                    id={`${formId}-seats`}
                    type="range"
                    min="1"
                    max="6"
                    value={seatsTotal}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setSeatsTotal(val);
                      if (preAssignedRiderIds.length > val) {
                        setPreAssignedRiderIds((prev) => prev.slice(0, val));
                      }
                    }}
                    className="w-full accent-[#2B8CEB]"
                  />
                  <div className="flex justify-between text-[10px] text-[#5B6B80] px-1">
                    <span>1 seat (Bike)</span>
                    <span>4 seats (Car)</span>
                    <span>6 seats (Van)</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#F5FAFF] border border-[#E3ECF5]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="rounded accent-[#2B8CEB]"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-[#0F1B2D] flex items-center gap-1">
                        <Repeat className="w-3.5 h-3.5 text-[#2B8CEB]" />
                        Corporate Weekday Shuttle
                      </p>
                      <p className="text-[10px] text-[#5B6B80]">Recurs Mon – Fri (RRULE)</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Category Purpose */}
              <div>
                <label className="block text-[11px] font-semibold text-[#5B6B80] mb-1.5">
                  Corporate Dispatch Category
                </label>
                <div className="space-y-1.5">
                  {DISPATCH_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = dispatchCategory === cat.label;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setDispatchCategory(cat.label);
                          if (cat.womenRecommended && selectedHost.gender === 'female') {
                            setVisibility('women_only');
                          }
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-xl text-left text-[11px] font-semibold border flex items-center gap-2 transition-all ${
                          isSelected
                            ? 'bg-[#E8F3FF] border-[#2B8CEB] text-[#2B8CEB] font-bold'
                            : 'bg-[#F5FAFF] border-[#E3ECF5] text-[#5B6B80] hover:text-[#0F1B2D]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Pre-Assign Employees (Direct Passenger Booking) */}
          <div className="space-y-3 pt-1 border-t border-[#E3ECF5]">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-[#0F1B2D] uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#2B8CEB]" />
                  4. Pre-Assign Employees (Direct Booking)
                </label>
                <p className="text-[11px] text-[#5B6B80]">
                  Admin can instantly book seats for commuters and dispatch secret pickup codes.
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E8F3FF] text-[#2B8CEB]">
                {preAssignedRiderIds.length} / {seatsTotal} Booked
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {availableRiders.map((rider) => {
                const isSelected = preAssignedRiderIds.includes(rider.id);
                const isDisallowed = visibility === 'women_only' && rider.gender !== 'female';

                return (
                  <button
                    key={rider.id}
                    type="button"
                    disabled={isDisallowed}
                    onClick={() => toggleRiderAssignment(rider.id)}
                    className={`p-2.5 rounded-2xl text-left border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-[#E8F3FF] border-[#2B8CEB] shadow-2xs'
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
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-[#5B6B80]/40" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Remaining seats status */}
            <div className="flex items-center justify-between text-xs p-3 rounded-2xl bg-[#F5FAFF] border border-[#E3ECF5]">
              <span className="text-[#5B6B80]">
                Remaining open seats for employee self-service:
              </span>
              <span className="font-bold text-[#0F1B2D]">
                {Math.max(0, seatsTotal - preAssignedRiderIds.length)} seats available
              </span>
            </div>
          </div>

          {/* 5. Summary & Environmental Impact Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#E8F3FF] to-[#F5FAFF] border border-[#2B8CEB]/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#2B8CEB] tracking-wider">
                Corporate Dispatch Plan Summary
              </span>
              <span className="text-[11px] font-bold text-[#22B07D] bg-white px-2 py-0.5 rounded-full border border-[#22B07D]/20">
                🌱 Est. {(distanceKm * currentCompany.co2_kg_per_km * Math.max(1, preAssignedRiderIds.length)).toFixed(2)} kg CO₂ Saved
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-[#5B6B80] block">Driver</span>
                <span className="font-bold text-[#0F1B2D] truncate block">{selectedHost.full_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#5B6B80] block">Corridor</span>
                <span className="font-bold text-[#0F1B2D] truncate block">{originLabel.split('/')[0]} → {destLabel.split(',')[0]}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#5B6B80] block">Time & Type</span>
                <span className="font-bold text-[#0F1B2D] block">{departureTime} • {visibility}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#5B6B80] block">Assigned / Total</span>
                <span className="font-bold text-[#2B8CEB] block">{preAssignedRiderIds.length} booked / {seatsTotal} seats</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold text-[#5B6B80] hover:text-[#0F1B2D] hover:bg-[#F5FAFF] transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-2xl bg-[#4DA8FF] text-[#0F1B2D] hover:bg-[#2B8CEB] text-xs font-bold shadow-soft flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <Send className="w-4 h-4 stroke-[2.2]" />
              <span>{isSubmitting ? 'Dispatching...' : '🚀 Dispatch Corporate Ride'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
