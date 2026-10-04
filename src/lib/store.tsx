import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserProfile, 
  Vehicle, 
  Commute, 
  Carpool, 
  CarpoolMember, 
  JoinRequest, 
  AppNotification, 
  SOSEvent, 
  CarpoolStatus,
  RouteStop,
  Rating,
  CompanyInfo,
  AuditEntry,
  DbLocation,
  AdminCreateRideParams
} from '../types';
import { 
  SEED_USERS, 
  SEED_VEHICLES, 
  SEED_COMMUTES, 
  SEED_CARPOOLS, 
  SEED_JOIN_REQUESTS, 
  SEED_NOTIFICATIONS, 
  SEED_SOS_EVENTS,
  SEED_COMPANIES,
  SEED_RATINGS,
  SEED_AUDIT_LOG,
  SEED_LOCATIONS
} from '../data/seedData';
import { HYDERABAD_ROUTES } from '../data/fallbackRoutes';

interface StoreContextType {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  companies: CompanyInfo[];
  currentCompany: CompanyInfo;
  vehicles: Vehicle[];
  commutes: Commute[];
  carpools: Carpool[];
  joinRequests: JoinRequest[];
  notifications: AppNotification[];
  sosEvents: SOSEvent[];
  ratings: Rating[];
  auditLog: AuditEntry[];
  locations: DbLocation[];
  activeCarpoolId: string | null;
  
  // Actions
  switchUser: (userId: string) => void;
  switchCompany: (companyId: string) => void;
  toggleRole: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'owner_id'>) => Vehicle;
  createCommute: (commute: Omit<Commute, 'id' | 'created_at' | 'status'>) => Commute;
  createCarpool: (carpool: Omit<Carpool, 'id' | 'created_at' | 'status' | 'members' | 'stops'>) => Carpool;
  adminCreateRide: (params: AdminCreateRideParams) => Carpool;
  adminAssignPassenger: (carpoolId: string, riderId: string) => boolean;
  adminCancelRide: (carpoolId: string, reason?: string) => boolean;
  requestJoinCarpool: (
    carpoolId: string,
    pickupLabel: string,
    pickupLat: number,
    pickupLng: number,
    matchScore: number,
    reasons: string[]
  ) => JoinRequest;
  acceptJoinRequest: (requestId: string) => boolean;
  rejectJoinRequest: (requestId: string) => void;
  verifyPickup: (carpoolId: string, memberId: string, enteredCode: string) => boolean;
  updateCarpoolStatus: (carpoolId: string, status: CarpoolStatus) => void;
  updateCarpoolProgress: (carpoolId: string, lat: number, lng: number, progressPct: number) => void;
  triggerSOS: (carpoolId: string, notes?: string) => SOSEvent;
  submitRating: (ratingData: Omit<Rating, 'id' | 'created_at'>) => Rating;
  logAuditEvent: (entry: Omit<AuditEntry, 'id' | 'created_at'>) => void;
  testWomenOnlyTrigger: (rideId: string, riderId: string) => { success: boolean; error?: string };
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  resetDatabase: () => void;
  setActiveCarpoolId: (id: string | null) => void;
}

