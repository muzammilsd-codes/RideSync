import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Car, 
  Users, 
  TrendingUp, 
  Leaf, 
  ShieldAlert, 
  Download, 
  LayoutDashboard, 
  Clock, 
  MapPin, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight,
  Database,
  Building,
  Terminal,
  Send,
  UserPlus,
  Ban,
  Search,
  Filter,
  Check,
  Calendar,
  Sparkles,
  Repeat,
  Compass,
  Key,
  ShieldCheck,
  Info
} from 'lucide-react';
import { useStore } from '../lib/store';
import { KPICard } from '../components/ui/KPICard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { AdminCreateRideModal } from '../components/admin/AdminCreateRideModal';
import { AdminAssignRiderModal } from '../components/admin/AdminAssignRiderModal';
import { Carpool } from '../types';

// Trend area chart data
const TREND_DATA = [
  { day: 'Mon', rides: 240, co2Kg: 860 },
  { day: 'Tue', rides: 310, co2Kg: 1120 },
  { day: 'Wed', rides: 345, co2Kg: 1240 },
  { day: 'Thu', rides: 320, co2Kg: 1150 },
  { day: 'Fri', rides: 213, co2Kg: 772 },
];

// Top corridors bar chart data
const CORRIDOR_DATA = [
  { corridor: 'Kondapur → Mindspace', trips: 420 },
  { corridor: 'Miyapur → Fin District', trips: 360 },
  { corridor: 'Gachibowli → Cyber Towers', trips: 315 },
  { corridor: 'Jubilee Hills → HITEC', trips: 210 },
  { corridor: 'Kukatpally → DLF', trips: 185 },
];

// Peak hours heatmap matrix (Days x Time slots)
const HEATMAP_HOURS = ['07:30', '08:00', '08:30', '09:00', '09:30', '17:30', '18:00', '18:30', '19:00'];
const HEATMAP_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// Values 0 to 4 intensity
const HEATMAP_VALUES: Record<string, number[]> = {
  Mon: [1, 3, 4, 4, 2, 2, 4, 3, 1],
  Tue: [2, 3, 4, 4, 3, 3, 4, 4, 2],
  Wed: [2, 4, 4, 4, 3, 3, 4, 4, 2],
  Thu: [1, 3, 4, 4, 2, 2, 4, 3, 1],
  Fri: [1, 2, 3, 2, 1, 3, 3, 2, 1],
};

const getHeatColor = (intensity: number) => {
  switch (intensity) {
    case 4:
      return 'bg-[#2B8CEB] text-white'; // Peak
    case 3:
      return 'bg-[#4DA8FF] text-[#0F1B2D]'; // High
    case 2:
      return 'bg-[#BEE0FF] text-[#0F1B2D]'; // Medium
    case 1:
      return 'bg-[#E8F3FF] text-[#2B8CEB]'; // Low
    default:
      return 'bg-[#F5FAFF] text-[#5B6B80]'; // Min
  }
};

