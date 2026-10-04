-- ============================================================================
-- RideSync Production Query Book
-- PostGIS Spatial Analysis, Trigger Tests & ESG Reporting Queries
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SPATIAL CORRIDOR SEARCH (ST_DWithin)
-- Finds all scheduled rides whose road corridor passes within 500m of a rider's pickup point
-- ----------------------------------------------------------------------------
SELECT 
    r.id AS ride_id,
    u.full_name AS host_name,
    v.make_model AS vehicle,
    r.seats_available,
    r.women_only,
    r.departure_time,
    ROUND(ST_Distance(r.route_geom, p.point)::numeric, 1) AS walk_distance_meters
FROM rides r
JOIN users u ON u.id = r.host_id
JOIN vehicles v ON v.id = r.vehicle_id
CROSS JOIN (
    SELECT point 
    FROM locations 
    WHERE id = 'l0000000-0000-0000-0000-000000000003' -- Priya's pickup in Kondapur
) p
WHERE r.status = 'scheduled'
  AND r.seats_available > 0
  AND ST_DWithin(r.route_geom, p.point, 500) -- Within 500m walking radius
ORDER BY walk_distance_meters ASC;

-- ----------------------------------------------------------------------------
-- 2. OPTIMAL PICKUP PROJECTION (ST_ClosestPoint & ST_LineLocatePoint)
-- Finds the exact coordinate on the host's route closest to the rider
-- ----------------------------------------------------------------------------
SELECT 
    r.id AS ride_id,
    ST_AsGeoJSON(ST_ClosestPoint(r.route_geom::geometry, p.point::geometry)) AS optimal_pickup_point,
    ROUND((ST_LineLocatePoint(r.route_geom::geometry, p.point::geometry) * 100)::numeric, 1) AS route_progress_pct
FROM rides r
CROSS JOIN (
    SELECT point 
    FROM locations 
    WHERE id = 'l0000000-0000-0000-0000-000000000003'
) p
WHERE r.id = 'r0000000-0000-0000-0000-000000000001';

-- ----------------------------------------------------------------------------
-- 3. WOMEN-ONLY SERVER-SIDE TRIGGER VERIFICATION TEST
-- Demonstrates server-side exception enforcement
-- ----------------------------------------------------------------------------

-- Test 3A: Male user (Rahul Verma) attempting to request a Women-Only ride
-- EXPECTED: ERROR: Women-only ride (trg_women_only_req blocks insert)
DO $$
BEGIN
  BEGIN
    INSERT INTO ride_requests (ride_id, rider_id, pickup_location_id, match_score)
    VALUES (
      'r0000000-0000-0000-0000-000000000001', -- Ananya's Women-Only ride
      'u0000000-0000-0000-0000-000000000003', -- Rahul Verma (male)
      'l0000000-0000-0000-0000-000000000004',
      85
    );
    RAISE NOTICE 'FAILED: Trigger did not prevent male user from requesting women-only ride!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'SUCCESS: Server-side trigger enforced policy with error: %', SQLERRM;
  END;
END $$;

-- Test 3B: Female user (Priya Patel) requesting Women-Only ride
-- EXPECTED: SUCCESS (Request inserted cleanly)
-- (Handled in seed.sql: q0000000-0000-0000-0000-000000000001)

-- ----------------------------------------------------------------------------
-- 4. ESG & SEAT UTILIZATION REPORTING (v_ride_analytics)
-- Aggregated carbon emissions avoided, seat occupancy, and travel cost saved
-- ----------------------------------------------------------------------------
SELECT 
    c.name AS company_name,
    v.day,
    v.rides AS completed_rides,
    v.riders AS passengers_carried,
    v.seat_utilization_pct || '%' AS seat_occupancy_rate,
    v.km_saved || ' km' AS single_occupant_km_saved,
    v.co2_saved_kg || ' kg' AS scope_3_emissions_avoided,
    '₹' || v.cost_saved AS total_employee_savings
FROM v_ride_analytics v
JOIN companies c ON c.id = v.company_id
ORDER BY v.day DESC;

-- ----------------------------------------------------------------------------
-- 5. LIVE TELEMETRY & DRIVER SPEED TRACKING
-- Latest GPS coordinate and moving speed for active trips
-- ----------------------------------------------------------------------------
SELECT 
    tl.ride_id,
    u.full_name AS driver_name,
    tl.speed_kmh,
    ST_AsGeoJSON(tl.point) AS current_gps_point,
    tl.recorded_at,
    ROUND(EXTRACT(EPOCH FROM (now() - tl.recorded_at)))::int AS seconds_ago
FROM trip_locations tl
JOIN rides r ON r.id = tl.ride_id
JOIN users u ON u.id = r.host_id
WHERE tl.recorded_at >= now() - interval '15 minutes'
ORDER BY tl.recorded_at DESC
LIMIT 10;
