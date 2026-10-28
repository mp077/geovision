import React, { createContext, useContext, useState, useEffect } from 'react';
import type { SpecimenRecord, ToastMessage } from '../types/specimen';
import { MOCK_SPECIMENS } from '../data/mockSpecimens';

export interface CapturedFrame {
  id: string;
  dataUrl: string;
  timestamp: string;
}

interface SpecimenContextType {
  specimens: SpecimenRecord[];
  addSpecimen: (specimen: SpecimenRecord) => void;
  updateSpecimenNotes: (id: string, notes: string) => void;
  deleteSpecimen: (id: string) => void;
  resetSpecimens: () => void;
  
  toasts: ToastMessage[];
  addToast: (title: string, message?: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;

  defaultHistoryView: 'grid' | 'table';
  setDefaultHistoryView: (view: 'grid' | 'table') => void;

  measurementUnit: 'metric' | 'imperial';
  setMeasurementUnit: (unit: 'metric' | 'imperial') => void;

  backendUrl: string;
  setBackendUrl: (url: string) => void;
  backendStatus: 'disconnected' | 'checking' | 'connected' | 'error';
  backendMessage: string;
  checkBackendConnection: () => Promise<void>;

  capturedFrames: CapturedFrame[];
  addCapturedFrame: (dataUrl: string) => CapturedFrame;
  removeCapturedFrame: (id: string) => void;
  clearCapturedFrames: () => void;

  selectedBufferImage: string | null;
  setSelectedBufferImage: (url: string | null) => void;
}

const SpecimenContext = createContext<SpecimenContextType | undefined>(undefined);

export const SpecimenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [specimens, setSpecimens] = useState<SpecimenRecord[]>(() => {
    const saved = localStorage.getItem('geovision_specimens');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return MOCK_SPECIMENS;
      }
    }
    return MOCK_SPECIMENS;
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [defaultHistoryView, setDefaultHistoryView] = useState<'grid' | 'table'>('grid');
  const [measurementUnit, setMeasurementUnit] = useState<'metric' | 'imperial'>('metric');
  const [backendUrl, setBackendUrl] = useState<string>(import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1');
  const [backendStatus, setBackendStatus] = useState<'disconnected' | 'checking' | 'connected' | 'error'>('disconnected');
  const [backendMessage, setBackendMessage] = useState<string>('Frontend prototype mode — no active ML backend connection.');
  const [capturedFrames, setCapturedFrames] = useState<CapturedFrame[]>([]);
  const [selectedBufferImage, setSelectedBufferImage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('geovision_specimens', JSON.stringify(specimens));
    } catch {
      // quota or private mode fallback
    }
  }, [specimens]);

  useEffect(() => {
    checkBackendConnection();
  }, [backendUrl]);

  const addToast = (title: string, message?: string, type: ToastMessage['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = { id, title, message, type };
    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const addSpecimen = (specimen: SpecimenRecord) => {
    setSpecimens(prev => [specimen, ...prev]);
    addToast('Specimen Saved to Collection', `${specimen.commonName} (${specimen.id}) cataloged successfully.`, 'success');
  };

  const updateSpecimenNotes = (id: string, notes: string) => {
    setSpecimens(prev =>
      prev.map(item => (item.id === id ? { ...item, notes } : item))
    );
    addToast('Notes Updated', `Specimen ${id} field notes saved.`, 'info');
  };

  const deleteSpecimen = (id: string) => {
    setSpecimens(prev => prev.filter(item => item.id !== id));
    addToast('Specimen Removed', `Specimen ${id} removed from active session.`, 'warning');
  };

  const resetSpecimens = () => {
    setSpecimens(MOCK_SPECIMENS);
    addToast('Collection Reset', 'Sample geological specimen records restored to initial demonstration state.', 'info');
  };

  const addCapturedFrame = (dataUrl: string): CapturedFrame => {
    const newFrame: CapturedFrame = {
      id: `frame-${Date.now()}`,
      dataUrl,
      timestamp: new Date().toISOString()
    };
    setCapturedFrames(prev => [newFrame, ...prev.slice(0, 7)]); // keep recent 8
    addToast('Frame Captured', 'High-res video frame stored in laboratory buffer.', 'info');
    return newFrame;
  };

  const removeCapturedFrame = (id: string) => {
    setCapturedFrames(prev => prev.filter(f => f.id !== id));
  };

  const clearCapturedFrames = () => {
    setCapturedFrames([]);
    addToast('Buffer Cleared', 'Captured optical frames cleared.', 'info');
  };

  const checkBackendConnection = async () => {
    setBackendStatus('checking');
    setBackendMessage(`Pinging endpoint at ${backendUrl}/health...`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${backendUrl}/health`, {
        signal: controller.signal,
        method: 'GET',
        headers: { Accept: 'application/json' }
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        setBackendStatus('connected');
        setBackendMessage(`Connected to active inference service (${backendUrl})`);
        addToast('Backend Online', 'Connected to FastAPI inference server.', 'success');

        // Fetch real history from backend and merge into specimens
        try {
          const histRes = await fetch(`${backendUrl}/history?limit=200`);
          if (histRes.ok) {
            const histData = await histRes.json();
            const backendItems: SpecimenRecord[] = (histData.items || []).map((item: Record<string, unknown>) => ({
              id: item.id as string,
              commonName: item.commonName as string,
              scientificName: (item.scientificName as string) || '',
              category: (item.category as SpecimenRecord['category']) || 'Mineral',
              confidence: (item.confidence as number) || 0,
              capturedAt: item.capturedAt as string,
              inputMethod: (item.inputMethod as SpecimenRecord['inputMethod']) || 'upload',
              imageUrl: (item.imageUrl as string) || '',
              gradCamUrl: item.gradCamUrl as string | undefined,
              notes: (item.notes as string) || '',
              fileSize: item.fileSize as string | undefined,
              dimensions: item.dimensions as string | undefined,
              topCandidates: (item.topCandidates as SpecimenRecord['topCandidates']) || [],
              characteristics: (item.characteristics as SpecimenRecord['characteristics']) || {
                mohsHardness: '—', luster: '—', density: '—',
                cleavageFracture: '—', occurrence: '—', diagnosticFeatures: []
              },
              status: (item.status as SpecimenRecord['status']) || 'analyzed',
              modelVersion: (item.modelVersion as string) || 'v1.0.0',
            }));

            if (backendItems.length > 0) {
              // Merge: backend records first, then local-only records
              setSpecimens(prev => {
                const backendIds = new Set(backendItems.map(i => i.id));
                const localOnly = prev.filter(p => !backendIds.has(p.id));
                return [...backendItems, ...localOnly];
              });
            }
          }
        } catch {
          // ignore history fetch failures — local data still shown
        }
      } else {
        setBackendStatus('error');
        setBackendMessage(`Endpoint responded with HTTP ${response.status}.`);
        addToast('Connection Failed', `Server returned status ${response.status}`, 'error');
      }
    } catch {
      setBackendStatus('disconnected');
      setBackendMessage(`No service listening at ${backendUrl}. Operating in standalone frontend prototype mode.`);
      addToast('Backend Disconnected', 'No local FastAPI server detected. Operating in demo mode.', 'info');
    }
  };

  return (
    <SpecimenContext.Provider
      value={{
        specimens,
        addSpecimen,
        updateSpecimenNotes,
        deleteSpecimen,
        resetSpecimens,
        toasts,
        addToast,
        removeToast,
        defaultHistoryView,
        setDefaultHistoryView,
        measurementUnit,
        setMeasurementUnit,
        backendUrl,
        setBackendUrl,
        backendStatus,
        backendMessage,
        checkBackendConnection,
        capturedFrames,
        addCapturedFrame,
        removeCapturedFrame,
        clearCapturedFrames,
        selectedBufferImage,
        setSelectedBufferImage,
      }}
    >
      {children}
    </SpecimenContext.Provider>
  );
};

export const useSpecimens = () => {
  const context = useContext(SpecimenContext);
  if (!context) {
    throw new Error('useSpecimens must be used within a SpecimenProvider');
  }
  return context;
};
