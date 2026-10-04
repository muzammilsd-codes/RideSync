import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  Car, 
  MapPin, 
  Clock, 
  Shield, 
  Navigation, 
  Play, 
  Pause, 
  RotateCcw,
  CheckCircle2,
  KeyRound,
  Share2,
  Gauge,
  Star,
  Activity,
  Copy,
  Check
} from 'lucide-react';
import { useStore } from '../lib/store';
import { CarpoolStatus } from '../types';
import { MapView } from '../maps/MapView';
import { BottomSheet } from '../components/ui/BottomSheet';
import { MapControls } from '../components/MapControls';
import { StatusStepper } from '../components/ui/StatusStepper';
import { SOSButton } from '../components/ui/SOSButton';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Toast } from '../components/ui/Toast';
import { RatingModal } from '../components/ui/RatingModal';
import { interpolatePolyline, computePolylineDistanceKm } from '../utils/geo';

export const LiveTrip: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    currentUser, 
    carpools, 
    activeCarpoolId, 
    updateCarpoolStatus, 
    updateCarpoolProgress,
    submitRating,
    logAuditEvent,
  } = useStore();

  const carpool = carpools.find((c) => c.id === (id || activeCarpoolId)) || carpools[0];

  const [progress, setProgress] = useState(0.35); // Start mid-trip for fast demonstration
  const [isPlaying, setIsPlaying] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [tripEventsLog, setTripEventsLog] = useState<string[]>([
    'Ride initialized along Gachibowli -> Mindspace corridor',
    'Driver GPS telemetry connected (trip_locations)',
    'Boarding pass confirmed with 4-digit OTP',
  ]);

  const isHost = carpool.host_id === currentUser.id;
  const isPassenger = carpool.members.some((m) => m.passenger_id === currentUser.id);

  // Driver marker position interpolated along polyline
  const currentLocation = interpolatePolyline(carpool.polyline, progress);
  const totalKm = computePolylineDistanceKm(carpool.polyline);
  const remainingKm = Math.max(0.5, (1 - progress) * totalKm).toFixed(1);
  const etaMinutes = Math.max(1, Math.round((1 - progress) * (carpool.duration_min || 25)));

  // Simulated live speed (PostgreSQL trip_locations.speed_kmh)
  const currentSpeed = isPlaying 
    ? Math.round(36 + Math.sin(progress * 12) * 14) 
    : progress >= 1 ? 0 : 28;

  // Simulated GPS movement loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && progress < 1) {
      interval = setInterval(() => {
        setProgress((prev) => {
          const next = prev + 0.04;
          if (next >= 1) {
            setIsPlaying(false);
            updateCarpoolStatus(carpool.id, 'completed');
            confetti({ particleCount: 80, spread: 70 });
            setTripEventsLog(prevLog => [...prevLog, 'Arrived at Mindspace Tech Park Building 12', 'Trip completed']);
            // Prompt rating modal
            setTimeout(() => setRatingModalOpen(true), 1200);
            return 1;
          }

          if (next > 0.15 && next < 0.40 && carpool.status === 'scheduled') {
            updateCarpoolStatus(carpool.id, 'driver_arriving');
            setTripEventsLog(prevLog => [...prevLog, 'Driver en route to pickup spot']);
          } else if (next >= 0.40 && next < 0.60 && carpool.status === 'driver_arriving') {
            updateCarpoolStatus(carpool.id, 'at_pickup');
            setTripEventsLog(prevLog => [...prevLog, 'Driver arrived at pickup waypoint']);
          } else if (next >= 0.60 && next < 0.95 && carpool.status !== 'in_progress') {
            updateCarpoolStatus(carpool.id, 'in_progress');
            setTripEventsLog(prevLog => [...prevLog, 'Passenger onboard (OTP 4821 verified)', 'In transit along corridor']);
          }

          return next;
        });
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isPlaying, progress, carpool.id, carpool.status, updateCarpoolStatus]);

  // Sync to global store
  useEffect(() => {
    updateCarpoolProgress(carpool.id, currentLocation.lat, currentLocation.lng, progress);
  }, [progress, carpool.id, currentLocation.lat, currentLocation.lng, updateCarpoolProgress]);

  const handleToggleSimulation = () => {
    if (progress >= 1) {
      setProgress(0);
      updateCarpoolStatus(carpool.id, 'scheduled');
      setHasRated(false);
    }
    setIsPlaying(!isPlaying);
  };

  const handleShareTrip = () => {
    const shareUrl = `${window.location.origin}/live/${carpool.id}?token=sos_live_${carpool.id.slice(-6)}`;
    navigator.clipboard.writeText(shareUrl);
    setToastMessage('Live trip tracking link copied to clipboard.');
    setToastOpen(true);
    logAuditEvent({
      actor_id: currentUser.id,
      actor_name: currentUser.full_name,
      action: 'SHARE_TRIP_LINK',
      entity: 'sos_events',
      entity_id: carpool.id,
      details: 'Shared live GPS tracking token with external contacts',
    });
  };

  const handleRatingSubmit = (score: number, comment: string, tags: string[]) => {
    const rateeId = isHost 
      ? (carpool.members[0]?.passenger_id || 'user-priya') 
      : carpool.host_id;
    const rateeName = isHost 
      ? (carpool.members[0]?.passenger_name || 'Priya Patel') 
      : carpool.host_name;

    submitRating({
      ride_id: carpool.id,
      rater_id: currentUser.id,
      rater_name: currentUser.full_name,
      ratee_id: rateeId,
      ratee_name: rateeName,
      score,
      comment,
      tags,
    });
    setHasRated(true);
    setToastMessage(`Thanks! ${score}-star rating saved into PostgreSQL 'ratings' table.`);
    setToastOpen(true);
  };

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden bg-[#F5FAFF]">
      {/* 1. Full-Screen Map with Animated Driver Marker & Light-Blue Route */}
      <div className="absolute inset-0 z-0">
        <MapView
          height="100%"
          polyline={carpool.polyline}
          interactive={true}
          currentVehicleLocation={currentLocation}
          stops={carpool.stops}
        />
      </div>

      {/* Floating Top Controls (Back Button & Live Badge) */}
      <MapControls
        showBack={true}
        onBack={() => navigate('/dashboard')}
        title="Live trip"
        badge={carpool.status === 'completed' ? 'Completed' : 'En route'}
      />

      {/* 2. Draggable Bottom Sheet with Status Stepper, Big ETA, Speedometer & Driver Info */}
      <BottomSheet
        initialSnap="half"
        defaultHeight="half"
        stickyFooter={
          <div className="flex items-center gap-2 w-full">
            <Button
              type="button"
              variant="primary"
              size="cta"
              onClick={handleToggleSimulation}
              className="flex-1 text-base font-bold shadow-soft flex items-center justify-center gap-2"
            >
              {progress >= 1 ? (
                <>
                  <RotateCcw className="w-5 h-5" />
                  <span>Restart Trip Simulation</span>
                </>
              ) : isPlaying ? (
                <>
                  <Pause className="w-5 h-5" />
                  <span>Pause Live Simulation</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>Simulate Vehicle Movement</span>
                </>
              )}
            </Button>

            {progress >= 1 && !hasRated && (
              <Button
                type="button"
                variant="secondary"
                size="cta"
                onClick={() => setRatingModalOpen(true)}
                className="px-4 text-xs font-bold flex items-center gap-1.5"
              >
                <Star className="w-4 h-4 text-[#FFB800] fill-current" />
                <span>Rate</span>
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-4 pb-6">
          {/* Horizontal Status Stepper: Scheduled, En route, Picked up, In transit, Completed */}
          <div className="bg-[#F5FAFF] border border-[#E3ECF5] rounded-2xl p-3">
            <StatusStepper currentStatus={carpool.status} />
          </div>

          {/* Large ETA Section + Live Speedometer (PostgreSQL trip_locations.speed_kmh) */}
          <div className="p-4 bg-white border border-[#E3ECF5] rounded-2xl shadow-soft flex items-baseline justify-between">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-[#5B6B80]">
                Estimated Arrival
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-32 md:text-36 font-semibold text-[#0F1B2D] tracking-tight tabular-nums">
                  {progress >= 1 ? 'Arrived' : `${etaMinutes} mins`}
                </span>
                {progress < 1 && (
                  <span className="text-xs font-bold text-[#22B07D]">
                    ({remainingKm} km away)
                  </span>
                )}
              </div>
            </div>

            {/* Live Speedometer & Pickup OTP */}
            <div className="text-right flex flex-col items-end gap-1.5">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#F5FAFF] border border-[#E3ECF5] text-xs font-bold font-mono text-[#0F1B2D]">
                <Gauge className="w-3.5 h-3.5 text-[#2B8CEB]" />
                <span>{currentSpeed} km/h</span>
              </div>

              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#E8F3FF] border border-[#2B8CEB]/30 font-mono text-xs font-bold text-[#2B8CEB] tracking-wider">
                <KeyRound className="w-3 h-3" />
                <span>OTP 4821</span>
              </div>
            </div>
          </div>

          {/* Share Live Trip Link & Quick Actions */}
          <div className="flex items-center justify-between p-3 bg-white border border-[#E3ECF5] rounded-2xl shadow-xs">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#2B8CEB]" />
              <div>
                <span className="text-xs font-bold text-[#0F1B2D] block">Live Tracking Link</span>
                <span className="text-[10px] text-[#5B6B80]">Encrypted token (sos_events.share_token)</span>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleShareTrip}
              className="text-xs font-bold flex items-center gap-1 py-1"
            >
              <Copy className="w-3.5 h-3.5 text-[#2B8CEB]" />
              <span>Copy Link</span>
            </Button>
          </div>

          {/* Driver and Vehicle Info */}
          <div className="p-4 bg-white border border-[#E3ECF5] rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar
                  name={carpool.host_name}
                  image={carpool.host_photo}
                  size="lg"
                  isWomenOnly={carpool.visibility === 'women_only'}
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-[#0F1B2D]">{carpool.host_name}</span>
                    <Badge variant="success">Verified</Badge>
                  </div>
                  <p className="text-xs text-[#5B6B80]">
                    {carpool.host_employee_id} • Corporate Colleague
                  </p>
                </div>
              </div>

              <div className="w-10 h-10 rounded-2xl bg-[#E8F3FF] text-[#2B8CEB] flex items-center justify-center">
                <Car className="w-5 h-5 stroke-[2]" />
              </div>
            </div>

            <div className="pt-2 border-t border-[#E3ECF5] flex items-center justify-between text-xs">
              <span className="text-[#5B6B80]">
                Vehicle: <strong className="text-[#0F1B2D]">{carpool.vehicle?.model || 'White Honda City'}</strong>
              </span>
              <span className="font-mono font-bold text-[#2B8CEB] bg-[#F5FAFF] px-2 py-0.5 rounded border border-[#E3ECF5]">
                {carpool.vehicle?.reg_no || 'TS 09 EZ 4082'}
              </span>
            </div>
          </div>

          {/* Live Trip Events Breadcrumbs (PostgreSQL trip_events) */}
          <div className="p-3 bg-[#F5FAFF] border border-[#E3ECF5] rounded-2xl space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#5B6B80] uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5 text-[#2B8CEB]" />
              <span>Trip Events Audit (trip_events)</span>
            </div>
            <div className="space-y-1 pl-1">
              {tripEventsLog.slice(-3).map((event, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-[#0F1B2D]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2B8CEB]" />
                  <span>{event}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* Screen 6: Persistent 56px Round Red SOS Button Docked at Bottom-Right */}
      <SOSButton
        rideId={carpool.id}
        driverName={carpool.host_name}
        vehicleInfo={`${carpool.vehicle?.model} (${carpool.vehicle?.reg_no || 'TS 09 EZ 4082'})`}
      />

      {/* Post-trip Peer Rating Modal */}
      <RatingModal
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        onSubmit={handleRatingSubmit}
        rideId={carpool.id}
        rateeName={isHost ? (carpool.members[0]?.passenger_name || 'Priya Patel') : carpool.host_name}
        rateeRole={isHost ? 'passenger' : 'host'}
        rateePhoto={isHost ? carpool.members[0]?.passenger_photo : carpool.host_photo}
      />

      <Toast
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
        message={toastMessage}
        type="success"
      />
    </div>
  );
};
