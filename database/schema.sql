-- ============================================================================
-- RideSync Production Schema
-- PostgreSQL 15+ with PostGIS Extension
-- Intelligent Corporate Carpooling & Commute Optimization Platform
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role       AS ENUM ('employee', 'admin');
CREATE TYPE gender_type     AS ENUM ('female', 'male', 'other', 'undisclosed');
CREATE TYPE visibility_type AS ENUM ('public', 'private');
CREATE TYPE ride_status     AS ENUM ('scheduled', 'driver_en_route', 'in_transit', 'completed', 'cancelled');
CREATE TYPE request_status  AS ENUM ('pending', 'accepted', 'declined', 'cancelled', 'expired');
CREATE TYPE booking_status  AS ENUM ('confirmed', 'picked_up', 'dropped_off', 'no_show', 'cancelled');
CREATE TYPE sos_status      AS ENUM ('countdown', 'triggered', 'cancelled', 'resolved');

-- ============================================================================
-- ORGANIZATION & USERS
-- ============================================================================

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email_domain TEXT UNIQUE NOT NULL,
  cost_per_km NUMERIC(6,2) NOT NULL DEFAULT 8.00,      -- fuel + wear baseline in local currency (e.g. INR)
  co2_kg_per_km NUMERIC(4,3) NOT NULL DEFAULT 0.120,   -- adjustable carbon factor per km
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  employee_code TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone_enc BYTEA,                                     -- AES-256 encrypted at application level
  gender gender_type NOT NULL DEFAULT 'undisclosed',   -- used ONLY for women-only eligibility; never public
  role user_role NOT NULL DEFAULT 'employee',
  verified BOOLEAN DEFAULT false,
  trust_score NUMERIC(3,2) DEFAULT 5.00,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (company_id, employee_code)
);

CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone_enc BYTEA NOT NULL,
  email TEXT
);

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('car', 'bike')) NOT NULL,
  make_model TEXT,
  plate_number TEXT NOT NULL,
  seats SMALLINT NOT NULL CHECK (seats BETWEEN 1 AND 7)
);

-- ============================================================================
-- LOCATIONS & COMMUTE PROFILE
-- ============================================================================

CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,   -- NULL = shared company location (office campus)
  company_id UUID REFERENCES companies(id),
  label TEXT NOT NULL,                                   -- Home, Office, Gate 2, Metro Hub
  address_enc BYTEA,                                     -- exact residential address, encrypted
  point GEOGRAPHY(Point,4326) NOT NULL,
  approx_point GEOGRAPHY(Point,4326)                     -- blurred (~500 m) for pre-confirmation privacy
);
CREATE INDEX idx_locations_point ON locations USING GIST (point);

CREATE TABLE commute_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  home_location_id UUID REFERENCES locations(id),
  work_location_id UUID REFERENCES locations(id),
  days_of_week SMALLINT[] DEFAULT '{1,2,3,4,5}',
  depart_from TIME,
  depart_to TIME,
  return_from TIME,
  return_to TIME,
  max_detour_min SMALLINT DEFAULT 10,
  max_walk_m SMALLINT DEFAULT 500,
  women_only_pref BOOLEAN DEFAULT false
);

-- ============================================================================
-- RIDES (hosted routes)
-- ============================================================================

CREATE TABLE rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES users(id),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  company_id UUID NOT NULL REFERENCES companies(id),
  origin_id UUID NOT NULL REFERENCES locations(id),
  destination_id UUID NOT NULL REFERENCES locations(id),
  route_geom GEOGRAPHY(LineString,4326),                 -- actual road network corridor from OSRM
  distance_km NUMERIC(6,2),
  duration_min INT,
  departure_time TIMESTAMPTZ NOT NULL,
  seats_total SMALLINT NOT NULL,
  seats_available SMALLINT NOT NULL CHECK (seats_available >= 0),
  visibility visibility_type NOT NULL DEFAULT 'public',
  women_only BOOLEAN NOT NULL DEFAULT false,
  invite_code TEXT UNIQUE,                               -- for private rides
  recurrence_rule TEXT,                                  -- e.g. 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'
  status ride_status NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (visibility = 'public' OR invite_code IS NOT NULL)
);
CREATE INDEX idx_rides_search ON rides (company_id, status, departure_time);
CREATE INDEX idx_rides_route ON rides USING GIST (route_geom);

CREATE TABLE ride_invites (                              -- private rides: invited users/teams
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (ride_id, user_id)
);

-- ============================================================================
-- REQUESTS & BOOKINGS
-- ============================================================================

