import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { useSpecimens } from '../../context/SpecimenContext';
import { CategoryBadge } from '../common/StatusBadge';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Overview',
  '/identify': 'Identify Specimen',
  '/scanner': 'Live Scanner',
  '/history': 'Specimen History',
  '/settings': 'Settings'
};

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { specimens, backendStatus, backendUrl } = useSpecimens();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pageTitle = ROUTE_TITLES[location.pathname] || 'GeoVision AI';

  // Filter search results across specimens
  const filteredSpecimens = searchQuery.trim()
    ? specimens.filter(
        s =>
          s.commonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.category.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <header className="sticky top-0 z-30 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#E5E2DA] px-4 sm:px-6 py-2.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-1.5 text-[#57606A] hover:text-[#1C2127] hover:bg-[#EBE7DE] rounded-lg transition-colors"
            aria-label="Open mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="font-serif-title text-base sm:text-lg font-semibold text-[#1C2127] truncate">
            {pageTitle}
          </h1>
        </div>

        {/* Center/Right: Search, Status, Notifications & User */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search bar */}
          <div ref={searchRef} className="relative hidden md:block w-48 lg:w-64">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-[#8C7D6B] absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search specimens..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                className="w-full text-xs pl-8 pr-7 py-1.5 bg-white border border-[#DDD8CD] rounded-lg text-[#1C2127] placeholder-[#8C959F] focus:outline-none focus:border-[#2B5742] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 text-[#8C959F] hover:text-[#1C2127]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Live Search dropdown */}
            {isSearchOpen && searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#DDD8CD] rounded-lg shadow-md overflow-hidden z-40 max-h-72 overflow-y-auto">
                {filteredSpecimens.length === 0 ? (
                  <div className="p-3 text-center text-xs text-[#6E7781]">
                    No specimens found
                  </div>
                ) : (
                  <div className="p-1.5 space-y-1 text-xs">
                    {filteredSpecimens.map(item => (
                      <div
                        key={item.id}
                        onClick={() => {
                          navigate('/history');
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="flex items-center gap-2.5 p-2 hover:bg-[#F4F2EB] rounded-md cursor-pointer transition-colors"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.commonName}
                          className="w-7 h-7 rounded object-cover border border-[#E5E2DA]"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[#1C2127] truncate">
                            {item.commonName}
                          </div>
                          <div className="text-[10px] text-[#6E7781] font-mono-data">
                            {item.id}
                          </div>
                        </div>
                        <CategoryBadge category={item.category} size="sm" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dataset Excel Quick Download */}
          <a
            href={`${backendUrl}/dataset/download`}
            target="_blank"
            rel="noopener noreferrer"
            download="geovision_dataset_manifest.xlsx"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border border-[#2B5742]/30 bg-[#2B5742]/10 hover:bg-[#2B5742]/20 text-[#2B5742] transition-colors"
            title="Download full geological dataset as Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Dataset .xlsx</span>
          </a>

          {/* Backend Status Pill */}
          <Link
            to="/settings"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono-data rounded-lg border border-[#E4E0D6] bg-white hover:bg-[#F7F5F0] transition-colors text-[#57606A]"
            title={`Backend Status: ${backendStatus} (${backendUrl})`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                backendStatus === 'connected'
                  ? 'bg-emerald-500'
                  : backendStatus === 'checking'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-red-500'
              }`}
            />
            <span className="font-medium text-[#1C2127]">
              {backendStatus === 'connected' ? 'API Online' : backendStatus === 'checking' ? 'Connecting...' : 'API Offline'}
            </span>
          </Link>

          {/* Notifications Dropdown */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 text-[#57606A] hover:text-[#1C2127] hover:bg-[#EBE7DE] rounded-lg transition-colors relative"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-[#DDD8CD] rounded-xl shadow-lg p-3 z-40 text-xs">
                <div className="font-semibold text-[#1C2127] pb-1.5 border-b border-[#F2EFE9] mb-2">
                  Notifications
                </div>
                <div className="space-y-1.5 text-[#57606A]">
                  <div className="p-2 bg-[#FAF8F5] rounded border border-[#EDE7DE]">
                    <span className="font-medium text-[#1C2127]">Demo Mode Active</span>
                    <p className="text-[11px] text-[#6E7781] mt-0.5">Using local specimen records.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar */}
          <div ref={userRef} className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-[#EBE7DE] transition-colors text-left"
              aria-label="User account menu"
            >
              <div className="w-7 h-7 rounded-full bg-[#2B5742] text-white flex items-center justify-center font-serif-title font-semibold text-xs">
                EV
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-[#DDD8CD] rounded-xl shadow-lg p-2 z-40 text-xs">
                <div className="p-2 border-b border-[#F2EFE9] mb-1">
                  <div className="font-semibold text-[#1C2127]">Dr. Eleanor Vance</div>
                  <div className="text-[10px] text-[#6E7781]">Petrology Lab</div>
                </div>
                <Link
                  to="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="block p-2 hover:bg-[#F4F2EB] rounded text-[#3E454F] hover:text-[#1C2127] transition-colors"
                >
                  Settings
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
