-- ============================================================================
-- RideSync Seed Data
-- PostgreSQL 15+ with PostGIS Extension
-- Realistic corporate campus carpools & commute corridors in Hyderabad HITEC City
-- ============================================================================

-- 1. COMPANIES
INSERT INTO companies (id, name, email_domain, cost_per_km, co2_kg_per_km) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'TechCorp India', 'techcorp.io', 8.00, 0.120),
  ('c0000000-0000-0000-0000-000000000002', 'Microsoft IDC Hyderabad', 'microsoft.com', 8.50, 0.125)
ON CONFLICT (id) DO NOTHING;

-- 2. USERS
INSERT INTO users (id, company_id, employee_code, full_name, email, phone_enc, gender, role, verified, trust_score) VALUES
  ('u0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'TC-1042', 'Ananya Sharma', 'ananya.sharma@techcorp.io', pgp_sym_encrypt('+91 98765 43210', 'app_secret_key'), 'female', 'employee', true, 4.95),
  ('u0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'TC-2089', 'Priya Patel', 'priya.patel@techcorp.io', pgp_sym_encrypt('+91 98222 33445', 'app_secret_key'), 'female', 'employee', true, 4.90),
  ('u0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'TC-3150', 'Rahul Verma', 'rahul.verma@techcorp.io', pgp_sym_encrypt('+91 98444 55667', 'app_secret_key'), 'male', 'employee', true, 4.80),
  ('u0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'TC-0001', 'Alok Kulkarni', 'workplace.safety@techcorp.io', pgp_sym_encrypt('+91 40 6677 8899', 'app_secret_key'), 'male', 'admin', true, 5.00),
  ('u0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'TC-1823', 'Sneha Rao', 'sneha.rao@techcorp.io', pgp_sym_encrypt('+91 98666 77889', 'app_secret_key'), 'female', 'employee', true, 4.88),
  ('u0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 'TC-4011', 'Vikram Mehta', 'vikram.m@techcorp.io', pgp_sym_encrypt('+91 98777 88990', 'app_secret_key'), 'male', 'employee', true, 4.75),
  ('u0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000001', 'TC-5120', 'Kavya Nair', 'kavya.nair@techcorp.io', pgp_sym_encrypt('+91 98888 99001', 'app_secret_key'), 'female', 'employee', true, 4.92),
  ('u0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000001', 'TC-6311', 'Karthik Subramanian', 'karthik.s@techcorp.io', pgp_sym_encrypt('+91 98999 11223', 'app_secret_key'), 'male', 'employee', true, 4.85)
ON CONFLICT (id) DO NOTHING;

-- 3. EMERGENCY CONTACTS
INSERT INTO emergency_contacts (id, user_id, name, phone_enc, email) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000001', 'Rohan Sharma', pgp_sym_encrypt('+91 98111 22334', 'app_secret_key'), 'rohan.s@gmail.com'),
  ('e0000000-0000-0000-0000-000000000002', 'u0000000-0000-0000-0000-000000000001', 'TechCorp 24x7 Security Desk', pgp_sym_encrypt('+91 40 6677 8899', 'app_secret_key'), 'security@techcorp.io'),
  ('e0000000-0000-0000-0000-000000000003', 'u0000000-0000-0000-0000-000000000002', 'Kavita Patel', pgp_sym_encrypt('+91 98333 44556', 'app_secret_key'), 'kavita.patel@yahoo.com'),
  ('e0000000-0000-0000-0000-000000000004', 'u0000000-0000-0000-0000-000000000003', 'Sunita Verma', pgp_sym_encrypt('+91 98555 66778', 'app_secret_key'), 'sunita.verma@gmail.com')
ON CONFLICT (id) DO NOTHING;

-- 4. VEHICLES (Cars and Bikes)
INSERT INTO vehicles (id, owner_id, type, make_model, plate_number, seats) VALUES
  ('v0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000001', 'car', 'Hyundai i20 Asta', 'TS 09 EZ 4082', 4),
  ('v0000000-0000-0000-0000-000000000002', 'u0000000-0000-0000-0000-000000000005', 'car', 'Honda City e:HEV Hybrid', 'TS 07 HK 9021', 4),
  ('v0000000-0000-0000-0000-000000000003', 'u0000000-0000-0000-0000-000000000006', 'car', 'Tata Nexon EV Prime', 'TS 08 FD 3341', 4),
  ('v0000000-0000-0000-0000-000000000004', 'u0000000-0000-0000-0000-000000000008', 'car', 'Maruti Grand Vitara Hybrid', 'TS 10 AB 5512', 4),
  ('v0000000-0000-0000-0000-000000000005', 'u0000000-0000-0000-0000-000000000003', 'bike', 'Ather 450X Gen 3 (EV)', 'TS 09 FL 1290', 1)
ON CONFLICT (id) DO NOTHING;

-- 5. LOCATIONS (Shared office campuses and employee commute hubs)
-- Note: coordinates are (Longitude, Latitude) for PostGIS ST_MakePoint(lng, lat)
INSERT INTO locations (id, user_id, company_id, label, address_enc, point, approx_point) VALUES
  -- Shared corporate campus destination (user_id IS NULL)
  ('l0000000-0000-0000-0000-000000000001', NULL, 'c0000000-0000-0000-0000-000000000001', 'Mindspace Tech Park Building 12', pgp_sym_encrypt('Building 12, Mindspace Business Park, HITEC City, Hyderabad', 'app_secret_key'), ST_SetSRID(ST_MakePoint(78.3772, 17.4435), 4326)::geography, ST_SetSRID(ST_MakePoint(78.3772, 17.4435), 4326)::geography),
  -- Ananya Home (Gachibowli)
  ('l0000000-0000-0000-0000-000000000002', 'u0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Gachibowli Stadium Enclave', pgp_sym_encrypt('Flat 402, Oakwood Towers, Gachibowli, Hyderabad', 'app_secret_key'), ST_SetSRID(ST_MakePoint(78.3489, 17.4401), 4326)::geography, ST_SetSRID(ST_MakePoint(78.3510, 17.4420), 4326)::geography),
  -- Priya Home (Kondapur)
  ('l0000000-0000-0000-0000-000000000003', 'u0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Kondapur Botanical Garden Crossing', pgp_sym_encrypt('Villa 18, Green Meadows, Botanical Garden Rd, Kondapur', 'app_secret_key'), ST_SetSRID(ST_MakePoint(78.3600, 17.4580), 4326)::geography, ST_SetSRID(ST_MakePoint(78.3620, 17.4560), 4326)::geography),
  -- Rahul Home (Madhapur)
  ('l0000000-0000-0000-0000-000000000004', 'u0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'Madhapur Metro Circle', pgp_sym_encrypt('Flat 201, Cyber Heights, Madhapur, Hyderabad', 'app_secret_key'), ST_SetSRID(ST_MakePoint(78.3915, 17.4483), 4326)::geography, ST_SetSRID(ST_MakePoint(78.3890, 17.4470), 4326)::geography),
  -- Sneha Home (Kondapur RTO)
  ('l0000000-0000-0000-0000-000000000005', 'u0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'Kondapur Main Road / RTO', pgp_sym_encrypt('Apt 3B, Sri Sai Residency, Kondapur, Hyderabad', 'app_secret_key'), ST_SetSRID(ST_MakePoint(78.3619, 17.4646), 4326)::geography, ST_SetSRID(ST_MakePoint(78.3630, 17.4630), 4326)::geography),
  -- Vikram Home (Miyapur)
  ('l0000000-0000-0000-0000-000000000006', 'u0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 'Miyapur Crossroads Metro', pgp_sym_encrypt('House 12-4, Miyapur Main Road, Hyderabad', 'app_secret_key'), ST_SetSRID(ST_MakePoint(78.3580, 17.4930), 4326)::geography, ST_SetSRID(ST_MakePoint(78.3560, 17.4910), 4326)::geography),
  -- Kavya Home (Telecom Nagar)
  ('l0000000-0000-0000-0000-000000000007', 'u0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000001', 'Telecom Nagar Flyover Junction', pgp_sym_encrypt('B-604, Golf View Apts, Telecom Nagar, Gachibowli', 'app_secret_key'), ST_SetSRID(ST_MakePoint(78.3550, 17.4450), 4326)::geography, ST_SetSRID(ST_MakePoint(78.3540, 17.4460), 4326)::geography),
  -- Karthik Home (Jubilee Hills)
  ('l0000000-0000-0000-0000-000000000008', 'u0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000001', 'Jubilee Hills Road 36 Metro', pgp_sym_encrypt('Plot 780, Road No. 36, Jubilee Hills, Hyderabad', 'app_secret_key'), ST_SetSRID(ST_MakePoint(78.4110, 17.4280), 4326)::geography, ST_SetSRID(ST_MakePoint(78.4090, 17.4290), 4326)::geography)
ON CONFLICT (id) DO NOTHING;

-- 6. COMMUTE PROFILES
INSERT INTO commute_profiles (user_id, home_location_id, work_location_id, days_of_week, depart_from, depart_to, return_from, return_to, max_detour_min, max_walk_m, women_only_pref) VALUES
  ('u0000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000002', 'l0000000-0000-0000-0000-000000000001', '{1,2,3,4,5}', '08:15', '08:45', '17:30', '18:15', 10, 400, true),
  ('u0000000-0000-0000-0000-000000000002', 'l0000000-0000-0000-0000-000000000003', 'l0000000-0000-0000-0000-000000000001', '{1,2,3,4,5}', '08:20', '08:50', '17:45', '18:30', 8, 500, true),
  ('u0000000-0000-0000-0000-000000000003', 'l0000000-0000-0000-0000-000000000004', 'l0000000-0000-0000-0000-000000000001', '{1,2,3,4,5}', '08:15', '08:40', '17:30', '18:00', 12, 600, false),
  ('u0000000-0000-0000-0000-000000000005', 'l0000000-0000-0000-0000-000000000005', 'l0000000-0000-0000-0000-000000000001', '{1,2,3,4,5}', '08:30', '09:00', '18:00', '18:45', 10, 400, true),
  ('u0000000-0000-0000-0000-000000000006', 'l0000000-0000-0000-0000-000000000006', 'l0000000-0000-0000-0000-000000000001', '{1,2,3,4,5}', '08:00', '08:30', '17:15', '18:00', 15, 800, false),
  ('u0000000-0000-0000-0000-000000000007', 'l0000000-0000-0000-0000-000000000007', 'l0000000-0000-0000-0000-000000000001', '{1,2,3,4,5}', '08:25', '08:45', '17:30', '18:15', 8, 300, true),
  ('u0000000-0000-0000-0000-000000000008', 'l0000000-0000-0000-0000-000000000008', 'l0000000-0000-0000-0000-000000000001', '{1,2,3,4,5}', '08:30', '09:00', '17:45', '18:30', 10, 500, false)
ON CONFLICT (user_id) DO NOTHING;

-- 7. RIDES
-- LineString route geometry: coordinates in (lng, lat) format
INSERT INTO rides (id, host_id, vehicle_id, company_id, origin_id, destination_id, route_geom, distance_km, duration_min, departure_time, seats_total, seats_available, visibility, women_only, invite_code, recurrence_rule, status) VALUES
  -- 1. Ananya's Women-Only Carpool
  (
    'r0000000-0000-0000-0000-000000000001',
    'u0000000-0000-0000-0000-000000000001',
    'v0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'l0000000-0000-0000-0000-000000000002',
    'l0000000-0000-0000-0000-000000000001',
    ST_SetSRID(ST_GeomFromText('LINESTRING(78.3489 17.4401, 78.3520 17.4425, 78.3550 17.4450, 78.3582 17.4485, 78.3650 17.4470, 78.3720 17.4455, 78.3772 17.4435)'), 4326)::geography,
    7.40,
    22,
    now() + interval '30 minutes',
    3,
    2,
    'public',
    true,
    NULL,
    'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
    'scheduled'
  ),
  -- 2. Sneha's Women-Only Carpool (Kondapur -> Mindspace)
  (
    'r0000000-0000-0000-0000-000000000002',
    'u0000000-0000-0000-0000-000000000005',
    'v0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    'l0000000-0000-0000-0000-000000000005',
    'l0000000-0000-0000-0000-000000000001',
    ST_SetSRID(ST_GeomFromText('LINESTRING(78.3619 17.4646, 78.3630 17.4590, 78.3680 17.4520, 78.3740 17.4480, 78.3772 17.4435)'), 4326)::geography,
    5.60,
    18,
    now() + interval '45 minutes',
    3,
    3,
    'public',
    true,
    NULL,
    'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
    'scheduled'
  ),
  -- 3. Vikram's Private Ride (Engineering team invite code)
  (
    'r0000000-0000-0000-0000-000000000003',
    'u0000000-0000-0000-0000-000000000006',
    'v0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000001',
    'l0000000-0000-0000-0000-000000000006',
    'l0000000-0000-0000-0000-000000000001',
    ST_SetSRID(ST_GeomFromText('LINESTRING(78.3580 17.4930, 78.3610 17.4800, 78.3660 17.4650, 78.3720 17.4520, 78.3772 17.4435)'), 4326)::geography,
    8.90,
    25,
    now() + interval '20 minutes',
    4,
    3,
    'private',
    false,
    'DEV-TEAM-2026',
    'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
    'scheduled'
  ),
  -- 4. Karthik's Public Ride (Jubilee Hills -> Mindspace)
  (
    'r0000000-0000-0000-0000-000000000004',
    'u0000000-0000-0000-0000-000000000008',
    'v0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000001',
    'l0000000-0000-0000-0000-000000000008',
    'l0000000-0000-0000-0000-000000000001',
    ST_SetSRID(ST_GeomFromText('LINESTRING(78.4110 17.4280, 78.3980 17.4350, 78.3880 17.4400, 78.3772 17.4435)'), 4326)::geography,
    6.80,
    20,
    now() + interval '40 minutes',
    3,
    2,
    'public',
    false,
    NULL,
    'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
    'scheduled'
  ),
  -- 5. Historical Completed Ride for Analytics
  (
    'r0000000-0000-0000-0000-000000000005',
    'u0000000-0000-0000-0000-000000000001',
    'v0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'l0000000-0000-0000-0000-000000000002',
    'l0000000-0000-0000-0000-000000000001',
    ST_SetSRID(ST_GeomFromText('LINESTRING(78.3489 17.4401, 78.3582 17.4485, 78.3772 17.4435)'), 4326)::geography,
    7.40,
    22,
    now() - interval '1 day',
    3,
    0,
    'public',
    true,
    NULL,
    NULL,
    'completed'
  )
ON CONFLICT (id) DO NOTHING;

-- 8. RIDE REQUESTS
INSERT INTO ride_requests (id, ride_id, rider_id, pickup_location_id, match_score, detour_min, walk_m, match_reason, status) VALUES
  (
    'q0000000-0000-0000-0000-000000000001',
    'r0000000-0000-0000-0000-000000000001',
    'u0000000-0000-0000-0000-000000000002', -- Priya Patel
    'l0000000-0000-0000-0000-000000000003',
    91,
    2.5,
    220,
    '2.5 min detour, 220 m walk; verified women-only route',
    'pending'
  ),
  (
    'q0000000-0000-0000-0000-000000000002',
    'r0000000-0000-0000-0000-000000000004',
    'u0000000-0000-0000-0000-000000000003', -- Rahul Verma
    'l0000000-0000-0000-0000-000000000004',
    88,
    3.0,
    350,
    '3.0 min detour, 350 m walk',
    'accepted'
  )
ON CONFLICT (id) DO NOTHING;

-- 9. BOOKINGS
INSERT INTO bookings (id, ride_id, rider_id, pickup_point, stop_order, eta, rider_distance_km, fare, solo_cost_estimate, status) VALUES
  -- Kavya already confirmed on Ananya's ride
  (
    'b0000000-0000-0000-0000-000000000001',
    'r0000000-0000-0000-0000-000000000001',
    'u0000000-0000-0000-0000-000000000007',
    ST_SetSRID(ST_MakePoint(78.3582, 17.4485), 4326)::geography,
    1,
    now() + interval '12 minutes',
    5.20,
    42.00,
    115.00,
    'confirmed'
  ),
  -- Rahul confirmed on Karthik's ride
  (
    'b0000000-0000-0000-0000-000000000002',
    'r0000000-0000-0000-0000-000000000004',
    'u0000000-0000-0000-0000-000000000003',
    ST_SetSRID(ST_MakePoint(78.3915, 17.4483), 4326)::geography,
    1,
    now() + interval '18 minutes',
    4.10,
    35.00,
    95.00,
    'confirmed'
  ),
  -- Completed booking for yesterday's ride (analytics calculation)
  (
    'b0000000-0000-0000-0000-000000000003',
    'r0000000-0000-0000-0000-000000000005',
    'u0000000-0000-0000-0000-000000000007',
    ST_SetSRID(ST_MakePoint(78.3582, 17.4485), 4326)::geography,
    1,
    now() - interval '1 day',
    5.20,
    42.00,
    115.00,
    'dropped_off'
  ),
  (
    'b0000000-0000-0000-0000-000000000004',
    'r0000000-0000-0000-0000-000000000005',
    'u0000000-0000-0000-0000-000000000002',
    ST_SetSRID(ST_MakePoint(78.3620, 17.4560), 4326)::geography,
    2,
    now() - interval '1 day',
    6.10,
    48.00,
    134.00,
    'dropped_off'
  )
ON CONFLICT (id) DO NOTHING;

-- 10. TRIP EVENTS
INSERT INTO trip_events (ride_id, event_type, booking_id) VALUES
  ('r0000000-0000-0000-0000-000000000005', 'scheduled', NULL),
  ('r0000000-0000-0000-0000-000000000005', 'driver_en_route', NULL),
  ('r0000000-0000-0000-0000-000000000005', 'picked_up', 'b0000000-0000-0000-0000-000000000003'),
  ('r0000000-0000-0000-0000-000000000005', 'picked_up', 'b0000000-0000-0000-0000-000000000004'),
  ('r0000000-0000-0000-0000-000000000005', 'in_transit', NULL),
  ('r0000000-0000-0000-0000-000000000005', 'completed', NULL);

-- 11. TRIP LOCATIONS (GPS Telemetry Pings)
INSERT INTO trip_locations (ride_id, user_id, point, speed_kmh, recorded_at) VALUES
  ('r0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000001', ST_SetSRID(ST_MakePoint(78.3489, 17.4401), 4326)::geography, 0.0, now() - interval '10 minutes'),
  ('r0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000001', ST_SetSRID(ST_MakePoint(78.3520, 17.4425), 4326)::geography, 34.5, now() - interval '5 minutes'),
  ('r0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000001', ST_SetSRID(ST_MakePoint(78.3550, 17.4450), 4326)::geography, 42.0, now() - interval '1 minute');

-- 12. SOS EVENTS
INSERT INTO sos_events (id, ride_id, triggered_by, status, point, share_token, contacts_notified, admin_notified, triggered_at, resolved_at, resolution_note) VALUES
  (
    's0000000-0000-0000-0000-000000000001',
    'r0000000-0000-0000-0000-000000000005',
    'u0000000-0000-0000-0000-000000000007',
    'resolved',
    ST_SetSRID(ST_MakePoint(78.3582, 17.4485), 4326)::geography,
    'sos_live_7a9f8b2c',
    2,
    true,
    now() - interval '1 day 1 hour',
    now() - interval '1 day 58 minutes',
    'Resolved. False alarm triggered during drill. Security team acknowledged and passenger marked safe.'
  )
ON CONFLICT (id) DO NOTHING;

-- 13. RATINGS
INSERT INTO ratings (ride_id, rater_id, ratee_id, score, comment) VALUES
  ('r0000000-0000-0000-0000-000000000005', 'u0000000-0000-0000-0000-000000000007', 'u0000000-0000-0000-0000-000000000001', 5, 'Super punctual, safe driving, and clean car. Felt very safe with Women-Only pool!'),
  ('r0000000-0000-0000-0000-000000000005', 'u0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000007', 5, 'Great colleague! On time at pickup spot with OTP ready.')
ON CONFLICT (ride_id, rater_id, ratee_id) DO NOTHING;

-- 14. NOTIFICATIONS
INSERT INTO notifications (id, user_id, type, title, body, ride_id, read_at) VALUES
  ('n0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000001', 'request_received', 'New Ride Request from Priya Patel', 'Priya requested to join your 08:30 AM Women-Only commute (91% Match).', 'r0000000-0000-0000-0000-000000000001', NULL),
  ('n0000000-0000-0000-0000-000000000002', 'u0000000-0000-0000-0000-000000000002', 'general', 'Morning Commute Match Alert', 'Found 2 high-compatibility morning carpools heading to Mindspace Tech Park.', NULL, now() - interval '2 hours')
ON CONFLICT (id) DO NOTHING;

-- 15. AUDIT LOG
INSERT INTO audit_log (actor_id, action, entity, entity_id) VALUES
  ('u0000000-0000-0000-0000-000000000001', 'CREATE_RIDE', 'rides', 'r0000000-0000-0000-0000-000000000001'),
  ('u0000000-0000-0000-0000-000000000002', 'REQUEST_JOIN', 'ride_requests', 'q0000000-0000-0000-0000-000000000001'),
  ('u0000000-0000-0000-0000-000000000001', 'ACCEPT_BOOKING', 'bookings', 'b0000000-0000-0000-0000-000000000001');
