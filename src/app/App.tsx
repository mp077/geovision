import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SpecimenProvider } from '../context/SpecimenContext';
import { AppShell } from '../components/layout/AppShell';
import { OverviewPage } from '../pages/OverviewPage';
import { IdentifyPage } from '../pages/IdentifyPage';
import { LiveScannerPage } from '../pages/LiveScannerPage';
import { HistoryPage } from '../pages/HistoryPage';
import { SettingsPage } from '../pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <SpecimenProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<OverviewPage />} />
            <Route path="identify" element={<IdentifyPage />} />
            <Route path="scanner" element={<LiveScannerPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SpecimenProvider>
  );
};

export default App;
