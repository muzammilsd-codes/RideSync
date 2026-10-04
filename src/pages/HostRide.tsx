import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Car, 
  MapPin, 
  Shield, 
  Lock, 
  Check, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useStore } from '../lib/store';
import { RideVisibility } from '../types';
import { HYDERABAD_ROUTES } from '../data/fallbackRoutes';
import { MapView } from '../maps/MapView';
import { BottomSheet } from '../components/ui/BottomSheet';
import { MapControls } from '../components/MapControls';
import { Button } from '../components/ui/Button';
import { Stepper } from '../components/ui/Stepper';
import { TimePicker } from '../components/ui/TimePicker';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Toggle } from '../components/ui/Toggle';
import { Badge } from '../components/ui/Badge';
import { Toast } from '../components/ui/Toast';

export const HostRide: React.FC = () => {
  const { currentUser, vehicles, createCarpool } = useStore();
  const navigate = useNavigate();

  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const routePreset = HYDERABAD_ROUTES[selectedRouteIndex];

  const [fromLocation, setFromLocation] = useState(routePreset.origin.label);
  const [toLocation, setToLocation] = useState(routePreset.dest.label);
  const [departureTime, setDepartureTime] = useState('08:30');
  const [seats, setSeats] = useState(3);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    vehicles[0]?.id || 'veh-ananya'
  );
  const [privacyMode, setPrivacyMode] = useState<'public' | 'private'>('public');
  const [inviteCode, setInviteCode] = useState('DEV-TEAM-2026');
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(true);
  const [womenOnly, setWomenOnly] = useState(currentUser.gender === 'female');
  const [toastMessage, setToastMessage] = useState('');
  const [toastOpen, setToastOpen] = useState(false);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  const handleRoutePreset = (idx: number) => {
    setSelectedRouteIndex(idx);
    const r = HYDERABAD_ROUTES[idx];
    setFromLocation(r.origin.label);
    setToLocation(r.dest.label);
  };

  const handleVehicleSelect = (vehId: string) => {
    setSelectedVehicleId(vehId);
    const veh = vehicles.find((v) => v.id === vehId);
    if (veh?.vehicle_category === 'bike') {
      setSeats(1);
    } else if (seats < 2) {
      setSeats(3);
    }
  };

  const handlePostRide = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (womenOnly && currentUser.gender !== 'female') {
      setToastMessage('Safety Policy: Only female employees may host Women-Only pools.');
      setToastOpen(true);
      return;
    }

    const visibility: RideVisibility = womenOnly
      ? 'women_only'
      : privacyMode === 'private'
      ? 'private'
      : 'public';

    const newCarpool = createCarpool({
      host_id: currentUser.id,
      host_name: currentUser.full_name,
      host_gender: currentUser.gender,
      host_photo: currentUser.photo_url,
      host_employee_id: currentUser.employee_id,
      commute_id: `commute-${Date.now()}`,
      vehicle_id: selectedVehicleId,
      visibility,
      invite_code: privacyMode === 'private' ? (inviteCode || 'TEAM-SYNC') : undefined,
      recurrence_rule: recurrenceEnabled ? 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR' : undefined,
      seats_total: seats,
      seats_available: seats,
      start_time: departureTime,
      origin_label: fromLocation,
      origin_lat: routePreset.origin.lat,
      origin_lng: routePreset.origin.lng,
      dest_label: toLocation,
      dest_lat: routePreset.dest.lat,
      dest_lng: routePreset.dest.lng,
      polyline: routePreset.polyline,
      distance_km: routePreset.distance_km,
      duration_min: routePreset.duration_min,
    });

    setToastMessage('Ride posted! Colleague match requests will appear here.');
    setToastOpen(true);

    setTimeout(() => {
      navigate(`/carpool/${newCarpool.id}`);
    }, 800);
  };

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden bg-[#F5FAFF]">
      {/* Full-Screen Map with Planned Route */}
      <div className="absolute inset-0 z-0">
        <MapView
          height="100%"
          polyline={routePreset.polyline}
          interactive={true}
          stops={[
            {
              id: 'origin',
              label: fromLocation,
              lat: routePreset.origin.lat,
              lng: routePreset.origin.lng,
              kind: 'origin',
              seq: 1,
              eta_min: 0,
              completed: false,
            },
            {
              id: 'dest',
              label: toLocation,
              lat: routePreset.dest.lat,
              lng: routePreset.dest.lng,
              kind: 'destination',
              seq: 2,
              eta_min: routePreset.duration_min,
              completed: false,
            },
          ]}
        />
      </div>

      {/* Floating Top Controls (Back Button + Recenter) */}
      <MapControls
        showBack={true}
        onBack={() => navigate('/dashboard')}
        title="Host a ride"
        badge="Driver Mode"
      />

      {/* Single Scrolling Sheet with Sticky 56px CTA */}
      <BottomSheet
        initialSnap="half"
        stickyFooter={
          <Button
            type="button"
            variant="primary"
            size="cta"
            onClick={() => handlePostRide()}
            className="w-full text-base font-bold shadow-soft"
          >
            Post ride
          </Button>
        }
      >
        <div className="space-y-5 pb-6">
          {/* Header Title */}
          <div>
            <h1 className="text-20 font-bold text-[#0F1B2D] tracking-tight">Post your daily route</h1>
            <p className="text-xs text-[#5B6B80]">Offer empty seats to verified colleagues</p>
          </div>

          {/* Quick Route Corridor Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {HYDERABAD_ROUTES.map((r, i) => (
              <button
                key={r.name}
                type="button"
                onClick={() => handleRoutePreset(i)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedRouteIndex === i
                    ? 'bg-[#E8F3FF] text-[#2B8CEB] border border-[#2B8CEB] font-semibold'
                    : 'bg-[#F5FAFF] text-[#5B6B80] border border-[#E3ECF5] hover:border-[#4DA8FF]'
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>

          {/* Location Fields: From and To */}
          <div className="p-3.5 bg-[#F5FAFF] border border-[#E3ECF5] rounded-2xl space-y-3">
            {/* From */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white border border-[#E3ECF5] flex items-center justify-center text-[#2B8CEB] shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#5B6B80]">
                  From (Pickup Landmark)
                </label>
                <input
                  type="text"
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-[#0F1B2D] focus:outline-none"
                  placeholder="Enter starting point"
                />
              </div>
            </div>

            <div className="border-t border-[#E3ECF5]" />

            {/* To */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white border border-[#E3ECF5] flex items-center justify-center text-[#0F1B2D] shrink-0">
                <MapPin className="w-4 h-4 fill-[#0F1B2D]" />
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#5B6B80]">
                  To (Campus Office)
                </label>
                <input
                  type="text"
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-[#0F1B2D] focus:outline-none"
                  placeholder="Enter corporate destination"
                />
              </div>
            </div>
          </div>

          {/* Time Picker (Large 28-36px font) */}
          <TimePicker
            value={departureTime}
            onChange={(t) => setDepartureTime(t)}
            label="Departure Time"
          />

          {/* Seats Stepper (-/+) */}
          <div className="p-3.5 bg-white border border-[#E3ECF5] rounded-2xl shadow-xs">
            <Stepper
              value={seats}
              min={1}
              max={6}
              onChange={(s) => setSeats(s)}
              label="Seats available"
              helperText="Exclude driver seat"
            />
          </div>

          {/* Vehicle Selector (Cars and Bikes) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#5B6B80]">
              Vehicle (Car / Bike)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleVehicleSelect(v.id)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    selectedVehicleId === v.id
                      ? 'bg-[#E8F3FF] border-[#2B8CEB] text-[#0F1B2D]'
                      : 'bg-white border-[#E3ECF5] text-[#5B6B80] hover:border-[#4DA8FF]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0F1B2D] truncate">
                      {v.vehicle_category === 'bike' ? '🏍️ ' : '🚗 '}
                      {v.model}
                    </span>
                    {v.fuel_type === 'EV' && (
                      <span className="text-[10px] bg-[#E8F3FF] text-[#2B8CEB] px-1.5 py-0.5 rounded font-bold shrink-0">
                        EV
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#5B6B80] block mt-0.5">{v.reg_no}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Segmented Control: Public / Private */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#5B6B80]">
              Ride Visibility
            </label>
            <SegmentedControl
              options={[
                { label: 'Public (All verified)', value: 'public' },
                { label: 'Private (Team only)', value: 'private' },
              ]}
              value={privacyMode}
              onChange={(v) => setPrivacyMode(v as 'public' | 'private')}
            />
          </div>

          {/* Private Ride Invite Code Input (CHECK constraint in schema) */}
          {privacyMode === 'private' && (
            <div className="p-3.5 bg-white border border-[#E3ECF5] rounded-2xl shadow-xs space-y-1">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#5B6B80]">
                Team Invite Code (Required for private rides)
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="e.g. DEV-TEAM-2026"
                className="w-full bg-[#F5FAFF] border border-[#E3ECF5] px-3 py-2 rounded-xl text-xs font-mono font-bold text-[#2B8CEB] focus:outline-none"
              />
            </div>
          )}

          {/* Recurrence Rule Toggle */}
          <div className="p-3.5 bg-white border border-[#E3ECF5] rounded-2xl shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-[#0F1B2D] block">Weekly Mon–Fri Recurrence</span>
                <span className="text-xs text-[#5B6B80]">Auto-schedule for standard office workdays</span>
              </div>
              <Toggle
                checked={recurrenceEnabled}
                onChange={(checked) => setRecurrenceEnabled(checked)}
              />
            </div>
          </div>

          {/* Toggle Row: "Women only" with purple badge preview */}
          <div className="p-3.5 bg-white border border-[#E3ECF5] rounded-2xl shadow-xs">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#0F1B2D]">Women only</span>
                  <Badge variant="women-only">Purple Shield</Badge>
                </div>
                <p className="text-xs text-[#5B6B80]">
                  Only verified female employees can discover & join
                </p>
              </div>

              <Toggle
                checked={womenOnly}
                onChange={(checked) => {
                  if (checked && currentUser.gender !== 'female') {
                    setToastMessage('Policy: Only female employees can host Women-Only carpools.');
                    setToastOpen(true);
                    return;
                  }
                  setWomenOnly(checked);
                }}
              />
            </div>
          </div>
        </div>
      </BottomSheet>

      <Toast
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
        message={toastMessage}
        type={toastMessage.includes('Policy') ? 'error' : 'success'}
      />
    </div>
  );
};
