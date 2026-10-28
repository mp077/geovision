import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Compass,
  Scan,
  Camera,
  History,
  Settings,
  Layers,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
}

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: Compass, exact: true },
  { to: '/identify', label: 'Identify Specimen', icon: Scan },
  { to: '/scanner', label: 'Live Scanner', icon: Camera },
  { to: '/history', label: 'Specimen History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  return (
    <aside className="h-full flex flex-col justify-between bg-[#F4F2EB] border-r border-[#E5E2DA] select-none text-[#1C2127]">
      {/* Brand Header */}
      <div>
        <div className="p-4 border-b border-[#E8E4DA] bg-[#FAF9F6]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2B5742] text-white flex items-center justify-center">
              <Layers className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif-title font-semibold text-base text-[#1C2127]">
                  GeoVision
                </span>
                <span className="font-mono-data text-[10px] font-bold text-[#2B5742] bg-[#EBF3EE] px-1 py-0.2 rounded border border-[#CCE2D5]">
                  AI
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="p-2 space-y-0.5" aria-label="Main Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-[#2B5742] text-white'
                      : 'text-[#3E454F] hover:bg-[#EBE7DE] hover:text-[#1C2127]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive
                            ? 'text-white'
                            : 'text-[#656E7B] group-hover:text-[#1C2127]'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {isActive ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-white opacity-90" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-[#B8B2A6] opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer - Clean & Minimal */}
      <div className="p-3 border-t border-[#E8E4DA] bg-[#FAF9F6]">
        <div className="flex items-center justify-between text-[11px] font-mono-data text-[#6E7781]">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
            Demo Mode
          </span>
          <span className="text-[#8C959F]">v0.9.4</span>
        </div>
      </div>
    </aside>
  );
};
