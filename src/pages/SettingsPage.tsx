import React, { useState, useEffect } from 'react';
import {
  Server,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sliders,
  Save
} from 'lucide-react';
import { useSpecimens } from '../context/SpecimenContext';

export const SettingsPage: React.FC = () => {
  const {
    defaultHistoryView,
    setDefaultHistoryView,
    measurementUnit,
    setMeasurementUnit,
    backendUrl,
    setBackendUrl,
    backendStatus,
    backendMessage,
    checkBackendConnection,
    resetSpecimens,
    clearCapturedFrames,
    addToast
  } = useSpecimens();

  const [localUrl, setLocalUrl] = useState(backendUrl);

  useEffect(() => {
    setLocalUrl(backendUrl);
  }, [backendUrl]);

  const handleSaveEndpoint = () => {
    setBackendUrl(localUrl);
    addToast('Saved', `Inference URL set to ${localUrl}`, 'info');
  };

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Page Header */}
      <div className="pb-2 border-b border-[#E5E2DA]">
        <h2 className="font-serif-title text-xl font-semibold text-[#1C2127]">
          Settings
        </h2>
      </div>

      {/* Model Integration */}
      <div className="bg-white border border-[#E5E2DA] rounded-xl p-4 sm:p-5 space-y-3.5 shadow-xs">
        <div className="flex items-center gap-2 pb-2.5 border-b border-[#F2EFE9]">
          <Server className="w-4 h-4 text-[#2B5742]" />
          <h3 className="font-serif-title font-semibold text-sm text-[#1C2127]">
            Inference Endpoint
          </h3>
        </div>

        <div className="space-y-2.5">
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <input
              type="text"
              value={localUrl}
              onChange={(e) => setLocalUrl(e.target.value)}
              placeholder="/api/v1 or https://your-backend.onrender.com/api/v1"
              className="flex-1 text-xs p-2 bg-[#FAF9F6] border border-[#DDD8CD] rounded-lg text-[#1C2127] font-mono-data focus:outline-none focus:border-[#2B5742]"
            />
            <button
              onClick={handleSaveEndpoint}
              className="px-3 py-1.5 bg-white hover:bg-[#F4F2EB] text-[#1C2127] border border-[#DDD8CD] rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <Save className="w-3.5 h-3.5 text-[#57606A]" />
              <span>Save</span>
            </button>
            <button
              onClick={checkBackendConnection}
              disabled={backendStatus === 'checking'}
              className="px-3.5 py-1.5 bg-[#2B5742] hover:bg-[#224635] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs whitespace-nowrap"
            >
              {backendStatus === 'checking' ? (
                <span>Pinging...</span>
              ) : (
                <span>Test Connection</span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#6E7781] text-[11px]">Quick Presets:</span>
            <button
              type="button"
              onClick={() => {
                const url = '/api/v1';
                setLocalUrl(url);
                setBackendUrl(url);
                addToast('Endpoint Updated', 'Switched to current domain (/api/v1)', 'info');
              }}
              className="px-2.5 py-1 rounded bg-[#EBF3EE] text-[#2B5742] hover:bg-[#D5EADF] font-semibold text-[11px] border border-[#CCE2D5]"
            >
              Current Host (/api/v1)
            </button>
            <button
              type="button"
              onClick={() => {
                const url = 'http://localhost:8000/api/v1';
                setLocalUrl(url);
                setBackendUrl(url);
                addToast('Endpoint Updated', 'Switched to localhost:8000', 'info');
              }}
              className="px-2.5 py-1 rounded bg-[#FAF9F6] border border-[#DDD8CD] text-[#57606A] hover:bg-[#F2EFE9] text-[11px]"
            >
              Localhost (8000)
            </button>
          </div>

          {/* Connection Status Box */}
          <div
            className={`p-2.5 rounded-lg border text-xs flex items-center gap-2.5 ${
              backendStatus === 'connected'
                ? 'bg-[#EBF3EE] text-[#204936] border-[#CCE2D5]'
                : backendStatus === 'checking'
                ? 'bg-[#FAF8F5] text-[#71685B] border-[#EDE7DE]'
                : 'bg-[#FAF8F3] text-[#6B5A40] border-[#F8DFC0]'
            }`}
          >
            {backendStatus === 'connected' ? (
              <CheckCircle2 className="w-4 h-4 text-[#2B5742] flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#9A5B13] flex-shrink-0" />
            )}
            <span className="font-medium text-[11px] truncate">{backendMessage}</span>
          </div>
        </div>
      </div>

      {/* Display Preferences */}
      <div className="bg-white border border-[#E5E2DA] rounded-xl p-4 sm:p-5 space-y-3.5 shadow-xs">
        <div className="flex items-center gap-2 pb-2.5 border-b border-[#F2EFE9]">
          <Sliders className="w-4 h-4 text-[#2B5742]" />
          <h3 className="font-serif-title font-semibold text-sm text-[#1C2127]">
            Display Preferences
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-[#FAF9F6] border border-[#EDE7DE] rounded-lg space-y-2">
            <span className="font-semibold text-[#1C2127] block">
              Default History View
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setDefaultHistoryView('grid');
                  addToast('Saved', 'Default view: Grid', 'info');
                }}
                className={`flex-1 py-1 px-2.5 rounded-lg border text-xs font-medium ${
                  defaultHistoryView === 'grid'
                    ? 'bg-[#2B5742] text-white border-[#2B5742]'
                    : 'bg-white text-[#57606A] border-[#DDD8CD]'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => {
                  setDefaultHistoryView('table');
                  addToast('Saved', 'Default view: Table', 'info');
                }}
                className={`flex-1 py-1 px-2.5 rounded-lg border text-xs font-medium ${
                  defaultHistoryView === 'table'
                    ? 'bg-[#2B5742] text-white border-[#2B5742]'
                    : 'bg-white text-[#57606A] border-[#DDD8CD]'
                }`}
              >
                Table
              </button>
            </div>
          </div>

          <div className="p-3 bg-[#FAF9F6] border border-[#EDE7DE] rounded-lg space-y-2">
            <span className="font-semibold text-[#1C2127] block">
              Measurement Units
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setMeasurementUnit('metric');
                  addToast('Saved', 'Unit: Metric', 'info');
                }}
                className={`flex-1 py-1 px-2.5 rounded-lg border text-xs font-medium ${
                  measurementUnit === 'metric'
                    ? 'bg-[#2B5742] text-white border-[#2B5742]'
                    : 'bg-white text-[#57606A] border-[#DDD8CD]'
                }`}
              >
                Metric (g/cm³)
              </button>
              <button
                onClick={() => {
                  setMeasurementUnit('imperial');
                  addToast('Saved', 'Unit: Imperial', 'info');
                }}
                className={`flex-1 py-1 px-2.5 rounded-lg border text-xs font-medium ${
                  measurementUnit === 'imperial'
                    ? 'bg-[#2B5742] text-white border-[#2B5742]'
                    : 'bg-white text-[#57606A] border-[#DDD8CD]'
                }`}
              >
                Imperial
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Session Data Reset */}
      <div className="bg-white border border-[#E5E2DA] rounded-xl p-4 sm:p-5 space-y-3.5 shadow-xs">
        <div className="flex items-center gap-2 pb-2.5 border-b border-[#F2EFE9]">
          <RotateCcw className="w-4 h-4 text-[#2B5742]" />
          <h3 className="font-serif-title font-semibold text-sm text-[#1C2127]">
            Data Management
          </h3>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-[#1C2127] font-medium">Reset Sample Collection</span>
          <button
            onClick={resetSpecimens}
            className="px-3 py-1 bg-white hover:bg-[#FAF6F6] text-[#9C382C] border border-[#F8D2CE] rounded-lg font-semibold"
          >
            Reset
          </button>
        </div>

        <div className="pt-2.5 border-t border-[#F2EFE9] flex items-center justify-between text-xs">
          <span className="text-[#1C2127] font-medium">Clear Captured Optical Buffer</span>
          <button
            onClick={clearCapturedFrames}
            className="px-3 py-1 bg-white hover:bg-[#F4F2EB] text-[#57606A] border border-[#DDD8CD] rounded-lg font-semibold"
          >
            Clear Buffer
          </button>
        </div>
      </div>

      {/* Minimal Version Info */}
      <div className="text-center text-[11px] font-mono-data text-[#8C959F]">
        GeoVision AI • v0.9.4
      </div>
    </div>
  );
};