const SOS_LOGS = [
  {
    id: 'SOS-8012',
    date: 'Today, 08:52 AM',
    carpoolId: 'RIDE-1049',
    employee: 'Ananya Sharma',
    driver: 'Rahul Varma',
    route: 'Kondapur → Mindspace',
    status: 'Resolved (False alarm)',
    resolutionTime: '1m 24s',
    isSafe: true,
  },
  {
    id: 'SOS-7984',
    date: 'Yesterday, 06:14 PM',
    carpoolId: 'RIDE-1033',
    employee: 'Priya Rao',
    driver: 'Suresh Kumar',
    route: 'Cyber Towers → Miyapur',
    status: 'Resolved (Route deviation check)',
    resolutionTime: '2m 10s',
    isSafe: true,
  },
  {
    id: 'SOS-7740',
    date: '30 Sep, 09:05 AM',
    carpoolId: 'RIDE-0988',
    employee: 'Kavita Reddy',
    driver: 'Alex Mercer',
    route: 'Gachibowli → DLF',
    status: 'Resolved (Support verified)',
    resolutionTime: '1m 45s',
    isSafe: true,
  },
];

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { 
    companies, 
    currentCompany, 
    switchCompany, 
    auditLog, 
    carpools, 
    adminCancelRide 
  } = useStore();

  const [selectedSidebar, setSelectedSidebar] = useState<'overview' | 'dispatch' | 'corridors' | 'heatmap' | 'sos'>('overview');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedCarpoolForAssign, setSelectedCarpoolForAssign] = useState<Carpool | null>(null);

  // Search & Filter state for Dispatch Tab
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'in_transit' | 'completed' | 'cancelled'>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'women_only' | 'private'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleExportCSV = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' + [
      'Metric,Value,Unit',
      'Rides Shared,1428,rides',
      'Seat Utilization,78.5,%',
      'Distance Saved,42850,km',
      `CO2 Offset,${Math.round(42850 * currentCompany.co2_kg_per_km)},kg`,
      `Cost Saved,₹${Math.round(42850 * (22.0 - currentCompany.cost_per_km))},INR`,
    ].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `ridesync_${currentCompany.name.toLowerCase().replace(/\s+/g, '_')}_esg_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered rides for Dispatch View
  const filteredRides = carpools.filter((ride) => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'in_transit' && ride.status !== 'in_progress' && ride.status !== 'driver_arriving') return false;
      if (statusFilter === 'scheduled' && ride.status !== 'scheduled') return false;
      if (statusFilter === 'completed' && ride.status !== 'completed') return false;
      if (statusFilter === 'cancelled' && ride.status !== 'cancelled') return false;
    }
    if (visibilityFilter !== 'all' && ride.visibility !== visibilityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const hostMatch = ride.host_name.toLowerCase().includes(q);
      const originMatch = ride.origin_label.toLowerCase().includes(q);
      const destMatch = ride.dest_label.toLowerCase().includes(q);
      const memberMatch = ride.members.some((m) => m.passenger_name.toLowerCase().includes(q));
      if (!hostMatch && !originMatch && !destMatch && !memberMatch) return false;
    }
    return true;
  });

  // Calculate Dispatch Hub KPIs
  const totalRides = carpools.length;
  const scheduledCount = carpools.filter((c) => c.status === 'scheduled').length;
  const totalSeatsOffered = carpools.reduce((acc, c) => acc + c.seats_total, 0);
  const totalSeatsBooked = carpools.reduce((acc, c) => acc + c.members.length, 0);
  const preAssignedCount = carpools.reduce((acc, c) => acc + c.members.length, 0);
  const recurringCount = carpools.filter((c) => Boolean(c.recurrence_rule)).length;

  return (
    <div className="min-h-screen bg-[#F5FAFF] flex">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#0F1B2D] text-white px-4 py-3 rounded-2xl shadow-soft flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top border border-[#2B8CEB]/30">
          <CheckCircle2 className="w-4 h-4 text-[#22B07D]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Left Icon Sidebar (Desktop Layout) */}
      <aside className="w-16 sm:w-20 bg-white border-r border-[#E3ECF5] flex flex-col items-center py-5 justify-between shrink-0 shadow-xs">
        <div className="flex flex-col items-center gap-6">
          {/* Brand Logo */}
          <div
            onClick={() => navigate('/dashboard')}
            className="w-11 h-11 rounded-2xl bg-[#4DA8FF] text-[#0F1B2D] flex items-center justify-center font-black cursor-pointer shadow-xs hover:scale-105 transition-transform"
            title="RideSync Home"
          >
            <Car className="w-6 h-6 stroke-[2.2]" />
          </div>

          {/* Navigation Icons */}
          <nav className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedSidebar('overview')}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                selectedSidebar === 'overview'
                  ? 'bg-[#E8F3FF] text-[#2B8CEB] font-bold shadow-2xs'
                  : 'text-[#5B6B80] hover:bg-[#F5FAFF]'
              }`}
              title="Overview & ESG Analytics"
            >
              <LayoutDashboard className="w-5 h-5" strokeWidth={2} />
            </button>

            {/* NEW: Ride Dispatch & Fleet Management */}
            <button
              type="button"
              onClick={() => setSelectedSidebar('dispatch')}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all relative ${
                selectedSidebar === 'dispatch'
                  ? 'bg-[#E8F3FF] text-[#2B8CEB] font-bold shadow-2xs'
                  : 'text-[#5B6B80] hover:bg-[#F5FAFF]'
              }`}
              title="Ride Dispatch & Fleet Management"
            >
              <Send className="w-5 h-5" strokeWidth={2} />
              <span className="w-2 h-2 rounded-full bg-[#2B8CEB] absolute top-2.5 right-2.5 ring-2 ring-white" />
            </button>

            <button
              type="button"
              onClick={() => setSelectedSidebar('corridors')}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                selectedSidebar === 'corridors'
                  ? 'bg-[#E8F3FF] text-[#2B8CEB] font-bold shadow-2xs'
                  : 'text-[#5B6B80] hover:bg-[#F5FAFF]'
              }`}
              title="Top Corridors"
            >
              <MapPin className="w-5 h-5" strokeWidth={2} />
            </button>

            <button
              type="button"
              onClick={() => setSelectedSidebar('heatmap')}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                selectedSidebar === 'heatmap'
                  ? 'bg-[#E8F3FF] text-[#2B8CEB] font-bold shadow-2xs'
                  : 'text-[#5B6B80] hover:bg-[#F5FAFF]'
              }`}
              title="Peak Hours Heatmap"
            >
              <Clock className="w-5 h-5" strokeWidth={2} />
            </button>

            <button
              type="button"
              onClick={() => setSelectedSidebar('sos')}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                selectedSidebar === 'sos'
                  ? 'bg-[#FFEBEB] text-[#E5484D] font-bold shadow-2xs'
                  : 'text-[#5B6B80] hover:bg-[#F5FAFF]'
              }`}
              title="SOS & Audit Logs"
            >
              <ShieldAlert className="w-5 h-5" strokeWidth={2} />
            </button>

            {/* PostgreSQL & PostGIS Console Link */}
            <button
              type="button"
              onClick={() => navigate('/database')}
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-[#2B8CEB] hover:bg-[#E8F3FF] transition-all"
              title="PostgreSQL 15+ Schema & PostGIS Console"
            >
              <Database className="w-5 h-5" strokeWidth={2} />
            </button>
          </nav>
        </div>

        {/* Back to Commute App */}
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-[#5B6B80] hover:text-[#0F1B2D] hover:bg-[#F5FAFF] transition-all"
          title="Return to User Commute"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 p-5 sm:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase font-bold px-2.5 py-0.5 rounded-full bg-[#E8F3FF] text-[#2B8CEB]">
                Enterprise Console
              </span>
              <div className="flex items-center gap-1.5 bg-white border border-[#E3ECF5] px-2.5 py-0.5 rounded-full shadow-2xs">
                <Building className="w-3.5 h-3.5 text-[#2B8CEB]" />
                <select
                  value={currentCompany.id}
                  onChange={(e) => switchCompany(e.target.value)}
                  className="bg-transparent text-xs font-bold text-[#0F1B2D] focus:outline-none cursor-pointer"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-xs text-[#5B6B80]">
                Rate: ₹{currentCompany.cost_per_km}/km • {currentCompany.co2_kg_per_km} kg CO₂/km
              </span>
            </div>

            <h1 className="text-24 sm:text-28 font-bold text-[#0F1B2D] tracking-tight mt-1">
              {selectedSidebar === 'dispatch' 
                ? 'Ride Dispatch & Fleet Management'
                : selectedSidebar === 'corridors'
                ? 'Corporate Commute Corridors'
                : selectedSidebar === 'heatmap'
                ? 'Traffic & Commute Heatmap'
                : selectedSidebar === 'sos'
                ? 'SOS Safety & Audit Trails'
                : 'Admin & ESG Analytics'}
            </h1>
            <p className="text-xs text-[#5B6B80]">
              {selectedSidebar === 'dispatch'
                ? 'Schedule and dispatch corporate rides for employees, pre-book commuters, and monitor live vehicle allocation.'
                : 'Real-time seat efficiency, carbon offset reduction, corridor loads, and emergency logs.'}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            {/* Primary Action: Create Ride for Employee */}
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 shadow-soft font-bold bg-[#4DA8FF] text-[#0F1B2D] hover:bg-[#2B8CEB]"
            >
              <Send className="w-4 h-4 stroke-[2.2]" />
              <span>+ Create Ride for Employee</span>
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/database')}
              className="flex items-center gap-2"
            >
              <Database className="w-4 h-4 text-[#2B8CEB]" />
              <span className="hidden sm:inline">SQL Console</span>
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={handleExportCSV}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-[#2B8CEB]" />
              <span>Export</span>
            </Button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* VIEW 1: DISPATCH & FLEET MANAGEMENT TAB                  */}
        {/* ======================================================== */}
        {selectedSidebar === 'dispatch' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Dispatch Hub KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <KPICard
                label="Total Corporate Rides"
                value={totalRides.toString()}
                unit="rides"
                change={`${scheduledCount} scheduled`}
                isPositive={true}
                icon={Car}
                subtext="dispatched by company"
              />
              <KPICard
                label="Seats Booked"
                value={`${totalSeatsBooked}/${totalSeatsOffered}`}
                unit="seats"
                change={`${Math.round((totalSeatsBooked / Math.max(1, totalSeatsOffered)) * 100)}%`}
                isPositive={true}
                icon={Users}
                subtext="occupancy rate"
              />
              <KPICard
                label="Pre-Assigned Riders"
                value={preAssignedCount.toString()}
                unit="employees"
                change="Direct bookings"
                isPositive={true}
                icon={CheckCircle2}
                subtext="dispatched by admin"
              />
              <KPICard
                label="Weekday Shuttles"
                value={recurringCount.toString()}
                unit="routes"
                change="RRULE Active"
                isPositive={true}
                icon={Repeat}
                subtext="corporate recurring"
              />
            </div>

            {/* Quick Dispatch Banner */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-[#E8F3FF] via-white to-[#F5FAFF] border border-[#2B8CEB]/20 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#4DA8FF] text-[#0F1B2D] flex items-center justify-center shadow-xs shrink-0">
                  <Sparkles className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F1B2D]">
                    Automated Corporate Dispatch & Shift Scheduling
                  </h3>
                  <p className="text-xs text-[#5B6B80]">
                    Select any verified employee to host a ride, pre-assign commuters, set women-only compliance, or schedule recurring vanpools.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-2.5 rounded-2xl bg-[#0F1B2D] text-white hover:bg-[#2B8CEB] text-xs font-bold transition-all shadow-xs shrink-0 flex items-center gap-2 self-start md:self-auto"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Launch Ride Dispatcher</span>
              </button>
            </div>

            {/* Search and Filters Toolbar */}
            <div className="bg-white border border-[#E3ECF5] rounded-2xl p-4 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#5B6B80] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by driver, rider, or corridor..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#F5FAFF] border border-[#E3ECF5] text-xs text-[#0F1B2D] focus:outline-none focus:border-[#2B8CEB]"
                />
              </div>

              {/* Status and Visibility Selectors */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-[#F5FAFF] p-1 rounded-xl border border-[#E3ECF5] text-xs">
                  <span className="text-[10px] font-bold text-[#5B6B80] px-1">Status:</span>
                  {(['all', 'scheduled', 'completed', 'cancelled'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatusFilter(s)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold capitalize transition-all ${
                        statusFilter === s
                          ? 'bg-[#4DA8FF] text-[#0F1B2D] font-bold shadow-2xs'
                          : 'text-[#5B6B80] hover:text-[#0F1B2D]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 bg-[#F5FAFF] p-1 rounded-xl border border-[#E3ECF5] text-xs">
                  <span className="text-[10px] font-bold text-[#5B6B80] px-1">Policy:</span>
                  {(['all', 'public', 'women_only', 'private'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVisibilityFilter(v)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold capitalize transition-all ${
                        visibilityFilter === v
                          ? 'bg-[#4DA8FF] text-[#0F1B2D] font-bold shadow-2xs'
                          : 'text-[#5B6B80] hover:text-[#0F1B2D]'
                      }`}
                    >
                      {v === 'women_only' ? 'Women-Only' : v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Corporate Rides Table */}
            <div className="bg-white border border-[#E3ECF5] rounded-3xl p-5 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0F1B2D]">Corporate Rides ({filteredRides.length})</h3>
                  <p className="text-xs text-[#5B6B80]">Live and scheduled carpools with passenger assignments and secret pickup codes</p>
                </div>
                <Badge variant="neutral">{filteredRides.length} Total</Badge>
              </div>

              {filteredRides.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#E8F3FF] text-[#2B8CEB] flex items-center justify-center mx-auto">
                    <Car className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-[#0F1B2D]">No corporate rides found matching criteria</p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="mx-auto"
                  >
                    + Create First Ride
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRides.map((ride) => {
                    const isWomenOnly = ride.visibility === 'women_only';
                    const hasOpenSeats = ride.seats_available > 0 && ride.status !== 'cancelled' && ride.status !== 'completed';

                    return (
                      <div
                        key={ride.id}
                        className="p-4 rounded-2xl border border-[#E3ECF5] hover:border-[#2B8CEB]/30 hover:bg-[#F5FAFF]/50 transition-all space-y-3"
                      >
                        {/* Top row: ID, Host, Status & Visibility */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={ride.host_name}
                              image={ride.host_photo}
                              size="md"
                              isWomenOnly={ride.host_gender === 'female'}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-[#0F1B2D]">{ride.host_name}</span>
                                <span className="text-[10px] text-[#5B6B80] bg-[#F5FAFF] px-2 py-0.2 rounded-full border border-[#E3ECF5]">
                                  {ride.host_employee_id}
                                </span>
                                {ride.recurrence_rule && (
                                  <span className="text-[10px] font-bold text-[#2B8CEB] bg-[#E8F3FF] px-2 py-0.2 rounded-full flex items-center gap-1">
                                    <Repeat className="w-3 h-3" /> Shuttle
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#5B6B80]">
                                Vehicle: <span className="font-semibold text-[#0F1B2D]">{ride.vehicle?.make} {ride.vehicle?.model}</span> ({ride.vehicle?.reg_no || 'Corp Fleet'})
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                            <span className="font-mono text-[11px] text-[#5B6B80]">{ride.id}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isWomenOnly
                                ? 'bg-[#F3ECFF] text-[#B084F5] border border-[#B084F5]/30'
                                : ride.visibility === 'private'
                                ? 'bg-[#E8F3FF] text-[#2B8CEB] border border-[#2B8CEB]/30'
                                : 'bg-[#EBFBF5] text-[#22B07D]'
                            }`}>
                              {ride.visibility.replace('_', ' ')}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              ride.status === 'scheduled'
                                ? 'bg-[#E8F3FF] text-[#2B8CEB]'
                                : ride.status === 'in_progress'
                                ? 'bg-[#FFF7E8] text-[#D97706]'
                                : ride.status === 'completed'
                                ? 'bg-[#EBFBF5] text-[#22B07D]'
                                : 'bg-[#FFEBEB] text-[#E5484D]'
                            }`}>
                              {ride.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        {/* Middle row: Corridor & Timing */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-[#F5FAFF] border border-[#E3ECF5] text-xs">
                          <div>
                            <span className="text-[10px] text-[#5B6B80] uppercase block">Corridor</span>
                            <span className="font-bold text-[#0F1B2D] flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-[#2B8CEB] shrink-0" />
                              <span className="truncate">{ride.origin_label.split('/')[0]} → {ride.dest_label.split(',')[0]}</span>
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-[#5B6B80] uppercase block">Departure</span>
                            <span className="font-bold text-[#0F1B2D] flex items-center gap-1 mt-0.5">
                              <Clock className="w-3.5 h-3.5 text-[#2B8CEB] shrink-0" />
                              <span>{ride.start_time} ({ride.distance_km} km, ~{ride.duration_min}m)</span>
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-[#5B6B80] uppercase block">Capacity</span>
                            <span className="font-bold text-[#0F1B2D] flex items-center gap-1 mt-0.5">
                              <Users className="w-3.5 h-3.5 text-[#2B8CEB] shrink-0" />
                              <span className={ride.seats_available === 0 ? 'text-[#D97706]' : 'text-[#22B07D]'}>
                                {ride.members.length} booked / {ride.seats_total} total ({ride.seats_available} open)
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Bottom row: Pre-assigned Passengers and Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                          {/* Booked Members List */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-semibold text-[#5B6B80]">Booked Riders:</span>
                            {ride.members.length === 0 ? (
                              <span className="text-[11px] text-[#5B6B80] italic">None pre-assigned (open for self-service)</span>
                            ) : (
                              ride.members.map((member) => (
                                <div
                                  key={member.id}
                                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-[#E3ECF5] text-xs shadow-2xs"
                                  title={`Pickup Code: ${member.pickup_code}`}
                                >
                                  <Avatar
                                    name={member.passenger_name}
                                    image={member.passenger_photo}
                                    size="sm"
                                    isWomenOnly={member.passenger_gender === 'female'}
                                  />
                                  <span className="font-bold text-[11px] text-[#0F1B2D]">{member.passenger_name.split(' ')[0]}</span>
                                  <span className="font-mono text-[10px] font-bold text-[#2B8CEB] bg-[#E8F3FF] px-1.5 py-0.2 rounded">
                                    🔑 {member.pickup_code}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            {hasOpenSeats && (
                              <button
                                type="button"
                                onClick={() => setSelectedCarpoolForAssign(ride)}
                                className="px-3 py-1.5 rounded-xl bg-[#E8F3FF] text-[#2B8CEB] hover:bg-[#2B8CEB] hover:text-white text-xs font-bold transition-all flex items-center gap-1"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Assign Rider</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => navigate(`/live/${ride.id}`)}
                              className="px-3 py-1.5 rounded-xl bg-[#F5FAFF] border border-[#E3ECF5] text-[#0F1B2D] hover:bg-[#E8F3FF] text-xs font-bold transition-all flex items-center gap-1"
                            >
                              <Compass className="w-3.5 h-3.5 text-[#2B8CEB]" />
                              <span>Live Tracker</span>
                            </button>

                            {ride.status !== 'cancelled' && ride.status !== 'completed' && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to cancel ride ${ride.id} hosted by ${ride.host_name}?`)) {
                                    adminCancelRide(ride.id, 'Cancelled by Corporate Safety Admin');
                                    showToast(`Ride ${ride.id} has been cancelled.`);
                                  }
                                }}
                                className="p-1.5 rounded-xl text-[#5B6B80] hover:text-[#E5484D] hover:bg-[#FFEBEB] transition-colors"
                                title="Cancel Ride"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Corporate Dispatch Audit Log Entries */}
            <div className="bg-white border border-[#E3ECF5] rounded-3xl p-5 shadow-soft space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#2B8CEB]" />
                  <h3 className="text-sm font-bold text-[#0F1B2D]">Dispatch Audit Trail</h3>
                </div>
                <span className="text-[11px] text-[#5B6B80]">Logged to PostgreSQL `audit_log`</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E3ECF5] text-[#5B6B80] font-semibold uppercase text-[10px]">
                      <th className="py-2 px-3">Log ID</th>
                      <th className="py-2 px-3">Admin</th>
                      <th className="py-2 px-3">Action</th>
                      <th className="py-2 px-3">Details</th>
                      <th className="py-2 px-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3ECF5]">
                    {auditLog
                      .filter((e) => e.action.startsWith('ADMIN_'))
                      .slice(0, 6)
                      .map((entry) => (
                        <tr key={entry.id} className="hover:bg-[#F5FAFF]">
                          <td className="py-2.5 px-3 font-mono font-bold text-[#2B8CEB]">{entry.id}</td>
                          <td className="py-2.5 px-3 font-semibold text-[#0F1B2D]">{entry.actor_name || 'Admin'}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#E8F3FF] text-[#2B8CEB]">
                              {entry.action}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[#0F1B2D] max-w-md truncate">{entry.details}</td>
                          <td className="py-2.5 px-3 text-[#5B6B80] whitespace-nowrap">{new Date(entry.created_at).toLocaleTimeString()}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: OVERVIEW & ESG ANALYTICS TAB                     */}
        {/* ======================================================== */}
        {selectedSidebar === 'overview' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Top Row: 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                label="Rides Shared"
                value="1,428"
                unit="trips"
                change="+18.4%"
                isPositive={true}
                icon={Car}
                subtext="vs last month"
              />
              <KPICard
                label="Seat Utilization"
                value="78.5"
                unit="%"
                change="+5.2%"
                isPositive={true}
                icon={Users}
                subtext="average occupancy"
              />
              <KPICard
                label="Km Saved"
                value="42,850"
                unit="km"
                change="+12.6%"
                isPositive={true}
                icon={TrendingUp}
                subtext="solo travel avoided"
              />
              <KPICard
                label="CO2 Saved"
                value="5,142"
                unit="kg"
                change="+24.1%"
                isPositive={true}
                icon={Leaf}
                subtext="Scope 3 emissions cut"
              />
            </div>

            {/* Quick Dispatch Highlight Card */}
            <div className="p-5 rounded-3xl bg-white border border-[#E3ECF5] shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#E8F3FF] text-[#2B8CEB] flex items-center justify-center">
                  <Send className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F1B2D]">Corporate Ride Dispatcher</h3>
                  <p className="text-xs text-[#5B6B80]">
                    Need to provision a ride for an executive, late-night shift team, or inter-campus transit?
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>+ Create Ride</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedSidebar('dispatch')}
                >
                  <span>Manage All Rides ({carpools.length})</span>
                </Button>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Light-Blue Area Chart */}
              <div className="lg:col-span-7 bg-white border border-[#E3ECF5] rounded-3xl p-5 shadow-soft space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#0F1B2D]">Weekly Commute Volume</h3>
                    <p className="text-xs text-[#5B6B80]">Daily completed carpools along tech corridors</p>
                  </div>
                  <Badge variant="status">Mon – Fri</Badge>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="blueArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4DA8FF" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#4DA8FF" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="day"
                        stroke="#5B6B80"
                        fontSize={12}
                        tickLine={false}
                        axisLine={{ stroke: '#E3ECF5' }}
                      />
                      <YAxis
                        stroke="#5B6B80"
                        fontSize={12}
                        tickLine={false}
                        axisLine={{ stroke: '#E3ECF5' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '12px',
                          border: '1px solid #E3ECF5',
                          boxShadow: '0 4px 20px rgba(43,140,235,0.10)',
                          fontSize: '12px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="rides"
                        stroke="#2B8CEB"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#blueArea)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart for Top Corridors */}
              <div className="lg:col-span-5 bg-white border border-[#E3ECF5] rounded-3xl p-5 shadow-soft space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#0F1B2D]">Top Commute Corridors</h3>
                    <p className="text-xs text-[#5B6B80]">Monthly trips per corporate lane</p>
                  </div>
                  <Badge variant="neutral">Ranked</Badge>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={CORRIDOR_DATA} layout="vertical" margin={{ top: 5, right: 15, left: 35, bottom: 5 }}>
                      <XAxis type="number" stroke="#5B6B80" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis
                        dataKey="corridor"
                        type="category"
                        stroke="#0F1B2D"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        width={100}
                        tickFormatter={(val) => val.split('→')[0].trim()}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '12px',
                          border: '1px solid #E3ECF5',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="trips" fill="#4DA8FF" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Peak-Hours Heatmap in Blue Shades */}
            <div className="bg-white border border-[#E3ECF5] rounded-3xl p-5 shadow-soft space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[#0F1B2D]">Peak Hours Commute Heatmap</h3>
                  <p className="text-xs text-[#5B6B80]">Traffic concentration and carpooling density across commute windows</p>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-[#5B6B80]">
                  <span>Low</span>
                  <div className="w-3.5 h-3.5 rounded bg-[#E8F3FF]" />
                  <div className="w-3.5 h-3.5 rounded bg-[#BEE0FF]" />
                  <div className="w-3.5 h-3.5 rounded bg-[#4DA8FF]" />
                  <div className="w-3.5 h-3.5 rounded bg-[#2B8CEB]" />
                  <span>Peak</span>
                </div>
              </div>

              <div className="overflow-x-auto pb-2">
                <div className="min-w-[620px] space-y-2">
                  <div className="grid grid-cols-10 gap-2 text-center text-[11px] font-semibold text-[#5B6B80]">
                    <div className="text-left font-bold text-[#0F1B2D]">Day</div>
                    {HEATMAP_HOURS.map((h) => (
                      <div key={h}>{h}</div>
                    ))}
                  </div>

                  {HEATMAP_DAYS.map((day) => {
                    const values = HEATMAP_VALUES[day] || [];
                    return (
                      <div key={day} className="grid grid-cols-10 gap-2 items-center">
                        <span className="text-xs font-bold text-[#0F1B2D] text-left">{day}</span>
                        {values.map((v, idx) => (
                          <div
                            key={idx}
                            className={`h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all shadow-2xs ${getHeatColor(
                              v
                            )}`}
                            title={`${day} at ${HEATMAP_HOURS[idx]}: Intensity Level ${v}`}
                          >
                            {v > 2 ? `${v * 24}` : ''}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 3: CORRIDORS TAB                                    */}
        {/* ======================================================== */}
        {selectedSidebar === 'corridors' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white border border-[#E3ECF5] rounded-3xl p-6 shadow-soft space-y-5">
              <div>
                <h3 className="text-base font-bold text-[#0F1B2D]">Corporate Commute Corridors</h3>
                <p className="text-xs text-[#5B6B80]">High-volume lanes optimized for PostGIS route proximity matching</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CORRIDOR_DATA.map((c, idx) => (
                  <div key={c.corridor} className="p-4 rounded-2xl bg-[#F5FAFF] border border-[#E3ECF5] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#2B8CEB] uppercase">Rank #{idx + 1}</span>
                      <h4 className="text-sm font-bold text-[#0F1B2D]">{c.corridor}</h4>
                      <p className="text-xs text-[#5B6B80] mt-0.5">{c.trips} monthly carpools completed</p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsCreateModalOpen(true)}
                    >
                      Dispatch Here
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 4: HEATMAP TAB                                      */}
        {/* ======================================================== */}
        {selectedSidebar === 'heatmap' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white border border-[#E3ECF5] rounded-3xl p-6 shadow-soft space-y-4">
              <h3 className="text-base font-bold text-[#0F1B2D]">Detailed Peak-Hours Heatmap</h3>
              <p className="text-xs text-[#5B6B80]">Monitor employee arrival patterns to strategically schedule corporate shuttle departures.</p>
              
              <div className="overflow-x-auto pt-4 pb-2">
                <div className="min-w-[620px] space-y-3">
                  <div className="grid grid-cols-10 gap-2 text-center text-[11px] font-semibold text-[#5B6B80]">
                    <div className="text-left font-bold text-[#0F1B2D]">Day</div>
                    {HEATMAP_HOURS.map((h) => (
                      <div key={h}>{h}</div>
                    ))}
                  </div>

                  {HEATMAP_DAYS.map((day) => {
                    const values = HEATMAP_VALUES[day] || [];
                    return (
                      <div key={day} className="grid grid-cols-10 gap-2 items-center">
                        <span className="text-xs font-bold text-[#0F1B2D] text-left">{day}</span>
                        {values.map((v, idx) => (
                          <div
                            key={idx}
                            className={`h-11 rounded-2xl flex items-center justify-center text-xs font-bold transition-all shadow-2xs ${getHeatColor(
                              v
                            )}`}
                          >
                            {v * 28}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 5: SOS & AUDIT LOGS TAB                             */}
        {/* ======================================================== */}
        {selectedSidebar === 'sos' && (
          <div className="space-y-6 animate-in fade-in">
            {/* SOS Table */}
            <div className="bg-white border border-[#E3ECF5] rounded-3xl p-5 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FFEBEB] text-[#E5484D] flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0F1B2D]">SOS Emergency Incident Audit</h3>
                    <p className="text-xs text-[#5B6B80]">100% telemetry resolution compliance with Corporate Safety Desk</p>
                  </div>
                </div>
                <Badge variant="success">All Safe</Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E3ECF5] text-[#5B6B80] font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Alert ID</th>
                      <th className="py-2.5 px-3">Date & Time</th>
                      <th className="py-2.5 px-3">Rider / Host</th>
                      <th className="py-2.5 px-3">Corridor</th>
                      <th className="py-2.5 px-3">Response Time</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3ECF5]">
                    {SOS_LOGS.map((log) => (
                      <tr key={log.id} className="hover:bg-[#F5FAFF] transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-[#2B8CEB]">{log.id}</td>
                        <td className="py-3 px-3 text-[#5B6B80]">{log.date}</td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-[#0F1B2D] block">{log.employee}</span>
                          <span className="text-[11px] text-[#5B6B80]">Driver: {log.driver}</span>
                        </td>
                        <td className="py-3 px-3 text-[#0F1B2D]">{log.route}</td>
                        <td className="py-3 px-3 font-semibold text-[#22B07D]">{log.resolutionTime}</td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#22B07D] bg-[#EBFBF5] px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PostgreSQL Audit Log */}
            <div className="bg-white border border-[#E3ECF5] rounded-3xl p-5 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#E8F3FF] text-[#2B8CEB] flex items-center justify-center">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0F1B2D]">Database Audit Trail (audit_log)</h3>
                    <p className="text-xs text-[#5B6B80]">Immutable system events, admin ride creations, and policy triggers</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/database')}
                  className="text-xs font-bold text-[#2B8CEB] hover:underline flex items-center gap-1"
                >
                  <span>Explore PostGIS & Full Database</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E3ECF5] text-[#5B6B80] font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Log ID</th>
                      <th className="py-2.5 px-3">Actor</th>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">Entity</th>
                      <th className="py-2.5 px-3">Details</th>
                      <th className="py-2.5 px-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3ECF5]">
                    {auditLog.slice(0, 10).map((entry) => (
                      <tr key={entry.id} className="hover:bg-[#F5FAFF] transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#2B8CEB]">{entry.id}</td>
                        <td className="py-2.5 px-3 font-semibold text-[#0F1B2D]">{entry.actor_name || 'System'}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[#F5FAFF] border border-[#E3ECF5] text-[#2B8CEB]">
                            {entry.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[#5B6B80]">{entry.entity}</td>
                        <td className="py-2.5 px-3 text-[#0F1B2D]">{entry.details}</td>
                        <td className="py-2.5 px-3 text-[#5B6B80] whitespace-nowrap">{new Date(entry.created_at).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Admin Create Ride for Employee Modal */}
      <AdminCreateRideModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(rideId) => {
          showToast(`Successfully dispatched corporate ride ${rideId}!`);
          setSelectedSidebar('dispatch');
        }}
      />

      {/* Admin Assign Rider Modal */}
      <AdminAssignRiderModal
        isOpen={Boolean(selectedCarpoolForAssign)}
        carpool={selectedCarpoolForAssign}
        onClose={() => setSelectedCarpoolForAssign(null)}
        onSuccess={() => {
          showToast('Passenger successfully assigned with secret pickup code!');
        }}
      />
    </div>
  );
};
