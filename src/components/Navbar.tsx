import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Car, 
  Bell, 
  Menu, 
  X, 
  ChevronRight,
  Database
} from 'lucide-react';
import { useStore } from '../lib/store';
import { Avatar } from './ui/Avatar';

export const Navbar: React.FC<{ onOpenNotifications: () => void }> = ({ onOpenNotifications }) => {
  const { currentUser, switchUser, toggleRole, notifications, activeCarpoolId, carpools } = useStore();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read && n.user_id === currentUser.id).length;
  const activeCarpool = carpools.find((c) => c.id === activeCarpoolId);
  const isHost = currentUser.current_role === 'host';

  const navLinks = [
    { label: 'Commute', path: '/dashboard' },
    { label: isHost ? 'Host' : 'Find', path: isHost ? '/host' : '/find' },
    {
      label: 'Live',
      path: activeCarpool ? `/live/${activeCarpool.id}` : '/live',
      isLive: Boolean(
        activeCarpool && activeCarpool.status !== 'completed' && activeCarpool.status !== 'cancelled'
      ),
    },
    { label: 'Rides', path: '/requests' },
    { label: 'Alerts', path: '/alerts' },
    { label: 'Admin', path: '/admin' },
    { label: 'SQL Schema', path: '/database', isDb: true },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E3ECF5] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand */}
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-2xl bg-[#4DA8FF] flex items-center justify-center shadow-xs group-hover:bg-[#2B8CEB] transition-colors">
                <Car className="w-5 h-5 text-[#0F1B2D] stroke-[2.2]" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-[#0F1B2D]">
                  Ride<span className="text-[#2B8CEB]">Sync</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F3FF] text-[#2B8CEB] border border-[#2B8CEB]/20">
                  CORP
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all relative flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#E8F3FF] text-[#2B8CEB] font-bold'
                        : link.isDb
                        ? 'text-[#2B8CEB] bg-[#E8F3FF]/50 hover:bg-[#E8F3FF] border border-[#2B8CEB]/20'
                        : 'text-[#5B6B80] hover:text-[#0F1B2D] hover:bg-[#F5FAFF]'
                    }`}
                  >
                    {link.isDb && <Database className="w-3.5 h-3.5 text-[#2B8CEB]" />}
                    <span>{link.label}</span>
                    {link.isLive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4DA8FF] animate-ping absolute top-1 right-1" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Mode Toggle + Persona Switcher */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Mode Switcher */}
            <div className="flex items-center bg-[#F5FAFF] p-1 rounded-full border border-[#E3ECF5]">
              <button
                type="button"
                onClick={() => {
                  if (isHost) toggleRole();
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  !isHost
                    ? 'bg-[#4DA8FF] text-[#0F1B2D] shadow-xs'
                    : 'text-[#5B6B80] hover:text-[#0F1B2D]'
                }`}
              >
                Rider
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isHost) toggleRole();
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  isHost
                    ? 'bg-[#4DA8FF] text-[#0F1B2D] shadow-xs'
                    : 'text-[#5B6B80] hover:text-[#0F1B2D]'
                }`}
              >
                Host
              </button>
            </div>

            {/* Demo Persona Switcher */}
            <div className="flex items-center gap-1 bg-[#F5FAFF] px-2 py-0.5 rounded-full border border-[#E3ECF5] text-xs">
              <span className="text-[10px] uppercase font-bold text-[#5B6B80] px-1">Demo:</span>
              <button
                type="button"
                onClick={() => switchUser('user-ananya')}
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all ${
                  currentUser.id === 'user-ananya'
                    ? 'bg-[#F3ECFF] text-[#B084F5] font-bold border border-[#B084F5]/30'
                    : 'text-[#5B6B80] hover:text-[#0F1B2D]'
                }`}
              >
                Ananya ♀
              </button>
              <button
                type="button"
                onClick={() => switchUser('user-priya')}
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all ${
                  currentUser.id === 'user-priya'
                    ? 'bg-[#E8F3FF] text-[#2B8CEB] font-bold border border-[#2B8CEB]/30'
                    : 'text-[#5B6B80] hover:text-[#0F1B2D]'
                }`}
              >
                Priya ♀
              </button>
              <button
                type="button"
                onClick={() => switchUser('user-rahul')}
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all ${
                  currentUser.id === 'user-rahul'
                    ? 'bg-[#E8F3FF] text-[#2B8CEB] font-bold border border-[#2B8CEB]/30'
                    : 'text-[#5B6B80] hover:text-[#0F1B2D]'
                }`}
              >
                Rahul ♂
              </button>
            </div>

            {/* Notification Bell */}
            <Link
              to="/alerts"
              className="relative p-2 rounded-xl text-[#5B6B80] hover:text-[#0F1B2D] hover:bg-[#F5FAFF] transition-colors"
              aria-label="Alerts"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#2B8CEB]" />
              )}
            </Link>

            {/* Profile Avatar */}
            <Link to="/profile" className="flex items-center gap-2 pl-2 border-l border-[#E3ECF5]">
              <Avatar
                name={currentUser.full_name}
                image={currentUser.photo_url}
                size="sm"
                isWomenOnly={currentUser.gender === 'female'}
              />
              <span className="text-xs font-bold text-[#0F1B2D]">
                {currentUser.full_name.split(' ')[0]}
              </span>
            </Link>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex lg:hidden items-center gap-2">
            <Link
              to="/alerts"
              className="relative p-2 rounded-xl text-[#5B6B80]"
              aria-label="Alerts"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#2B8CEB]" />
              )}
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#0F1B2D] hover:bg-[#F5FAFF]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-[#E3ECF5] px-4 pt-3 pb-4 space-y-3 shadow-soft animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-[#E3ECF5]">
            <div className="flex items-center gap-2.5">
              <Avatar
                name={currentUser.full_name}
                image={currentUser.photo_url}
                size="md"
                isWomenOnly={currentUser.gender === 'female'}
              />
              <div>
                <p className="text-xs font-bold text-[#0F1B2D]">{currentUser.full_name}</p>
                <p className="text-[10px] text-[#5B6B80]">
                  {currentUser.employee_id} • {currentUser.gender}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleRole}
              className="px-3 py-1 rounded-full text-xs font-bold bg-[#4DA8FF] text-[#0F1B2D]"
            >
              Mode: {isHost ? 'Host' : 'Rider'}
            </button>
          </div>

          {/* Persona quick switch */}
          <div>
            <p className="text-[10px] uppercase font-bold text-[#5B6B80] mb-1.5">
              Switch Persona:
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  switchUser('user-ananya');
                  setMobileMenuOpen(false);
                }}
                className={`p-2 rounded-xl text-left text-xs font-semibold border ${
                  currentUser.id === 'user-ananya'
                    ? 'bg-[#F3ECFF] border-[#B084F5] text-[#B084F5]'
                    : 'bg-[#F5FAFF] border-[#E3ECF5] text-[#5B6B80]'
                }`}
              >
                Ananya (Host ♀)
              </button>
              <button
                type="button"
                onClick={() => {
                  switchUser('user-priya');
                  setMobileMenuOpen(false);
                }}
                className={`p-2 rounded-xl text-left text-xs font-semibold border ${
                  currentUser.id === 'user-priya'
                    ? 'bg-[#E8F3FF] border-[#2B8CEB] text-[#2B8CEB]'
                    : 'bg-[#F5FAFF] border-[#E3ECF5] text-[#5B6B80]'
                }`}
              >
                Priya (Rider ♀)
              </button>
              <button
                type="button"
                onClick={() => {
                  switchUser('user-rahul');
                  setMobileMenuOpen(false);
                }}
                className={`p-2 rounded-xl text-left text-xs font-semibold border ${
                  currentUser.id === 'user-rahul'
                    ? 'bg-[#E8F3FF] border-[#2B8CEB] text-[#2B8CEB]'
                    : 'bg-[#F5FAFF] border-[#E3ECF5] text-[#5B6B80]'
                }`}
              >
                Rahul (Rider ♂)
              </button>
              <button
                type="button"
                onClick={() => {
                  switchUser('user-admin');
                  setMobileMenuOpen(false);
                }}
                className={`p-2 rounded-xl text-left text-xs font-semibold border ${
                  currentUser.id === 'user-admin'
                    ? 'bg-[#E8F3FF] border-[#2B8CEB] text-[#2B8CEB]'
                    : 'bg-[#F5FAFF] border-[#E3ECF5] text-[#5B6B80]'
                }`}
              >
                Admin Console
              </button>
            </div>
          </div>

          <div className="space-y-1 pt-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
                  link.isDb ? 'bg-[#E8F3FF] text-[#2B8CEB] font-bold' : 'text-[#0F1B2D] hover:bg-[#F5FAFF]'
                }`}
              >
                <span className="flex items-center gap-2">
                  {link.isDb && <Database className="w-3.5 h-3.5 text-[#2B8CEB]" />}
                  {link.label}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[#5B6B80]" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
