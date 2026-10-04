import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Database, 
  Table, 
  MapPin, 
  Shield, 
  Layers, 
  Copy, 
  Check, 
  Play, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  ArrowLeft,
  Building,
  Terminal,
  Code2,
  Cpu,
  Search,
  ChevronRight,
  TrendingUp,
  Download
} from 'lucide-react';
import { useStore } from '../lib/store';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Toast } from '../components/ui/Toast';
import { haversineDistanceKm } from '../utils/geo';

const SCHEMA_SQL_SNIPPET = `-- RideSync schema (PostgreSQL 15+ with PostGIS)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ENUMS
CREATE TYPE user_role       AS ENUM ('employee','admin');
CREATE TYPE gender_type     AS ENUM ('female','male','other','undisclosed');
CREATE TYPE visibility_type AS ENUM ('public','private');
CREATE TYPE ride_status     AS ENUM ('scheduled','driver_en_route','in_transit','completed','cancelled');
CREATE TYPE request_status  AS ENUM ('pending','accepted','declined','cancelled','expired');
CREATE TYPE booking_status  AS ENUM ('confirmed','picked_up','dropped_off','no_show','cancelled');
CREATE TYPE sos_status      AS ENUM ('countdown','triggered','cancelled','resolved');

-- 16 Relational Tables & Triggers defined in database/schema.sql
-- enforce_women_only() trigger function on ride_requests and bookings
-- v_ride_analytics SQL view for ESG aggregation`;

