export * from './db';

export type Gender = 'male' | 'female' | 'other';
export type UserRole = 'host' | 'passenger';
export type RideVisibility = 'public' | 'private' | 'women_only';

export type CarpoolStatus = 
  | 'scheduled'
  | 'driver_arriving'
  | 'at_pickup'
  | 'picked_up'
  | 'in_progress'
  | 'arrived'
  | 'completed'
  | 'cancelled';

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  employee_id: string;
  company_id?: string;
  email: string;
  mobile: string;
  gender: Gender; // Used strictly for women-only eligibility logic; never exposed in public rider cards
  photo_url: string;
  home_area: string;
  home_lat: number;
  home_lng: number;
  work_area: string;
  work_lat: number;
  work_lng: number;
  pref_depart_time: string;
  pref_arrive_time: string;
  flex_minutes: number;
  current_role: UserRole;
  is_admin: boolean;
  verified: boolean;
  trust_score: number;
  emergency_contacts: EmergencyContact[];
}

export interface Vehicle {
  id: string;
  owner_id: string;
  reg_no: string;
  make: string;
  model: string;
  type: 'Sedan' | 'Hatchback' | 'SUV' | 'EV' | 'Bike';
  vehicle_category?: 'car' | 'bike';
  fuel_type: 'Petrol' | 'Diesel' | 'EV' | 'CNG';
  seats: number;
  photo_url?: string;
}

export interface DriverDocument {
  id: string;
  owner_id: string;
  vehicle_id: string;
  doc_type: 'rc' | 'licence' | 'insurance' | 'puc';
  doc_number: string;
  status: 'pending' | 'verified' | 'rejected';
  issue_date: string;
  expiry_date: string;
}

export interface Commute {
  id: string;
  user_id: string;
  role: UserRole;
  source_label: string;
  src_lat: number;
  src_lng: number;
  dest_label: string;
  dest_lat: number;
  dest_lng: number;
  depart_time: string;
  arrive_time: string;
  flex_minutes: number;
  max_detour_km: number;
  recurring: boolean;
  days: string[];
  visibility: RideVisibility;
  vehicle_id?: string;
  seats_offered?: number;
  status: 'active' | 'matched' | 'completed' | 'cancelled';
  created_at: string;
}

export interface RouteStop {
  id: string;
  seq: number;
  label: string;
  lat: number;
  lng: number;
  kind: 'origin' | 'pickup' | 'intermediate' | 'destination';
  passenger_id?: string;
  passenger_name?: string;
  eta_min: number;
  completed: boolean;
  pickup_code?: string;
}

export interface CarpoolMember {
  id: string;
  carpool_id: string;
  passenger_id: string;
  passenger_name: string;
  passenger_gender: Gender;
  passenger_email: string;
  passenger_photo?: string;
  pickup_label: string;
  pickup_lat: number;
  pickup_lng: number;
  pickup_seq: number;
  pickup_code: string; // 4-digit code shown to passenger, entered by host
  verified_at?: string;
  status: 'confirmed' | 'at_pickup' | 'picked_up' | 'arrived' | 'completed' | 'cancelled';
}

export interface Carpool {
  id: string;
  host_id: string;
  host_name: string;
  host_gender: Gender;
  host_photo?: string;
  host_employee_id: string;
  commute_id: string;
  vehicle_id: string;
  vehicle?: Vehicle;
  visibility: RideVisibility;
  invite_code?: string;
  recurrence_rule?: string;
  seats_total: number;
  seats_available: number;
  status: CarpoolStatus;
  start_time: string;
  origin_label: string;
  origin_lat: number;
  origin_lng: number;
  dest_label: string;
  dest_lat: number;
  dest_lng: number;
  polyline: [number, number][]; // Array of [lat, lng] coordinates
  distance_km: number;
  duration_min: number;
  stops: RouteStop[];
  members: CarpoolMember[];
  current_lat?: number;
  current_lng?: number;
  current_index?: number;
  estimated_arrival?: string;
  created_at: string;
}

export interface MatchScore {
  carpool_id: string;
  carpool: Carpool;
  passenger_commute_id: string;
  total: number; // 0-100
  route_sim: number;
  time_score: number;
  distance_score: number;
  pickup_score: number;
  detour_score: number;
  reasons: string[];
  extra_km: number;
  extra_min: number;
  walking_distance_km: number;
  suggested_pickup: {
    lat: number;
    lng: number;
    label: string;
  };
}

export interface JoinRequest {
  id: string;
  carpool_id: string;
  passenger_id: string;
  passenger_name: string;
  passenger_gender: Gender;
  passenger_photo?: string;
  passenger_employee_id: string;
  passenger_commute_id: string;
  pickup_label: string;
  pickup_lat: number;
  pickup_lng: number;
  match_score: number;
  reasons: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
}

export interface CostSplit {
  carpool_id: string;
  distance_km: number;
  duration_min: number;
  fuel_wear_rate_per_km: number; // Default ₹8
  time_rate_per_min: number;     // Default ₹1
  total_cost: number;
  participants_count: number;
  host_share: number;
  per_passenger: number;
  solo_cab_estimated_cost: number; // e.g. ₹22/km
  cost_saved_per_passenger: number;
  total_cost_saved: number;
  co2_saved_kg: number; // (solo km avoided) * 0.12 kg/km
}

export interface SOSEvent {
  id: string;
  carpool_id: string;
  triggered_by_user_id: string;
  triggered_by_name: string;
  triggered_by_role: UserRole;
  lat: number;
  lng: number;
  timestamp: string;
  status: 'active' | 'resolved' | 'investigating';
  driver_name: string;
  driver_mobile: string;
  vehicle_reg: string;
  vehicle_model: string;
  passengers: { name: string; mobile: string }[];
  current_location_desc: string;
  simulated_sms_sent_to: string[];
  notes?: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: 
    | 'request_received'
    | 'request_accepted'
    | 'request_declined'
    | 'driver_en_route'
    | 'pickup_near'
    | 'ride_started'
    | 'passenger_verified'
    | 'ride_completed'
    | 'sos_alert'
    | 'general';
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  carpool_id?: string;
  action_url?: string;
}

export interface Rating {
  id?: string;
  ride_id: string;
  rater_id: string;
  rater_name: string;
  ratee_id: string;
  ratee_name: string;
  score: number; // 1-5
  comment?: string;
  tags?: string[];
  created_at: string;
}

export interface CompanyInfo {
  id: string;
  name: string;
  email_domain: string;
  cost_per_km: number; // ₹8.00
  co2_kg_per_km: number; // 0.120 kg/km
}

export interface AuditEntry {
  id: number;
  actor_id?: string;
  actor_name?: string;
  action: string;
  entity: string;
  entity_id?: string;
  details?: string;
  created_at: string;
}

export interface AdminCreateRideParams {
  hostId: string;
  vehicleId?: string;
  originLabel: string;
  originLat: number;
  originLng: number;
  destLabel: string;
  destLat: number;
  destLng: number;
  startTime: string;
  seatsTotal: number;
  visibility: RideVisibility;
  inviteCode?: string;
  recurrenceRule?: string;
  dispatchCategory?: string;
  preAssignedRiderIds?: string[];
}
