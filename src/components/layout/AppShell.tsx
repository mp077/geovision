import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '../common/Toast';
import { X } from 'lucide-react';

export const AppShell: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F9F8F5]">
      {/* Desktop Persistent Left Sidebar */}
      <div className="hidden lg:block w-64 xl:w-72 flex-shrink-0 h-full">
        <Sidebar />
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar Slide-over */}
      <div
        className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] z-50 lg:hidden transform transition-transform duration-300 ease-in-out bg-[#F4F2EB] shadow-2xl ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="relative h-full flex flex-col">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-[#6E7781] hover:text-[#1C2127] bg-[#EBE7DE] z-10"
            aria-label="Close mobile navigation"
          >
            <X className="w-5 h-5" />
          </button>
          <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Toast Container */}
      <ToastContainer />
    </div>
  );
};