const STORAGE_KEY_PREFIX = 'ridesync_v1_';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving ${key} to storage`, err);
  }
}

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => 
    loadFromStorage('users', SEED_USERS)
  );
  const [currentUserId, setCurrentUserId] = useState<string>(() => 
    loadFromStorage('currentUserId', 'user-ananya')
  );
  const [companies, setCompanies] = useState<CompanyInfo[]>(() =>
    loadFromStorage('companies', SEED_COMPANIES)
  );
  const [currentCompanyId, setCurrentCompanyId] = useState<string>(() =>
    loadFromStorage('currentCompanyId', 'c0000000-0000-0000-0000-000000000001')
  );
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => 
    loadFromStorage('vehicles', SEED_VEHICLES)
  );
  const [commutes, setCommutes] = useState<Commute[]>(() => 
    loadFromStorage('commutes', SEED_COMMUTES)
  );
  const [carpools, setCarpools] = useState<Carpool[]>(() => 
    loadFromStorage('carpools', SEED_CARPOOLS)
  );
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>(() => 
    loadFromStorage('joinRequests', SEED_JOIN_REQUESTS)
  );
  const [notifications, setNotifications] = useState<AppNotification[]>(() => 
    loadFromStorage('notifications', SEED_NOTIFICATIONS)
  );
  const [sosEvents, setSosEvents] = useState<SOSEvent[]>(() => 
    loadFromStorage('sosEvents', SEED_SOS_EVENTS)
  );
  const [ratings, setRatings] = useState<Rating[]>(() =>
    loadFromStorage('ratings', SEED_RATINGS)
  );
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(() =>
    loadFromStorage('auditLog', SEED_AUDIT_LOG)
  );
  const [locations, setLocations] = useState<DbLocation[]>(() =>
    loadFromStorage('locations', SEED_LOCATIONS)
  );
  const [activeCarpoolId, setActiveCarpoolId] = useState<string | null>(() => 
    loadFromStorage('activeCarpoolId', 'carpool-ananya-01')
  );

  // Sync to localStorage
  useEffect(() => saveToStorage('users', allUsers), [allUsers]);
  useEffect(() => saveToStorage('currentUserId', currentUserId), [currentUserId]);
  useEffect(() => saveToStorage('companies', companies), [companies]);
  useEffect(() => saveToStorage('currentCompanyId', currentCompanyId), [currentCompanyId]);
  useEffect(() => saveToStorage('vehicles', vehicles), [vehicles]);
  useEffect(() => saveToStorage('commutes', commutes), [commutes]);
  useEffect(() => saveToStorage('carpools', carpools), [carpools]);
  useEffect(() => saveToStorage('joinRequests', joinRequests), [joinRequests]);
  useEffect(() => saveToStorage('notifications', notifications), [notifications]);
  useEffect(() => saveToStorage('sosEvents', sosEvents), [sosEvents]);
  useEffect(() => saveToStorage('ratings', ratings), [ratings]);
  useEffect(() => saveToStorage('auditLog', auditLog), [auditLog]);
  useEffect(() => saveToStorage('locations', locations), [locations]);
  useEffect(() => saveToStorage('activeCarpoolId', activeCarpoolId), [activeCarpoolId]);

  const currentUser = allUsers.find(u => u.id === currentUserId) || allUsers[0];
  const currentCompany = companies.find(c => c.id === currentCompanyId) || companies[0];

  const switchCompany = (companyId: string) => {
    const comp = companies.find(c => c.id === companyId);
    if (comp) {
      setCurrentCompanyId(companyId);
      logAuditEvent({
        actor_id: currentUser.id,
        actor_name: currentUser.full_name,
        action: 'SWITCH_COMPANY',
        entity: 'companies',
        entity_id: companyId,
        details: `Active tenant switched to ${comp.name} (fuel: ₹${comp.cost_per_km}/km, CO2: ${comp.co2_kg_per_km} kg/km)`,
      });
    }
  };

  const logAuditEvent = (entry: Omit<AuditEntry, 'id' | 'created_at'>) => {
    const newEntry: AuditEntry = {
      ...entry,
      id: Date.now(),
      created_at: new Date().toISOString(),
    };
    setAuditLog(prev => [newEntry, ...prev]);
  };


  const switchUser = (userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
      setCurrentUserId(userId);
    }
  };

  const toggleRole = () => {
    setAllUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          current_role: u.current_role === 'host' ? 'passenger' : 'host',
        };
      }
      return u;
    }));
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setAllUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return { ...u, ...updates };
      }
      return u;
    }));
  };

  const addVehicle = (vehicleData: Omit<Vehicle, 'id' | 'owner_id'>): Vehicle => {
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: `veh-${Date.now()}`,
      owner_id: currentUser.id,
    };
    setVehicles(prev => [newVehicle, ...prev]);
    return newVehicle;
  };

  const createCommute = (commuteData: Omit<Commute, 'id' | 'created_at' | 'status'>): Commute => {
    const newCommute: Commute = {
      ...commuteData,
      id: `commute-${Date.now()}`,
      status: 'active',
      created_at: new Date().toISOString(),
    };
    setCommutes(prev => [newCommute, ...prev]);
    return newCommute;
  };

  const createCarpool = (
    carpoolData: Omit<Carpool, 'id' | 'created_at' | 'status' | 'members' | 'stops'>
  ): Carpool => {
    const userVehicle = vehicles.find(v => v.id === carpoolData.vehicle_id) || vehicles[0];
    
    // Initial stops: Origin and Destination
    const initialStops: RouteStop[] = [
      {
        id: `stop-orig-${Date.now()}`,
        seq: 1,
        label: `${carpoolData.origin_label} (Start)`,
        lat: carpoolData.origin_lat,
        lng: carpoolData.origin_lng,
        kind: 'origin',
        eta_min: 0,
        completed: false,
      },
      {
        id: `stop-dest-${Date.now()}`,
        seq: 2,
        label: `${carpoolData.dest_label} (Campus Destination)`,
        lat: carpoolData.dest_lat,
        lng: carpoolData.dest_lng,
        kind: 'destination',
        eta_min: carpoolData.duration_min,
        completed: false,
      }
    ];

    const newCarpool: Carpool = {
      ...carpoolData,
      id: `carpool-${Date.now()}`,
      status: 'scheduled',
      vehicle: userVehicle,
      stops: initialStops,
      members: [],
      current_lat: carpoolData.origin_lat,
      current_lng: carpoolData.origin_lng,
      current_index: 0,
      created_at: new Date().toISOString(),
    };

    setCarpools(prev => [newCarpool, ...prev]);
    setActiveCarpoolId(newCarpool.id);

    // Notify user
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      user_id: currentUser.id,
      type: 'general',
      title: 'Commute Route Hosted!',
      body: `Your ride from ${carpoolData.origin_label} to ${carpoolData.dest_label} is live (${carpoolData.visibility.replace('_', ' ')}).`,
      read: false,
      created_at: new Date().toISOString(),
      carpool_id: newCarpool.id,
      action_url: `/carpool/${newCarpool.id}`
    };
    setNotifications(prev => [notif, ...prev]);

    return newCarpool;
  };

  const adminCreateRide = (params: AdminCreateRideParams): Carpool => {
    const host = allUsers.find(u => u.id === params.hostId) || allUsers[0];
    const vehicle = vehicles.find(v => v.id === params.vehicleId) || vehicles.find(v => v.owner_id === host.id) || vehicles[0];

    // Check if women_only policy applies to host
    if (params.visibility === 'women_only' && host.gender !== 'female') {
      throw new Error(`Corporate Safety Policy Violation: Cannot assign non-female driver ${host.full_name} to a Women-Only ride`);
    }

    // Attempt to match route polyline with predefined corridors, or fallback to smooth waypoints
    const matchedRoute = HYDERABAD_ROUTES.find(r => 
      (r.origin.label.toLowerCase().includes(params.originLabel.toLowerCase()) || 
       params.originLabel.toLowerCase().includes(r.origin.label.toLowerCase())) &&
      (r.dest.label.toLowerCase().includes(params.destLabel.toLowerCase()) ||
       params.destLabel.toLowerCase().includes(r.dest.label.toLowerCase()))
    );

    const polyline: [number, number][] = matchedRoute 
      ? matchedRoute.polyline 
      : [
          [params.originLat, params.originLng],
          [(params.originLat * 2 + params.destLat) / 3, (params.originLng * 2 + params.destLng) / 3],
          [(params.originLat + params.destLat * 2) / 3, (params.originLng + params.destLng * 2) / 3],
          [params.destLat, params.destLng]
        ];

    const distanceKm = matchedRoute?.distance_km || Math.round(
      Math.hypot(params.destLat - params.originLat, params.destLng - params.originLng) * 111 * 1.3 * 10
    ) / 10;
    const durationMin = matchedRoute?.duration_min || Math.round(distanceKm * 2.8);

    const newCarpoolId = `carpool-admin-${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Process pre-assigned riders
    const preAssignedRiders = (params.preAssignedRiderIds || [])
      .map(id => allUsers.find(u => u.id === id))
      .filter((u): u is UserProfile => Boolean(u));

    // Check women-only policy for riders
    if (params.visibility === 'women_only') {
      const nonFemale = preAssignedRiders.find(r => r.gender !== 'female');
      if (nonFemale) {
        throw new Error(`Corporate Safety Policy Violation: Cannot assign non-female rider ${nonFemale.full_name} to a Women-Only ride`);
      }
    }

    const members: CarpoolMember[] = preAssignedRiders.map((rider, idx) => {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      return {
        id: `member-${Date.now()}-${idx}`,
        carpool_id: newCarpoolId,
        passenger_id: rider.id,
        passenger_name: rider.full_name,
        passenger_gender: rider.gender,
        passenger_email: rider.email,
        passenger_photo: rider.photo_url,
        pickup_label: rider.home_area || params.originLabel,
        pickup_lat: rider.home_lat || params.originLat,
        pickup_lng: rider.home_lng || params.originLng,
        pickup_seq: idx + 1,
        pickup_code: code,
        status: 'confirmed',
      };
    });

    const stops: RouteStop[] = [
      {
        id: `stop-orig-${Date.now()}`,
        seq: 1,
        label: `${params.originLabel} (Origin Hub)`,
        lat: params.originLat,
        lng: params.originLng,
        kind: 'origin',
        eta_min: 0,
        completed: false,
      },
      ...members.map((m, idx) => ({
        id: `stop-pickup-${Date.now()}-${idx}`,
        seq: idx + 2,
        label: `${m.pickup_label} (${m.passenger_name})`,
        lat: m.pickup_lat,
        lng: m.pickup_lng,
        kind: 'pickup' as const,
        passenger_id: m.passenger_id,
        passenger_name: m.passenger_name,
        eta_min: Math.round(durationMin * 0.3 * (idx + 1)),
        completed: false,
        pickup_code: m.pickup_code,
      })),
      {
        id: `stop-dest-${Date.now()}`,
        seq: members.length + 2,
        label: `${params.destLabel} (Campus Destination)`,
        lat: params.destLat,
        lng: params.destLng,
        kind: 'destination',
        eta_min: durationMin,
        completed: false,
      }
    ];

    const seatsAvailable = Math.max(0, params.seatsTotal - members.length);

    const newCarpool: Carpool = {
      id: newCarpoolId,
      host_id: host.id,
      host_name: host.full_name,
      host_gender: host.gender,
      host_photo: host.photo_url,
      host_employee_id: host.employee_id,
      commute_id: `commute-admin-${Date.now()}`,
      vehicle_id: vehicle.id,
      vehicle,
      visibility: params.visibility,
      invite_code: params.inviteCode,
      recurrence_rule: params.recurrenceRule,
      seats_total: params.seatsTotal,
      seats_available: seatsAvailable,
      status: 'scheduled',
      start_time: params.startTime,
      origin_label: params.originLabel,
      origin_lat: params.originLat,
      origin_lng: params.originLng,
      dest_label: params.destLabel,
      dest_lat: params.destLat,
      dest_lng: params.destLng,
      polyline,
      distance_km: distanceKm,
      duration_min: durationMin,
      stops,
      members,
      current_lat: params.originLat,
      current_lng: params.originLng,
      current_index: 0,
      created_at: timestamp,
    };

    setCarpools(prev => [newCarpool, ...prev]);

    // Send notification to Host
    const hostNotif: AppNotification = {
      id: `notif-host-${Date.now()}`,
      user_id: host.id,
      type: 'general',
      title: 'Corporate Dispatch: Ride Assigned by Admin',
      body: `Admin scheduled a ${params.dispatchCategory || 'Corporate Commute'} for you with ${members.length} assigned rider(s) from ${params.originLabel} to ${params.destLabel} departing at ${params.startTime}.`,
      read: false,
      created_at: timestamp,
      carpool_id: newCarpoolId,
      action_url: `/carpool/${newCarpoolId}`
    };

    // Send notifications to pre-assigned Passengers
    const passengerNotifs: AppNotification[] = members.map(m => ({
      id: `notif-pax-${Date.now()}-${m.passenger_id}`,
      user_id: m.passenger_id,
      type: 'request_accepted',
      title: 'Corporate Commute Scheduled by Admin',
      body: `Admin booked your seat on ${host.full_name}'s carpool (${params.originLabel} → ${params.destLabel}) departing at ${params.startTime}. Pickup verification code: ${m.pickup_code}.`,
      read: false,
      created_at: timestamp,
      carpool_id: newCarpoolId,
      action_url: `/live/${newCarpoolId}`
    }));

    setNotifications(prev => [hostNotif, ...passengerNotifs, ...prev]);

    // Enterprise Database Audit Log
    logAuditEvent({
      actor_id: currentUser.id,
      actor_name: currentUser.full_name,
      action: 'ADMIN_DISPATCH_RIDE',
      entity: 'rides',
      entity_id: newCarpoolId,
      details: `Admin dispatched ride for Host: ${host.full_name} (${host.employee_id}) with vehicle ${vehicle.make} ${vehicle.model}. ${members.length} passengers pre-assigned (${members.map(m => m.passenger_name).join(', ') || 'Open booking'}). Category: ${params.dispatchCategory || 'General Commute'}.`,
    });

    return newCarpool;
  };

  const adminAssignPassenger = (carpoolId: string, riderId: string): boolean => {
    const carpool = carpools.find(c => c.id === carpoolId);
    if (!carpool || carpool.seats_available <= 0) return false;

    const rider = allUsers.find(u => u.id === riderId);
    if (!rider) return false;

    if (carpool.members.some(m => m.passenger_id === riderId)) return false;

    if (carpool.visibility === 'women_only' && rider.gender !== 'female') {
      throw new Error(`Corporate Safety Policy Violation: Cannot assign male rider ${rider.full_name} to a Women-Only ride`);
    }

    const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();
    const newMember: CarpoolMember = {
      id: `member-${Date.now()}`,
      carpool_id: carpool.id,
      passenger_id: rider.id,
      passenger_name: rider.full_name,
      passenger_gender: rider.gender,
      passenger_email: rider.email,
      passenger_photo: rider.photo_url,
      pickup_label: rider.home_area || carpool.origin_label,
      pickup_lat: rider.home_lat || carpool.origin_lat,
      pickup_lng: rider.home_lng || carpool.origin_lng,
      pickup_seq: carpool.stops.length,
      pickup_code: pickupCode,
      status: 'confirmed',
    };

    const existingStops = [...carpool.stops];
    const destStop = existingStops[existingStops.length - 1];
    const prevStops = existingStops.slice(0, existingStops.length - 1);

    const newStop: RouteStop = {
      id: `stop-${Date.now()}`,
      seq: prevStops.length + 1,
      label: `${rider.home_area || 'Pickup Point'} (${rider.full_name})`,
      lat: rider.home_lat || carpool.origin_lat,
      lng: rider.home_lng || carpool.origin_lng,
      kind: 'pickup',
      passenger_id: rider.id,
      passenger_name: rider.full_name,
      eta_min: Math.round(carpool.duration_min * 0.45),
      completed: false,
      pickup_code: pickupCode,
    };

    const reorderedStops = [...prevStops, newStop, { ...destStop, seq: prevStops.length + 2 }];

    setCarpools(prev => prev.map(c => {
      if (c.id === carpool.id) {
        return {
          ...c,
          seats_available: c.seats_available - 1,
          members: [...c.members, newMember],
          stops: reorderedStops,
        };
      }
      return c;
    }));

    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      user_id: rider.id,
      type: 'request_accepted',
      title: 'Admin Assigned You to a Carpool',
      body: `You have been added to ${carpool.host_name}'s carpool (${carpool.origin_label} → ${carpool.dest_label}). Verification code: ${pickupCode}.`,
      read: false,
      created_at: new Date().toISOString(),
      carpool_id: carpool.id,
      action_url: `/live/${carpool.id}`
    };

    const hostNotif: AppNotification = {
      id: `notif-host-${Date.now()}`,
      user_id: carpool.host_id,
      type: 'general',
      title: 'Passenger Added by Admin',
      body: `Admin assigned employee ${rider.full_name} to your ride departing from ${carpool.origin_label}.`,
      read: false,
      created_at: new Date().toISOString(),
      carpool_id: carpool.id,
      action_url: `/carpool/${carpool.id}`
    };

    setNotifications(prev => [notif, hostNotif, ...prev]);

    logAuditEvent({
      actor_id: currentUser.id,
      actor_name: currentUser.full_name,
      action: 'ADMIN_ASSIGN_RIDER',
      entity: 'bookings',
      entity_id: carpool.id,
      details: `Admin assigned rider ${rider.full_name} (${rider.employee_id}) to ride hosted by ${carpool.host_name}. Pickup code: ${pickupCode}.`,
    });

    return true;
  };

  const adminCancelRide = (carpoolId: string, reason?: string): boolean => {
    const carpool = carpools.find(c => c.id === carpoolId);
    if (!carpool) return false;

    setCarpools(prev => prev.map(c => c.id === carpoolId ? { ...c, status: 'cancelled' } : c));

    const hostNotif: AppNotification = {
      id: `notif-cancel-host-${Date.now()}`,
      user_id: carpool.host_id,
      type: 'general',
      title: 'Ride Cancelled by Admin',
      body: `Your scheduled ride from ${carpool.origin_label} to ${carpool.dest_label} was cancelled by Admin. Reason: ${reason || 'Operational adjustment'}.`,
      read: false,
      created_at: new Date().toISOString(),
      carpool_id: carpoolId,
    };

    const memberNotifs: AppNotification[] = carpool.members.map(m => ({
      id: `notif-cancel-m-${Date.now()}-${m.passenger_id}`,
      user_id: m.passenger_id,
      type: 'general',
      title: 'Ride Cancelled by Admin',
      body: `The carpool with ${carpool.host_name} scheduled for ${carpool.start_time} has been cancelled by Admin. Reason: ${reason || 'Operational adjustment'}.`,
      read: false,
      created_at: new Date().toISOString(),
      carpool_id: carpoolId,
    }));

    setNotifications(prev => [hostNotif, ...memberNotifs, ...prev]);

    logAuditEvent({
      actor_id: currentUser.id,
      actor_name: currentUser.full_name,
      action: 'ADMIN_CANCEL_RIDE',
      entity: 'rides',
      entity_id: carpoolId,
      details: `Admin cancelled ride ${carpoolId} hosted by ${carpool.host_name}. Reason: ${reason || 'Operational adjustment'}.`,
    });

    return true;
  };

  const requestJoinCarpool = (
    carpoolId: string,
    pickupLabel: string,
    pickupLat: number,
    pickupLng: number,
    matchScore: number,
    reasons: string[]
  ): JoinRequest => {
    const carpool = carpools.find(c => c.id === carpoolId);
    const newRequest: JoinRequest = {
      id: `req-${Date.now()}`,
      carpool_id: carpoolId,
      passenger_id: currentUser.id,
      passenger_name: currentUser.full_name,
      passenger_gender: currentUser.gender,
      passenger_photo: currentUser.photo_url,
      passenger_employee_id: currentUser.employee_id,
      passenger_commute_id: `commute-req-${Date.now()}`,
      pickup_label: pickupLabel,
      pickup_lat: pickupLat,
      pickup_lng: pickupLng,
      match_score: matchScore,
      reasons: reasons,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    setJoinRequests(prev => [newRequest, ...prev]);

    // Send in-app notification to host
    if (carpool) {
      const hostNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        user_id: carpool.host_id,
        type: 'request_received',
        title: `Join Request: ${currentUser.full_name}`,
        body: `${currentUser.full_name} (${matchScore}% match) requested to join your ${carpool.start_time} ride.`,
        read: false,
        created_at: new Date().toISOString(),
        carpool_id: carpoolId,
        action_url: '/requests'
      };
      setNotifications(prev => [hostNotif, ...prev]);
    }

    return newRequest;
  };

  const acceptJoinRequest = (requestId: string): boolean => {
    const req = joinRequests.find(r => r.id === requestId);
    if (!req) return false;

    const carpool = carpools.find(c => c.id === req.carpool_id);
    if (!carpool || carpool.seats_available <= 0) return false;

    // Generate 4-digit pickup code
    const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Create new member
    const newMember: CarpoolMember = {
      id: `member-${Date.now()}`,
      carpool_id: carpool.id,
      passenger_id: req.passenger_id,
      passenger_name: req.passenger_name,
      passenger_gender: req.passenger_gender,
      passenger_email: `${req.passenger_name.toLowerCase().replace(/\s+/g, '.')}@techcorp.io`,
      passenger_photo: req.passenger_photo,
      pickup_label: req.pickup_label,
      pickup_lat: req.pickup_lat,
      pickup_lng: req.pickup_lng,
      pickup_seq: carpool.stops.length, // inserted before destination
      pickup_code: pickupCode,
      status: 'confirmed',
    };

    // Insert new pickup stop right before destination
    const existingStops = [...carpool.stops];
    const destStop = existingStops[existingStops.length - 1];
    const prevStops = existingStops.slice(0, existingStops.length - 1);

    const newStop: RouteStop = {
      id: `stop-${Date.now()}`,
      seq: prevStops.length + 1,
      label: req.pickup_label,
      lat: req.pickup_lat,
      lng: req.pickup_lng,
      kind: 'pickup',
      passenger_id: req.passenger_id,
      passenger_name: req.passenger_name,
      eta_min: Math.round(carpool.duration_min * 0.45),
      completed: false,
      pickup_code: pickupCode,
    };

    const reorderedStops = [...prevStops, newStop, { ...destStop, seq: prevStops.length + 2 }];

    // Update carpool seats and members
    setCarpools(prev => prev.map(c => {
      if (c.id === carpool.id) {
        return {
          ...c,
          seats_available: c.seats_available - 1,
          members: [...c.members, newMember],
          stops: reorderedStops,
        };
      }
      return c;
    }));

    // Update request status
    setJoinRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'accepted' } : r));

    // Notify passenger
    const passengerNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      user_id: req.passenger_id,
      type: 'request_accepted',
      title: 'Carpool Request Confirmed!',
      body: `Your pickup is scheduled at ${req.pickup_label}. Your secret pickup verification code is ${pickupCode}.`,
      read: false,
      created_at: new Date().toISOString(),
      carpool_id: carpool.id,
      action_url: `/live/${carpool.id}`
    };
    setNotifications(prev => [passengerNotif, ...prev]);

    return true;
  };

  const rejectJoinRequest = (requestId: string) => {
    const req = joinRequests.find(r => r.id === requestId);
    if (!req) return;

    setJoinRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'rejected' } : r));

    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      user_id: req.passenger_id,
      type: 'request_declined',
      title: 'Ride Request Update',
      body: 'Your ride request could not be accommodated at this time.',
      read: false,
      created_at: new Date().toISOString(),
      action_url: '/matches'
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const verifyPickup = (carpoolId: string, memberId: string, enteredCode: string): boolean => {
    const carpool = carpools.find(c => c.id === carpoolId);
    if (!carpool) return false;

    const member = carpool.members.find(m => m.id === memberId || m.passenger_id === memberId);
    if (!member) return false;

    if (member.pickup_code !== enteredCode.trim()) {
      return false; // Code mismatch
    }

    const now = new Date().toISOString();

    setCarpools(prev => prev.map(c => {
      if (c.id === carpoolId) {
        const updatedMembers = c.members.map(m => 
          m.id === member.id ? { ...m, status: 'picked_up' as const, verified_at: now } : m
        );
        const updatedStops = c.stops.map(s => 
          s.passenger_id === member.passenger_id ? { ...s, completed: true } : s
        );
        return {
          ...c,
          status: 'in_progress',
          members: updatedMembers,
          stops: updatedStops,
        };
      }
      return c;
    }));

    // Notify passenger of verified pickup
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      user_id: member.passenger_id,
      type: 'passenger_verified',
      title: 'Boarding Verified!',
      body: 'Pickup code confirmed by host. Trip is in transit.',
      read: false,
      created_at: now,
      carpool_id: carpoolId,
    };
    setNotifications(prev => [notif, ...prev]);

    return true;
  };

  const updateCarpoolStatus = (carpoolId: string, status: CarpoolStatus) => {
    setCarpools(prev => prev.map(c => {
      if (c.id === carpoolId) {
        return { ...c, status };
      }
      return c;
    }));

    const carpool = carpools.find(c => c.id === carpoolId);
    if (carpool) {
      // Send notifications to members
      for (const m of carpool.members) {
        const notif: AppNotification = {
          id: `notif-${Date.now()}-${m.id}`,
          user_id: m.passenger_id,
          type: status === 'driver_arriving' ? 'driver_en_route' : 
                status === 'completed' ? 'ride_completed' : 'general',
          title: `Trip Status: ${status.replace('_', ' ').toUpperCase()}`,
          body: status === 'driver_arriving' 
            ? `${carpool.host_name} is arriving at your pickup location.` 
            : status === 'completed'
            ? 'Trip completed! Thanks for reducing carbon emissions today.'
            : `Ride status updated to ${status.replace('_', ' ')}.`,
          read: false,
          created_at: new Date().toISOString(),
          carpool_id: carpoolId,
          action_url: `/live/${carpoolId}`
        };
        setNotifications(prev => [notif, ...prev]);
      }
    }
  };

  const updateCarpoolProgress = (carpoolId: string, lat: number, lng: number, progressPct: number) => {
    setCarpools(prev => prev.map(c => {
      if (c.id === carpoolId) {
        return {
          ...c,
          current_lat: lat,
          current_lng: lng,
        };
      }
      return c;
    }));
  };

  const triggerSOS = (carpoolId: string, notes?: string): SOSEvent => {
    const carpool = carpools.find(c => c.id === carpoolId);
    const vehicle = carpool?.vehicle || vehicles[0];
    const isHost = carpool?.host_id === currentUser.id;

    const newSos: SOSEvent = {
      id: `sos-${Date.now()}`,
      carpool_id: carpoolId,
      triggered_by_user_id: currentUser.id,
      triggered_by_name: currentUser.full_name,
      triggered_by_role: isHost ? 'host' : 'passenger',
      lat: carpool?.current_lat || carpool?.origin_lat || 17.4435,
      lng: carpool?.current_lng || carpool?.origin_lng || 78.3772,
      timestamp: new Date().toISOString(),
      status: 'active',
      driver_name: carpool?.host_name || 'Driver',
      driver_mobile: '+91 98765 43210',
      vehicle_reg: vehicle.reg_no,
      vehicle_model: `${vehicle.make} ${vehicle.model}`,
      passengers: carpool?.members.map(m => ({ name: m.passenger_name, mobile: '+91 98222 33445' })) || [],
      current_location_desc: `Near ${carpool?.dest_label || 'HITEC City Flyover'}`,
      simulated_sms_sent_to: [
        ...currentUser.emergency_contacts.map(c => `${c.phone} (${c.name} - ${c.relation})`),
        '+91 40 6677 8899 (TechCorp Security & Safety Desk)',
      ],
      notes: notes || 'Emergency SOS button triggered from active live ride.',
    };

    setSosEvents(prev => [newSos, ...prev]);

    // Send broadcast notification to all admins
    const adminNotif: AppNotification = {
      id: `notif-sos-${Date.now()}`,
      user_id: 'user-admin',
      type: 'sos_alert',
      title: `🚨 EMERGENCY ALERT: ${currentUser.full_name}`,
      body: `SOS triggered in Carpool ${carpoolId}. Vehicle: ${vehicle.reg_no}. Live coordinates dispatched to security team.`,
      read: false,
      created_at: new Date().toISOString(),
      carpool_id: carpoolId,
      action_url: '/admin'
    };
    setNotifications(prev => [adminNotif, ...prev]);

    return newSos;
  };

  const submitRating = (ratingData: Omit<Rating, 'id' | 'created_at'>): Rating => {
    const newRating: Rating = {
      ...ratingData,
      id: `rating-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setRatings(prev => [newRating, ...prev]);

    // Recalculate trust score for ratee
    setAllUsers(prev => prev.map(u => {
      if (u.id === ratingData.ratee_id) {
        const newScore = Math.min(5.0, Math.max(1.0, (u.trust_score * 4 + ratingData.score) / 5));
        return { ...u, trust_score: Math.round(newScore * 100) / 100 };
      }
      return u;
    }));

    logAuditEvent({
      actor_id: ratingData.rater_id,
      actor_name: ratingData.rater_name,
      action: 'SUBMIT_RATING',
      entity: 'ratings',
      entity_id: newRating.id,
      details: `Submitted ${ratingData.score}-star rating for ${ratingData.ratee_name}`,
    });

    return newRating;
  };

  const testWomenOnlyTrigger = (rideId: string, riderId: string): { success: boolean; error?: string } => {
    const ride = carpools.find(c => c.id === rideId);
    const rider = allUsers.find(u => u.id === riderId);
    if (!ride || !rider) {
      return { success: false, error: 'Ride or Rider record not found' };
    }

    if (ride.visibility === 'women_only' && rider.gender !== 'female') {
      const err = 'ERROR: Women-only ride (trg_women_only_req failed on table ride_requests)';
      logAuditEvent({
        actor_id: rider.id,
        actor_name: rider.full_name,
        action: 'TRIGGER_VIOLATION_BLOCKED',
        entity: 'ride_requests',
        entity_id: rideId,
        details: `PostgreSQL trigger trg_women_only_req blocked non-female user ${rider.full_name} (${rider.gender}) from joining Women-Only ride ${rideId}`,
      });
      return { success: false, error: err };
    }

    logAuditEvent({
      actor_id: rider.id,
      actor_name: rider.full_name,
      action: 'TRIGGER_PASSED',
      entity: 'ride_requests',
      entity_id: rideId,
      details: `PostgreSQL trigger check passed for verified female user ${rider.full_name}`,
    });

    return { success: true };
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => n.user_id === currentUser.id ? { ...n, read: true } : n));
  };

  const resetDatabase = () => {
    localStorage.clear();
    setAllUsers(SEED_USERS);
    setCurrentUserId('user-ananya');
    setCompanies(SEED_COMPANIES);
    setCurrentCompanyId('c0000000-0000-0000-0000-000000000001');
    setVehicles(SEED_VEHICLES);
    setCommutes(SEED_COMMUTES);
    setCarpools(SEED_CARPOOLS);
    setJoinRequests(SEED_JOIN_REQUESTS);
    setNotifications(SEED_NOTIFICATIONS);
    setSosEvents(SEED_SOS_EVENTS);
    setRatings(SEED_RATINGS);
    setAuditLog(SEED_AUDIT_LOG);
    setLocations(SEED_LOCATIONS);
    setActiveCarpoolId('carpool-ananya-01');
  };

  return (
    <StoreContext.Provider
      value={{
        currentUser,
        allUsers,
        companies,
        currentCompany,
        vehicles,
        commutes,
        carpools,
        joinRequests,
        notifications,
        sosEvents,
        ratings,
        auditLog,
        locations,
        activeCarpoolId,
        switchUser,
        switchCompany,
        toggleRole,
        updateProfile,
        addVehicle,
        createCommute,
        createCarpool,
        adminCreateRide,
        adminAssignPassenger,
        adminCancelRide,
        requestJoinCarpool,
        acceptJoinRequest,
        rejectJoinRequest,
        verifyPickup,
        updateCarpoolStatus,
        updateCarpoolProgress,
        triggerSOS,
        submitRating,
        logAuditEvent,
        testWomenOnlyTrigger,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        resetDatabase,
        setActiveCarpoolId,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