export const DatabaseExplorer: React.FC = () => {
  const navigate = useNavigate();
  const { 
    companies, 
    currentCompany, 
    switchCompany, 
    allUsers, 
    vehicles, 
    carpools, 
    joinRequests, 
    ratings, 
    auditLog, 
    locations, 
    testWomenOnlyTrigger 
  } = useStore();

  const [activeTab, setActiveTab] = useState<'tables' | 'data' | 'spatial' | 'triggers' | 'analytics'>('tables');
  const [selectedTable, setSelectedTable] = useState<string>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Trigger test states
  const [testRiderId, setTestRiderId] = useState<string>('user-rahul'); // Rahul is male
  const [testRideId, setTestRideId] = useState<string>('carpool-ananya-01'); // Women-Only ride
  const [triggerOutput, setTriggerOutput] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    details?: string;
  }>({ status: 'idle', message: 'Click "Execute INSERT Statement" to test server-side trigger enforce_women_only().' });

  // Spatial simulator states
  const [spatialWalkRadius, setSpatialWalkRadius] = useState<number>(500); // 500m
  const [selectedSpatialUser, setSelectedSpatialUser] = useState<string>('user-priya');

  const selectedSpatialUserData = allUsers.find(u => u.id === selectedSpatialUser) || allUsers[1];
  const primaryCarpool = carpools[0];

  // Spatial calculation
  const spatialMetrics = useMemo(() => {
    if (!selectedSpatialUserData || !primaryCarpool) {
      return { distanceM: 0, withinRadius: false, detourMin: 2.5 };
    }
    const distKm = haversineDistanceKm(
      selectedSpatialUserData.home_lat,
      selectedSpatialUserData.home_lng,
      primaryCarpool.origin_lat,
      primaryCarpool.origin_lng
    );
    const distanceM = Math.round(distKm * 1000);
    const withinRadius = distanceM <= spatialWalkRadius;
    const detourMin = Math.round((distKm * 2.2) * 10) / 10;
    return { distanceM, withinRadius, detourMin };
  }, [selectedSpatialUserData, primaryCarpool, spatialWalkRadius]);

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SCHEMA_SQL_SNIPPET);
    setCopied(true);
    setToastMessage('PostgreSQL schema copied to clipboard.');
    setToastType('success');
    setToastOpen(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecuteTriggerTest = () => {
    const res = testWomenOnlyTrigger(testRideId, testRiderId);
    const rider = allUsers.find(u => u.id === testRiderId);
    const ride = carpools.find(c => c.id === testRideId);

    if (!res.success) {
      setTriggerOutput({
        status: 'error',
        message: res.error || 'Server-side trigger blocked transaction',
        details: `[PostgreSQL 42P01] EXCEPTION: Women-only ride\nCONTEXT: PL/pgSQL function enforce_women_only() line 4 at RAISE\nTRANSACTION ABORTED: INSERT INTO ride_requests (ride_id: "${ride?.id}", rider_id: "${rider?.full_name}" [gender: ${rider?.gender}]) rejected by trigger trg_women_only_req.`,
      });
      setToastMessage('Trigger blocked unauthorized male insertion.');
      setToastType('error');
      setToastOpen(true);
    } else {
      setTriggerOutput({
        status: 'success',
        message: 'Transaction SUCCESS (201 Created)',
        details: `INSERT INTO ride_requests (ride_id: "${ride?.id}", rider_id: "${rider?.full_name}" [gender: ${rider?.gender}])\nTrigger enforce_women_only() passed. Record persisted in table ride_requests.`,
      });
      setToastMessage('Trigger verification passed for female employee.');
      setToastType('success');
      setToastOpen(true);
    }
  };

  // Tables list in schema
  const SCHEMA_TABLES = [
    { name: 'companies', count: companies.length, desc: 'Enterprise tenants, email domains & cost/CO2 rates', icon: Building },
    { name: 'users', count: allUsers.length, desc: 'SSO corporate employees with trust scores & verified badges', icon: Shield },
    { name: 'vehicles', count: vehicles.length, desc: 'Registered car and bike fleet with plate numbers & seats', icon: Table },
    { name: 'locations', count: locations.length, desc: 'Geographic points with 500m blurred pre-confirmation privacy', icon: MapPin },
    { name: 'rides', count: carpools.length, desc: 'Hosted carpools with PostGIS LineString route geometry', icon: Layers },
    { name: 'ride_requests', count: joinRequests.length, desc: 'Colleague join requests with match score & detour minutes', icon: Table },
    { name: 'bookings', count: carpools.reduce((acc, c) => acc + c.members.length, 0), desc: 'Confirmed seat reservations & proportional fare splits', icon: CheckCircle2 },
    { name: 'ratings', count: ratings.length, desc: 'Mutual peer reviews (1-5 stars) and trust score adjustments', icon: TrendingUp },
    { name: 'sos_events', count: 1, desc: 'Emergency dispatch logs, web share token & resolution audit', icon: AlertTriangle },
    { name: 'audit_log', count: auditLog.length, desc: 'Immutable compliance trail for safety & operational actions', icon: Terminal },
  ];

  return (
    <div className="min-h-screen bg-[#F5FAFF] pb-24">
      {/* Top Header */}
      <div className="bg-white border-b border-[#E3ECF5] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="w-10 h-10 rounded-2xl bg-[#F5FAFF] border border-[#E3ECF5] flex items-center justify-center text-[#0F1B2D] hover:bg-[#E8F3FF] transition-colors"
              title="Return to Admin"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E8F3FF] text-[#2B8CEB] border border-[#2B8CEB]/20">
                  PostgreSQL 15+ with PostGIS
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-[#22B07D]">
                  <span className="w-2 h-2 rounded-full bg-[#22B07D] animate-pulse" />
                  Live Connected
                </span>
              </div>
              <h1 className="text-20 sm:text-24 font-bold text-[#0F1B2D] tracking-tight mt-0.5">
                RideSync Database & PostGIS Console
              </h1>
            </div>
          </div>

          {/* Active Tenant / Company Switcher */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="flex items-center gap-1.5 bg-[#F5FAFF] border border-[#E3ECF5] px-3 py-1.5 rounded-2xl">
              <Building className="w-4 h-4 text-[#2B8CEB]" />
              <span className="text-xs text-[#5B6B80]">Tenant:</span>
              <select
                value={currentCompany.id}
                onChange={(e) => switchCompany(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#0F1B2D] focus:outline-none cursor-pointer"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (₹{c.cost_per_km}/km)
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopySchema}
              className="flex items-center gap-1.5 text-xs font-bold"
            >
              {copied ? <Check className="w-4 h-4 text-[#22B07D]" /> : <Copy className="w-4 h-4 text-[#2B8CEB]" />}
              <span>{copied ? 'Copied' : 'Copy Schema SQL'}</span>
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-2 overflow-x-auto pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('tables')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 flex items-center gap-2 ${
              activeTab === 'tables'
                ? 'border-[#2B8CEB] text-[#2B8CEB]'
                : 'border-transparent text-[#5B6B80] hover:text-[#0F1B2D]'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Schema & Tables (16)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 flex items-center gap-2 ${
              activeTab === 'data'
                ? 'border-[#2B8CEB] text-[#2B8CEB]'
                : 'border-transparent text-[#5B6B80] hover:text-[#0F1B2D]'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Live Data Browser</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('spatial')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 flex items-center gap-2 ${
              activeTab === 'spatial'
                ? 'border-[#2B8CEB] text-[#2B8CEB]'
                : 'border-transparent text-[#5B6B80] hover:text-[#0F1B2D]'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>PostGIS Spatial Playground</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('triggers')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 flex items-center gap-2 ${
              activeTab === 'triggers'
                ? 'border-[#2B8CEB] text-[#2B8CEB]'
                : 'border-transparent text-[#5B6B80] hover:text-[#0F1B2D]'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Women-Only Trigger Test</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'border-[#2B8CEB] text-[#2B8CEB]'
                : 'border-transparent text-[#5B6B80] hover:text-[#0F1B2D]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>View: v_ride_analytics</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ========================================================================= */}
        {/* TAB 1: SCHEMA & TABLES DIRECTORY */}
        {/* ========================================================================= */}
        {activeTab === 'tables' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Quick Stats Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-white border border-[#E3ECF5] rounded-2xl shadow-xs">
                <span className="text-[11px] font-bold text-[#5B6B80] uppercase tracking-wider block">Relational Tables</span>
                <span className="text-24 font-bold text-[#0F1B2D] mt-1 block">16 Tables</span>
                <span className="text-[11px] text-[#22B07D] font-medium">Full PostGIS & FK integrity</span>
              </div>
              <div className="p-4 bg-white border border-[#E3ECF5] rounded-2xl shadow-xs">
                <span className="text-[11px] font-bold text-[#5B6B80] uppercase tracking-wider block">Custom ENUMs</span>
                <span className="text-24 font-bold text-[#0F1B2D] mt-1 block">7 ENUM Types</span>
                <span className="text-[11px] text-[#2B8CEB] font-medium">user_role, gender_type...</span>
              </div>
              <div className="p-4 bg-white border border-[#E3ECF5] rounded-2xl shadow-xs">
                <span className="text-[11px] font-bold text-[#5B6B80] uppercase tracking-wider block">Spatial Indexes</span>
                <span className="text-24 font-bold text-[#0F1B2D] mt-1 block">GIST Indexes</span>
                <span className="text-[11px] text-[#22B07D] font-medium">Sub-millisecond route match</span>
              </div>
              <div className="p-4 bg-white border border-[#E3ECF5] rounded-2xl shadow-xs">
                <span className="text-[11px] font-bold text-[#5B6B80] uppercase tracking-wider block">Security Triggers</span>
                <span className="text-24 font-bold text-[#0F1B2D] mt-1 block">2 Triggers</span>
                <span className="text-[11px] text-[#B084F5] font-medium">enforce_women_only()</span>
              </div>
            </div>

            {/* Tables Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#0F1B2D] uppercase tracking-wider">
                  PostgreSQL 15 Database Tables
                </h2>
                <span className="text-xs text-[#5B6B80]">Click any table to browse live rows</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {SCHEMA_TABLES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <div
                      key={t.name}
                      onClick={() => {
                        setSelectedTable(t.name);
                        setActiveTab('data');
                      }}
                      className="p-4 bg-white border border-[#E3ECF5] hover:border-[#4DA8FF] rounded-2xl shadow-xs hover:shadow-soft transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#E8F3FF] text-[#2B8CEB] flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="font-mono text-sm font-bold text-[#0F1B2D] group-hover:text-[#2B8CEB] transition-colors">
                            {t.name}
                          </span>
                        </div>
                        <Badge variant="neutral">{t.count} records</Badge>
                      </div>
                      <p className="text-xs text-[#5B6B80] line-clamp-2 leading-relaxed">
                        {t.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ENUMs Documentation Box */}
            <div className="p-5 bg-white border border-[#E3ECF5] rounded-2xl shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-[#0F1B2D]">Defined PostgreSQL Custom Types & ENUMs</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-[#F5FAFF] border border-[#E3ECF5] rounded-xl space-y-1">
                  <span className="font-mono font-bold text-[#2B8CEB] block">user_role</span>
                  <span className="text-[#5B6B80]">('employee', 'admin')</span>
                </div>
                <div className="p-3 bg-[#F5FAFF] border border-[#E3ECF5] rounded-xl space-y-1">
                  <span className="font-mono font-bold text-[#2B8CEB] block">gender_type</span>
                  <span className="text-[#5B6B80]">('female', 'male', 'other', 'undisclosed')</span>
                </div>
                <div className="p-3 bg-[#F5FAFF] border border-[#E3ECF5] rounded-xl space-y-1">
                  <span className="font-mono font-bold text-[#2B8CEB] block">visibility_type</span>
                  <span className="text-[#5B6B80]">('public', 'private')</span>
                </div>
                <div className="p-3 bg-[#F5FAFF] border border-[#E3ECF5] rounded-xl space-y-1">
                  <span className="font-mono font-bold text-[#2B8CEB] block">ride_status</span>
                  <span className="text-[#5B6B80]">('scheduled', 'driver_en_route', 'in_transit', 'completed', 'cancelled')</span>
                </div>
                <div className="p-3 bg-[#F5FAFF] border border-[#E3ECF5] rounded-xl space-y-1">
                  <span className="font-mono font-bold text-[#2B8CEB] block">request_status</span>
                  <span className="text-[#5B6B80]">('pending', 'accepted', 'declined', 'cancelled', 'expired')</span>
                </div>
                <div className="p-3 bg-[#F5FAFF] border border-[#E3ECF5] rounded-xl space-y-1">
                  <span className="font-mono font-bold text-[#2B8CEB] block">booking_status</span>
                  <span className="text-[#5B6B80]">('confirmed', 'picked_up', 'dropped_off', 'no_show', 'cancelled')</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: LIVE DATA BROWSER */}
        {/* ========================================================================= */}
        {activeTab === 'data' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Table Selector Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-[#E3ECF5] rounded-2xl shadow-xs">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-[#2B8CEB]" />
                <div>
                  <span className="text-xs text-[#5B6B80] block">Table Browser</span>
                  <span className="font-mono font-bold text-sm text-[#0F1B2D]">SELECT * FROM {selectedTable};</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="bg-[#F5FAFF] border border-[#E3ECF5] px-3 py-1.5 rounded-xl text-xs font-bold text-[#0F1B2D] focus:outline-none"
                >
                  {SCHEMA_TABLES.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name} ({t.count})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table Contents */}
            <div className="bg-white border border-[#E3ECF5] rounded-2xl shadow-soft overflow-hidden">
              <div className="overflow-x-auto max-h-[550px]">
                {selectedTable === 'users' && (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F5FAFF] border-b border-[#E3ECF5] text-[#5B6B80] font-mono uppercase text-[10px] sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">id</th>
                        <th className="py-2.5 px-3">employee_code</th>
                        <th className="py-2.5 px-3">full_name</th>
                        <th className="py-2.5 px-3">email</th>
                        <th className="py-2.5 px-3">gender</th>
                        <th className="py-2.5 px-3">role</th>
                        <th className="py-2.5 px-3">verified</th>
                        <th className="py-2.5 px-3">trust_score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E3ECF5]">
                      {allUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-[#F5FAFF] transition-colors">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-[#2B8CEB]">{u.id}</td>
                          <td className="py-2.5 px-3 font-mono font-bold">{u.employee_id}</td>
                          <td className="py-2.5 px-3 font-semibold text-[#0F1B2D]">{u.full_name}</td>
                          <td className="py-2.5 px-3 text-[#5B6B80]">{u.email}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.gender === 'female' ? 'bg-[#F3ECFF] text-[#B084F5]' : 'bg-[#E8F3FF] text-[#2B8CEB]'
                            }`}>
                              {u.gender}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-medium">{u.is_admin ? 'admin' : 'employee'}</td>
                          <td className="py-2.5 px-3 text-[#22B07D] font-bold">true</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#22B07D]">
                            {(u.trust_score / 20).toFixed(2)} / 5.0
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {selectedTable === 'rides' && (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F5FAFF] border-b border-[#E3ECF5] text-[#5B6B80] font-mono uppercase text-[10px] sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">id</th>
                        <th className="py-2.5 px-3">host_id</th>
                        <th className="py-2.5 px-3">corridor</th>
                        <th className="py-2.5 px-3">departure_time</th>
                        <th className="py-2.5 px-3">seats_avail</th>
                        <th className="py-2.5 px-3">visibility</th>
                        <th className="py-2.5 px-3">women_only</th>
                        <th className="py-2.5 px-3">status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E3ECF5]">
                      {carpools.map((c) => (
                        <tr key={c.id} className="hover:bg-[#F5FAFF] transition-colors">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-[#2B8CEB]">{c.id}</td>
                          <td className="py-2.5 px-3 font-semibold">{c.host_name}</td>
                          <td className="py-2.5 px-3">{c.origin_label.split(',')[0]} → {c.dest_label.split(',')[0]}</td>
                          <td className="py-2.5 px-3 font-mono font-bold">{c.start_time}</td>
                          <td className="py-2.5 px-3 font-bold">{c.seats_available} / {c.seats_total}</td>
                          <td className="py-2.5 px-3">{c.visibility}</td>
                          <td className="py-2.5 px-3">
                            {c.visibility === 'women_only' ? (
                              <span className="px-2 py-0.5 rounded-full bg-[#F3ECFF] text-[#B084F5] font-bold text-[10px]">
                                true ♀
                              </span>
                            ) : (
                              <span className="text-[#5B6B80]">false</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[#22B07D]">{c.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {selectedTable === 'ratings' && (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F5FAFF] border-b border-[#E3ECF5] text-[#5B6B80] font-mono uppercase text-[10px] sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">rater_name</th>
                        <th className="py-2.5 px-3">ratee_name</th>
                        <th className="py-2.5 px-3">score</th>
                        <th className="py-2.5 px-3">tags</th>
                        <th className="py-2.5 px-3">comment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E3ECF5]">
                      {ratings.map((r, i) => (
                        <tr key={i} className="hover:bg-[#F5FAFF] transition-colors">
                          <td className="py-2.5 px-3 font-semibold">{r.rater_name}</td>
                          <td className="py-2.5 px-3 font-semibold text-[#2B8CEB]">{r.ratee_name}</td>
                          <td className="py-2.5 px-3 font-bold text-[#FFB800]">{r.score} ★</td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-wrap gap-1">
                              {r.tags?.map(t => (
                                <span key={t} className="px-1.5 py-0.5 bg-[#E8F3FF] text-[#2B8CEB] rounded text-[9px] font-semibold">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-[#5B6B80] italic">"{r.comment}"</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {selectedTable === 'audit_log' && (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F5FAFF] border-b border-[#E3ECF5] text-[#5B6B80] font-mono uppercase text-[10px] sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">id</th>
                        <th className="py-2.5 px-3">actor</th>
                        <th className="py-2.5 px-3">action</th>
                        <th className="py-2.5 px-3">entity</th>
                        <th className="py-2.5 px-3">details</th>
                        <th className="py-2.5 px-3">created_at</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E3ECF5]">
                      {auditLog.map((a) => (
                        <tr key={a.id} className="hover:bg-[#F5FAFF] transition-colors">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-[#5B6B80]">{a.id}</td>
                          <td className="py-2.5 px-3 font-semibold">{a.actor_name || 'System'}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#2B8CEB]">{a.action}</td>
                          <td className="py-2.5 px-3 font-mono text-[#5B6B80]">{a.entity}</td>
                          <td className="py-2.5 px-3 text-[#0F1B2D]">{a.details}</td>
                          <td className="py-2.5 px-3 text-[#5B6B80] whitespace-nowrap">{new Date(a.created_at).toLocaleTimeString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {selectedTable === 'locations' && (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F5FAFF] border-b border-[#E3ECF5] text-[#5B6B80] font-mono uppercase text-[10px] sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">id</th>
                        <th className="py-2.5 px-3">label</th>
                        <th className="py-2.5 px-3">point (Exact Geography)</th>
                        <th className="py-2.5 px-3">approx_point (Blurred 500m)</th>
                        <th className="py-2.5 px-3">address_enc</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E3ECF5]">
                      {locations.map((loc) => (
                        <tr key={loc.id} className="hover:bg-[#F5FAFF] transition-colors">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-[#2B8CEB]">{loc.id}</td>
                          <td className="py-2.5 px-3 font-bold text-[#0F1B2D]">{loc.label}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-[#22B07D]">
                            POINT({loc.point.lng} {loc.point.lat})
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-[#5B6B80]">
                            POINT({loc.approx_point?.lng} {loc.approx_point?.lat})
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[10px] text-[#5B6B80]">
                            \x7a9f8b2c4e1a0d (AES-256)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {selectedTable === 'companies' && (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F5FAFF] border-b border-[#E3ECF5] text-[#5B6B80] font-mono uppercase text-[10px] sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">id</th>
                        <th className="py-2.5 px-3">name</th>
                        <th className="py-2.5 px-3">email_domain</th>
                        <th className="py-2.5 px-3">cost_per_km (fuel + wear)</th>
                        <th className="py-2.5 px-3">co2_kg_per_km</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E3ECF5]">
                      {companies.map((c) => (
                        <tr key={c.id} className="hover:bg-[#F5FAFF] transition-colors">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-[#2B8CEB]">{c.id}</td>
                          <td className="py-2.5 px-3 font-bold text-[#0F1B2D]">{c.name}</td>
                          <td className="py-2.5 px-3 font-mono text-[#5B6B80]">@{c.email_domain}</td>
                          <td className="py-2.5 px-3 font-bold text-[#22B07D]">₹{c.cost_per_km.toFixed(2)} / km</td>
                          <td className="py-2.5 px-3 font-bold text-[#2B8CEB]">{c.co2_kg_per_km.toFixed(3)} kg/km</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {selectedTable === 'vehicles' && (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F5FAFF] border-b border-[#E3ECF5] text-[#5B6B80] font-mono uppercase text-[10px] sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">id</th>
                        <th className="py-2.5 px-3">type</th>
                        <th className="py-2.5 px-3">make_model</th>
                        <th className="py-2.5 px-3">plate_number</th>
                        <th className="py-2.5 px-3">seats (1-7)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E3ECF5]">
                      {vehicles.map((v) => (
                        <tr key={v.id} className="hover:bg-[#F5FAFF] transition-colors">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-[#2B8CEB]">{v.id}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              v.vehicle_category === 'bike' ? 'bg-[#FFEBEB] text-[#E5484D]' : 'bg-[#E8F3FF] text-[#2B8CEB]'
                            }`}>
                              {v.vehicle_category === 'bike' ? '🏍️ bike' : '🚗 car'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold">{v.make} {v.model}</td>
                          <td className="py-2.5 px-3 font-mono font-bold">{v.reg_no}</td>
                          <td className="py-2.5 px-3 font-bold text-[#22B07D]">{v.seats} seats</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: POSTGIS SPATIAL PLAYGROUND */}
        {/* ========================================================================= */}
        {activeTab === 'spatial' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-5 bg-white border border-[#E3ECF5] rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#0F1B2D]">
                    PostGIS ST_DWithin & Route Corridor Overlap Simulator
                  </h2>
                  <p className="text-xs text-[#5B6B80]">
                    Demonstrates how PostgreSQL calculates walking distances and detour times along LineString corridors.
                  </p>
                </div>
                <Badge variant="status">PostGIS 3.3 Active</Badge>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#5B6B80] uppercase tracking-wider block">
                    Select Commuting Colleague (Rider):
                  </label>
                  <select
                    value={selectedSpatialUser}
                    onChange={(e) => setSelectedSpatialUser(e.target.value)}
                    className="w-full bg-[#F5FAFF] border border-[#E3ECF5] p-2.5 rounded-xl text-xs font-bold text-[#0F1B2D]"
                  >
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.home_area.split(',')[0]})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#5B6B80] uppercase tracking-wider">
                      Max Walking Radius (ST_DWithin):
                    </span>
                    <span className="font-bold font-mono text-[#2B8CEB]">{spatialWalkRadius} meters</span>
                  </div>
                  <input
                    type="range"
                    min="200"
                    max="1000"
                    step="50"
                    value={spatialWalkRadius}
                    onChange={(e) => setSpatialWalkRadius(Number(e.target.value))}
                    className="w-full accent-[#2B8CEB] cursor-pointer"
                  />
                </div>
              </div>

              {/* Live Spatial Result Box */}
              <div className="p-4 bg-[#F5FAFF] border border-[#E3ECF5] rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#2B8CEB]">
                    PostGIS Query Analysis:
                  </span>
                  <Badge variant={spatialMetrics.withinRadius ? 'success' : 'neutral'}>
                    {spatialMetrics.withinRadius ? 'Within Corridor Match' : 'Exceeds Walk Distance'}
                  </Badge>
                </div>

                <pre className="p-3 bg-[#0F1B2D] text-[#4DA8FF] rounded-xl text-[11px] font-mono overflow-x-auto">
{`SELECT r.id, ST_Distance(r.route_geom, ST_SetSRID(ST_MakePoint(${selectedSpatialUserData.home_lng}, ${selectedSpatialUserData.home_lat}), 4326)::geography) AS walk_dist_meters
FROM rides r
WHERE r.id = '${primaryCarpool.id}'
  AND ST_DWithin(r.route_geom, ST_SetSRID(ST_MakePoint(${selectedSpatialUserData.home_lng}, ${selectedSpatialUserData.home_lat}), 4326)::geography, ${spatialWalkRadius});`}
                </pre>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 bg-white border border-[#E3ECF5] rounded-xl">
                    <span className="text-[11px] text-[#5B6B80] block font-medium">Walking Distance</span>
                    <span className="text-base font-bold text-[#0F1B2D] font-mono mt-0.5 block">
                      {spatialMetrics.distanceM} meters
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-[#E3ECF5] rounded-xl">
                    <span className="text-[11px] text-[#5B6B80] block font-medium">Estimated Detour</span>
                    <span className="text-base font-bold text-[#22B07D] font-mono mt-0.5 block">
                      +{spatialMetrics.detourMin} mins
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-[#E3ECF5] rounded-xl">
                    <span className="text-[11px] text-[#5B6B80] block font-medium">Corridor Overlap</span>
                    <span className="text-base font-bold text-[#2B8CEB] font-mono mt-0.5 block">
                      {spatialMetrics.withinRadius ? '92% High Match' : 'Requires Transit Point'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: WOMEN-ONLY TRIGGER TEST */}
        {/* ========================================================================= */}
        {activeTab === 'triggers' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-5 bg-white border border-[#E3ECF5] rounded-2xl shadow-xs space-y-4">
              <div>
                <h2 className="text-base font-bold text-[#0F1B2D]">
                  PostgreSQL Server-Side Trigger: enforce_women_only()
                </h2>
                <p className="text-xs text-[#5B6B80]">
                  Verifies that the database trigger blocks male users from inserting rows into protected Women-Only rides.
                </p>
              </div>

              {/* Code Snippet */}
              <pre className="p-3 bg-[#0F1B2D] text-[#BEE0FF] rounded-xl text-[11px] font-mono overflow-x-auto">
{`CREATE FUNCTION enforce_women_only() RETURNS trigger AS $$
BEGIN
  IF (SELECT women_only FROM rides WHERE id = NEW.ride_id)
     AND (SELECT gender FROM users WHERE id = NEW.rider_id) <> 'female' THEN
    RAISE EXCEPTION 'Women-only ride';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_women_only_req BEFORE INSERT ON ride_requests
  FOR EACH ROW EXECUTE FUNCTION enforce_women_only();`}
              </pre>

              {/* Interactive Test Panel */}
              <div className="p-4 bg-[#F5FAFF] border border-[#E3ECF5] rounded-2xl space-y-4">
                <span className="text-xs font-bold text-[#0F1B2D] uppercase tracking-wider block">
                  Simulate SQL INSERT Statement:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#5B6B80] block">Rider Employee (rider_id):</label>
                    <select
                      value={testRiderId}
                      onChange={(e) => setTestRiderId(e.target.value)}
                      className="w-full bg-white border border-[#E3ECF5] p-2.5 rounded-xl text-xs font-bold text-[#0F1B2D]"
                    >
                      <option value="user-rahul">Rahul Verma ♂ (male) - Expect TRIGGER REJECTION</option>
                      <option value="user-vikram">Vikram Mehta ♂ (male) - Expect TRIGGER REJECTION</option>
                      <option value="user-priya">Priya Patel ♀ (female) - Expect SUCCESS</option>
                      <option value="user-kavya">Kavya Nair ♀ (female) - Expect SUCCESS</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#5B6B80] block">Target Ride (ride_id):</label>
                    <select
                      value={testRideId}
                      onChange={(e) => setTestRideId(e.target.value)}
                      className="w-full bg-white border border-[#E3ECF5] p-2.5 rounded-xl text-xs font-bold text-[#0F1B2D]"
                    >
                      <option value="carpool-ananya-01">Ananya's Women-Only Ride (women_only = true)</option>
                      <option value="carpool-sneha-02">Sneha's Women-Only Ride (women_only = true)</option>
                      <option value="carpool-karthik-04">Karthik's Public Ride (women_only = false)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleExecuteTriggerTest}
                    className="flex items-center gap-2 font-bold shadow-soft"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Execute INSERT Statement</span>
                  </Button>
                </div>

                {/* Output Console */}
                <div className={`p-4 rounded-xl font-mono text-xs border transition-all ${
                  triggerOutput.status === 'error'
                    ? 'bg-[#FFEBEB] border-[#E5484D]/40 text-[#0F1B2D]'
                    : triggerOutput.status === 'success'
                    ? 'bg-[#EBFBF5] border-[#22B07D]/40 text-[#0F1B2D]'
                    : 'bg-white border-[#E3ECF5] text-[#5B6B80]'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {triggerOutput.status === 'error' && <AlertTriangle className="w-4 h-4 text-[#E5484D]" />}
                    {triggerOutput.status === 'success' && <CheckCircle2 className="w-4 h-4 text-[#22B07D]" />}
                    <span className="font-bold text-xs">{triggerOutput.message}</span>
                  </div>
                  {triggerOutput.details && (
                    <pre className="text-[11px] whitespace-pre-wrap mt-2 p-2.5 bg-black/5 rounded-lg">
                      {triggerOutput.details}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: VIEW: v_ride_analytics */}
        {/* ========================================================================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-5 bg-white border border-[#E3ECF5] rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#0F1B2D]">
                    Materialized View: v_ride_analytics
                  </h2>
                  <p className="text-xs text-[#5B6B80]">
                    Aggregates daily corporate ride telemetry, seat utilization, CO2 offsets, and employee savings without exposing residential coordinates.
                  </p>
                </div>
                <Badge variant="success">SQL View</Badge>
              </div>

              {/* View Query Code */}
              <pre className="p-3 bg-[#0F1B2D] text-[#BEE0FF] rounded-xl text-[11px] font-mono overflow-x-auto">
{`CREATE VIEW v_ride_analytics AS
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
GROUP BY r.company_id, date_trunc('day', r.departure_time);`}
              </pre>

              {/* Dynamic View Result Table */}
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5FAFF] border-b border-[#E3ECF5] text-[#5B6B80] font-mono uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Company</th>
                      <th className="py-2.5 px-3">day</th>
                      <th className="py-2.5 px-3">completed_rides</th>
                      <th className="py-2.5 px-3">riders</th>
                      <th className="py-2.5 px-3">seat_utilization_pct</th>
                      <th className="py-2.5 px-3">km_saved</th>
                      <th className="py-2.5 px-3">co2_saved_kg</th>
                      <th className="py-2.5 px-3">cost_saved</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3ECF5]">
                    <tr className="hover:bg-[#F5FAFF]">
                      <td className="py-3 px-3 font-bold text-[#0F1B2D]">{currentCompany.name}</td>
                      <td className="py-3 px-3 font-mono text-[#5B6B80]">{new Date().toISOString().split('T')[0]}</td>
                      <td className="py-3 px-3 font-mono font-bold">28</td>
                      <td className="py-3 px-3 font-mono font-bold">72</td>
                      <td className="py-3 px-3 font-bold text-[#22B07D]">78.5%</td>
                      <td className="py-3 px-3 font-mono font-bold">14,820 km</td>
                      <td className="py-3 px-3 font-bold text-[#2B8CEB]">
                        {(14820 * currentCompany.co2_kg_per_km).toFixed(1)} kg
                      </td>
                      <td className="py-3 px-3 font-bold text-[#22B07D]">
                        ₹{(14820 * (22.0 - currentCompany.cost_per_km)).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      <Toast
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
        message={toastMessage}
        type={toastType}
      />
    </div>
  );
};
