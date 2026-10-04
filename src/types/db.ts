/**
 * PostgreSQL 15+ PostGIS Schema TypeScript Definitions
 * Directly reflects the RideSync database schema in database/schema.sql
 */

export type UserRole = 'employee' | 'admin';
export type GenderType = 'female' | 'male' | 'other' | 'undisclosed';
export type VisibilityType = 'public' | 'private';
export type RideStatus = 'scheduled' | 'driver_en_route' | 'in_transit' | 'completed' | 'cancelled';
export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';
export type BookingStatus = 'confirmed' | 'picked_up' | 'dropped_off' | 'no_show' | 'cancelled';
export type SosStatus = 'countdown' | 'triggered' | 'cancelled' | 'resolved';

export interface Company {
  id: string; // UUID
  name: string;
  email_domain: string;
  cost_per_km: number; // default 8.00 (fuel + wear)
  co2_kg_per_km: number; // default 0.120 kg/km
  created_at?: string;
}

export interface DbUser {
  id: string; // UUID
  company_id: string; // UUID
  employee_code: string;
  full_name: string;
  email: string;
  phone_enc?: string; // encrypted representation
  gender: GenderType;
  role: UserRole;
  verified: boolean;
  trust_score: number; // numeric(3,2), e.g. 4.95
  created_at?: string;
}

export interface DbEmergencyContact {
  id: string;
  user_id: string;
  name: string;
  phone_enc: string;
  email?: string;
}

export interface DbVehicle {
  id: string;
  owner_id: string;
  type: 'car' | 'bike';
  make_model?: string;
  plate_number: string;
  seats: number; // 1-7
}

export interface DbLocation {
  id: string;
  user_id?: string | null; // NULL for shared corporate campus location
  company_id?: string | null;
  label: string;
  address_enc?: string;
  point: {
    lat: number;
    lng: number;
  };
  approx_point?: {
    lat: number;
    lng: number;
  };
}

export interface DbCommuteProfile {
  user_id: string;
  home_location_id?: string;
  work_location_id?: string;
  days_of_week: number[]; // e.g. [1, 2, 3, 4, 5]
  depart_from?: string; // "08:30"
  depart_to?: string;   // "09:00"
  return_from?: string; // "17:30"
  return_to?: string;   // "18:15"
  max_detour_min: number; // default 10
  max_walk_m: number;     // default 500
  women_only_pref: boolean;
}

export interface DbRide {
  id: string;
  host_id: string;
  vehicle_id: string;
  company_id: string;
  origin_id: string;
  destination_id: string;
  route_geom?: [number, number][]; // LineString coordinates [lat, lng]
  distance_km: number;
  duration_min: number;
  departure_time: string;
  seats_total: number;
  seats_available: number;
  visibility: VisibilityType;
  women_only: boolean;
  invite_code?: string;
  recurrence_rule?: string;
  status: RideStatus;
  created_at?: string;
}

export interface DbRideInvite {
  ride_id: string;
  user_id: string;
}

export interface DbRideRequest {
  id: string;
  ride_id: string;
  rider_id: string;
  pickup_location_id: string;
  match_score?: number; // 0-100
  detour_min?: number;
  walk_m?: number;
  match_reason?: string;
  status: RequestStatus;
  created_at?: string;
}

export interface DbBooking {
  id: string;
  ride_id: string;
  rider_id: string;
  pickup_point: {
    lat: number;
    lng: number;
  };
  stop_order: number;
  eta?: string;
  rider_distance_km?: number;
  fare: number;
  solo_cost_estimate: number;
  status: BookingStatus;
}

export interface DbTripEvent {
  id: number;
  ride_id: string;
  event_type: string; // 'scheduled' | 'driver_en_route' | 'picked_up' | 'in_transit' | 'completed' | 'cancelled'
  booking_id?: string;
  created_at: string;
}

export interface DbTripLocation {
  id: number;
  ride_id: string;
  user_id: string;
  point: {
    lat: number;
    lng: number;
  };
  speed_kmh: number;
  recorded_at: string;
}

export interface DbSOSEvent {
  id: string;
  ride_id: string;
  triggered_by: string;
  status: SosStatus;
  point?: {
    lat: number;
    lng: number;
  };
  share_token?: string;
  contacts_notified: number;
  admin_notified: boolean;
  triggered_at: string;
  resolved_at?: string;
  resolution_note?: string;
}

export interface DbRating {
  ride_id: string;
  rater_id: string;
  ratee_id: string;
  score: number; // 1-5
  comment?: string;
  created_at?: string;
}

export interface DbNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  ride_id?: string;
  read_at?: string | null;
  created_at: string;
}

export interface DbAuditLog {
  id: number;
  actor_id?: string;
  action: string;
  entity?: string;
  entity_id?: string;
  created_at: string;
}

export interface RideAnalyticsRow {
  company_id: string;
  day: string;
  rides: number;
  riders: number;
  seat_utilization_pct: number;
  km_saved: number;
  co2_saved_kg: number;
  cost_saved: number;
}