CREATE TABLE ride_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  rider_id UUID NOT NULL REFERENCES users(id),
  pickup_location_id UUID NOT NULL REFERENCES locations(id),
  match_score SMALLINT CHECK (match_score BETWEEN 0 AND 100),
  detour_min NUMERIC(5,1),
  walk_m INT,
  match_reason TEXT,                                     -- "4 min detour, 300 m walk"
  status request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (ride_id, rider_id)
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  rider_id UUID NOT NULL REFERENCES users(id),
  pickup_point GEOGRAPHY(Point,4326) NOT NULL,           -- optimized pickup along route
  stop_order SMALLINT NOT NULL,
  eta TIMESTAMPTZ,
  rider_distance_km NUMERIC(6,2),
  fare NUMERIC(8,2),                                     -- distance-share of trip cost
  solo_cost_estimate NUMERIC(8,2),                       -- for savings display
  status booking_status NOT NULL DEFAULT 'confirmed',
  UNIQUE (ride_id, rider_id)
);

-- ============================================================================
-- SERVER-SIDE WOMEN-ONLY SAFETY ENFORCEMENT TRIGGER
-- Prevents race conditions or tampered client requests from bypassing
-- female verification for protected carpools.
-- ============================================================================

CREATE OR REPLACE FUNCTION enforce_women_only() RETURNS trigger AS $$
BEGIN
  IF (SELECT women_only FROM rides WHERE id = NEW.ride_id)
     AND (SELECT gender FROM users WHERE id = NEW.rider_id) <> 'female' THEN
    RAISE EXCEPTION 'Women-only ride';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_women_only_req BEFORE INSERT ON ride_requests
  FOR EACH ROW EXECUTE FUNCTION enforce_women_only();

CREATE OR REPLACE TRIGGER trg_women_only_book BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION enforce_women_only();

-- ============================================================================
-- LIVE TRIP TELEMETRY & EVENTS
-- ============================================================================

CREATE TABLE trip_events (
  id BIGSERIAL PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,                              -- en_route, picked_up, in_transit, completed...
  booking_id UUID REFERENCES bookings(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE trip_locations (                            -- live GPS pings, purge after retention window
  id BIGSERIAL PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  point GEOGRAPHY(Point,4326) NOT NULL,
  speed_kmh NUMERIC(5,1),
  recorded_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_trip_loc ON trip_locations (ride_id, recorded_at DESC);

-- ============================================================================
-- SAFETY & RATINGS
-- ============================================================================

CREATE TABLE sos_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id),
  triggered_by UUID NOT NULL REFERENCES users(id),
  status sos_status NOT NULL DEFAULT 'countdown',
  point GEOGRAPHY(Point,4326),
  share_token TEXT UNIQUE,                               -- live trip tracking link
  contacts_notified INT DEFAULT 0,
  admin_notified BOOLEAN DEFAULT false,
  triggered_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT
);

CREATE TABLE ratings (
  ride_id UUID REFERENCES rides(id),
  rater_id UUID REFERENCES users(id),
  ratee_id UUID REFERENCES users(id),
  score SMALLINT CHECK (score BETWEEN 1 AND 5),
  comment TEXT,
  PRIMARY KEY (ride_id, rater_id, ratee_id)
);

-- ============================================================================
-- NOTIFICATIONS & AUDIT LOG
-- ============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                                    -- request_received, accepted, schedule_change, sos...
  title TEXT NOT NULL,
  body TEXT,
  ride_id UUID REFERENCES rides(id),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_notif_user ON notifications (user_id, read_at, created_at DESC);

CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- ADMIN ANALYTICS VIEW
-- Aggregate metrics only - no personal residential locations exposed
-- ============================================================================

CREATE OR REPLACE VIEW v_ride_analytics AS
SELECT r.company_id,
       date_trunc('day', r.departure_time) AS day,
       count(DISTINCT r.id)                AS rides,
       count(b.id)                         AS riders,
       round(100.0 * count(b.id) / NULLIF(sum(r.seats_total),0), 1) AS seat_utilization_pct,
       sum(b.rider_distance_km)            AS km_saved,
       sum(b.rider_distance_km) * max(c.co2_kg_per_km) AS co2_saved_kg,
       sum(b.solo_cost_estimate - b.fare)  AS cost_saved
FROM rides r
JOIN companies c ON c.id = r.company_id
LEFT JOIN bookings b ON b.ride_id = r.id AND b.status IN ('picked_up','dropped_off')
WHERE r.status = 'completed'
GROUP BY r.company_id, date_trunc('day', r.departure_time);
