# RideSync Database Architecture & Schema

Production-grade relational schema designed for **PostgreSQL 15+** with the **PostGIS 3+** geospatial extension and **pgcrypto** encryption.

---

## 1. Quick Start

### Option A: Local Docker (PostgreSQL 15 + PostGIS)
```bash
# Run PostgreSQL 15 with PostGIS 3.3
docker run --name ridesync-db \
  -e POSTGRES_DB=ridesync \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgis/postgis:15-3.3

# Apply Schema & Seed Data
psql -h localhost -U postgres -d ridesync -f database/schema.sql
psql -h localhost -U postgres -d ridesync -f database/seed.sql
psql -h localhost -U postgres -d ridesync -f database/queries.sql
```

### Option B: Cloud Postgres (Supabase, Neon, AWS RDS, GCP Cloud SQL)
1. Enable `postgis` and `pgcrypto` extensions in the database dashboard.
2. Execute `database/schema.sql` in the SQL Query Editor.
3. Execute `database/seed.sql` to populate sample corporate data.

---

## 2. Entity Relationship Overview

| Table | Purpose | Spatial / Security Features |
|---|---|---|
| `companies` | Corporate enterprise profiles & baseline cost/CO2 rates | Configurable fuel rate (₹8.00/km) & CO2 factor (0.120 kg/km) |
| `users` | Corporate employees with SSO codes and trust scores | `phone_enc` (app-level AES-256), `gender` restricted for women-only checks |
| `emergency_contacts` | SOS escalation contacts | Linked to user, notified instantly on SOS trigger |
| `vehicles` | Fleet registered by employees | Support for `car` (1-7 seats) and `bike` (1 pillion seat) |
| `locations` | Geographic origins, destinations, and meeting spots | Exact `point` + blurred `approx_point` (~500m) for pre-booking privacy |
| `commute_profiles` | Commute patterns (days, depart/return times, flex) | Detour tolerances (`max_detour_min`, `max_walk_m`) |
| `rides` | Hosted carpools along actual road polylines | `route_geom GEOGRAPHY(LineString, 4326)` with GIST indexing |
| `ride_invites` | Team-specific private carpool access | Strict access control via `invite_code` |
| `ride_requests` | Colleague join requests with detour and walk metrics | `match_score`, `detour_min`, `walk_m` |
| `bookings` | Confirmed boarding reservations & cost splits | `pickup_point`, distance-share `fare`, solo benchmark `solo_cost_estimate` |
| `trip_events` | State transition audit for active rides | Records `driver_en_route`, `picked_up`, `in_transit`, `completed` |
| `trip_locations` | Real-time GPS coordinate telemetry pings | High-frequency points with `speed_kmh` and retention auto-purge |
| `sos_events` | Emergency alert dispatches with live token | `share_token` for real-time web tracking without login requirement |
| `ratings` | Mutual peer reviews and trust score adjustments | 1 to 5 star rating, peer tags, feedback comment |
| `notifications` | In-app alerts and notifications | Indexed on `(user_id, read_at, created_at DESC)` |
| `audit_log` | Immutable compliance and safety event trail | Tracks administrative actions and safety interventions |
| `v_ride_analytics` | Pre-aggregated SQL view for ESG dashboard | Seat occupancy %, km saved, CO2 avoided, employee savings |

---

## 3. Spatial Matching & Corridor Indexing

RideSync relies on PostGIS native geospatial indexing (`GIST`) for microsecond route matching:

```sql
-- GIST Spatial Indexes
CREATE INDEX idx_locations_point ON locations USING GIST (point);
CREATE INDEX idx_rides_route ON rides USING GIST (route_geom);
```

### Walk Radius Search (`ST_DWithin`):
```sql
SELECT r.id, ST_Distance(r.route_geom, p.point) AS walk_meters
FROM rides r, locations p
WHERE p.id = $1 AND ST_DWithin(r.route_geom, p.point, 500);
```

### Dynamic Pickup Projection (`ST_ClosestPoint`):
Calculates the optimal coordinate along the car's existing trajectory so the host doesn't have to enter private lanes.

---

## 4. Server-Side Women-Only Safeguard

To guarantee safety at the database layer (preventing API tampering or race conditions), a PostgreSQL trigger executes before insert on `ride_requests` and `bookings`:

```sql
CREATE FUNCTION enforce_women_only() RETURNS trigger AS $$
BEGIN
  IF (SELECT women_only FROM rides WHERE id = NEW.ride_id)
     AND (SELECT gender FROM users WHERE id = NEW.rider_id) <> 'female' THEN
    RAISE EXCEPTION 'Women-only ride';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
```
