import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { StoreProvider } from './lib/store';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { DemoBanner } from './components/DemoBanner';
import { NotificationCenter } from './components/NotificationCenter';

// Pages
import { Dashboard } from './pages/Dashboard';
import { HostRide } from './pages/HostRide';
import { FindRide } from './pages/FindRide';
import { LiveTrip } from './pages/LiveTrip';
import { Requests } from './pages/Requests';
import { Alerts } from './pages/Alerts';
import { AdminDashboard } from './pages/AdminDashboard';
import { Profile } from './pages/Profile';
import { RideDetails } from './pages/RideDetails';
import { DatabaseExplorer } from './pages/DatabaseExplorer';

export const AppContent: React.FC = () => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-[#F5FAFF] text-[#0F1B2D] flex flex-col font-sans selection:bg-[#4DA8FF] selection:text-[#0F1B2D]">
      {/* Hackathon Demo Guide Floating Banner */}
      {!isAdmin && <DemoBanner />}

      {/* Top Navbar (Hidden on Admin Desktop Layout) */}
      {!isAdmin && <Navbar onOpenNotifications={() => setNotificationsOpen(true)} />}

      {/* Main Content Area (Edge-to-edge for map-first screens) */}
      <main className="flex-1 w-full flex flex-col min-h-0 relative">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/host" element={<HostRide />} />
          <Route path="/find" element={<FindRide />} />
          <Route path="/matches" element={<Navigate to="/find" replace />} />
          <Route path="/carpool/:id" element={<RideDetails />} />
          <Route path="/live" element={<LiveTrip />} />
          <Route path="/live/:id" element={<LiveTrip />} />
          <Route path="/rides" element={<Navigate to="/requests" replace />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/database" element={<DatabaseExplorer />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

      {/* 4-Item Bottom Navigation Bar (Hidden on Admin Desktop Layout) */}
      {!isAdmin && <BottomNav />}

      {/* In-App Notifications Drawer */}
      <NotificationCenter
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </BrowserRouter>
  );
};

export default App;
