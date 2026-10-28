/**
 * GeoVision AI — Identify Specimen Page
 *
 * Connects to POST /api/v1/identify (or /identify/explain for Grad-CAM).
 * Shows a clear model_unavailable state when the backend model isn't trained.
 * Never uses hardcoded predictions for uploaded images.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  UploadCloud,
  RefreshCw,
  Trash2,
  Scan,
  Download,
  BookmarkPlus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  WifiOff,
  FileSpreadsheet
} from 'lucide-react';
import { useSpecimens } from '../context/SpecimenContext';
import { MOCK_SPECIMENS } from '../data/mockSpecimens';
import type { SpecimenRecord, GeologicalCategory } from '../types/specimen';
import { CategoryBadge, ConfidenceBadge } from '../components/common/StatusBadge';
import { GradCamViewer } from '../components/common/GradCamViewer';
import { formatPercentage } from '../lib/formatters';

type AnalysisState = 'idle' | 'uploading' | 'success' | 'model_unavailable' | 'error';

export const IdentifyPage: React.FC = () => {
  const { addSpecimen, addToast, backendUrl, selectedBufferImage, setSelectedBufferImage } = useSpecimens();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileData, setFileData] = useState<File | null>(null);
  const [fileMetadata, setFileMetadata] = useState<{ name: string; size: string; dimensions?: string } | null>(null);
  const [fieldNotes, setFieldNotes] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [withGradCam, setWithGradCam] = useState(true);

  const [analysisState, setAnalysisState] = useState<AnalysisState>('idle');
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [result, setResult] = useState<SpecimenRecord | null>(null);
  const [backendResult, setBackendResult] = useState<Record<string, unknown> | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Demo mode: show mock specimen result for sample buttons
  const [demoSpecimen, setDemoSpecimen] = useState<SpecimenRecord | null>(MOCK_SPECIMENS[0]);
  const [isDemo, setIsDemo] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const revokePreview = useCallback(() => {
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  // Handle image passed from Live Scanner
  useEffect(() => {
    if (selectedBufferImage) {
      revokePreview();
      setPreviewUrl(selectedBufferImage);
      setFileMetadata({ name: `scanner-frame-${Date.now()}.jpg`, size: '—' });
      setIsDemo(false);
      setDemoSpecimen(null);
      setResult(null);
      setAnalysisState('idle');
      setAnalysisError(null);
      setSelectedBufferImage(null);
    }
  }, [selectedBufferImage, revokePreview, setSelectedBufferImage]);

  useEffect(() => () => revokePreview(), [revokePreview]);

  const handleFileChange = (file: File) => {
    revokePreview();
    setFileData(file);
    setIsDemo(false);
    setDemoSpecimen(null);
    setResult(null);
    setAnalysisState('idle');
    setAnalysisError(null);
    setIsSaved(false);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    const img = new Image();
    img.src = objectUrl;
    img.onload = () => {
      setFileMetadata({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        dimensions: `${img.naturalWidth} × ${img.naturalHeight} px`,
      });
    };
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      handleFileChange(file);
    } else {
      addToast('Unsupported File Type', 'Use JPG, PNG, or WebP.', 'error');
    }
  };

  const removeImage = () => {
    revokePreview();
    setPreviewUrl(null);
    setFileData(null);
    setFileMetadata(null);
    setIsDemo(true);
    setDemoSpecimen(MOCK_SPECIMENS[0]);
    setResult(null);
    setAnalysisState('idle');
    setAnalysisError(null);
    setIsSaved(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadSampleSpecimen = (specimen: SpecimenRecord) => {
    revokePreview();
    setPreviewUrl(specimen.imageUrl);
    setFileData(null);
    setFileMetadata({ name: `${specimen.id}.jpg`, size: specimen.fileSize || '3.2 MB', dimensions: specimen.dimensions });
    setFieldNotes(specimen.notes);
    setIsDemo(true);
    setDemoSpecimen(specimen);
    setResult(null);
    setAnalysisState('idle');
    setAnalysisError(null);
    setIsSaved(false);
  };

  const handleAnalyze = async () => {
    if (!previewUrl) return;

    // Demo mode: just show the sample specimen without calling backend
    if (isDemo && demoSpecimen) {
      setResult(demoSpecimen);
      setAnalysisState('success');
      addToast('Sample Loaded', `Showing demo data for ${demoSpecimen.commonName}.`, 'info');
      return;
    }

    if (!fileData && !selectedBufferImage) {
      addToast('No file', 'Please upload an image first.', 'warning');
      return;
    }

    setAnalysisState('uploading');
    setAnalysisError(null);
    setResult(null);

    try {
      let imageBlob: Blob;
      if (fileData) {
        imageBlob = fileData;
      } else {
        // Convert preview URL (data URL from scanner) to Blob
        const res = await fetch(previewUrl!);
        imageBlob = await res.blob();
      }

      const formData = new FormData();
      formData.append('file', imageBlob, fileMetadata?.name || 'upload.jpg');

      const endpoint = withGradCam ? 'identify/explain' : 'identify';
      const response = await fetch(`${backendUrl}/${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.status === 503 || data.status === 'model_unavailable') {
        setAnalysisState('model_unavailable');
        setAnalysisError(data.error || 'Model not trained yet.');
        addToast('Model Unavailable', 'Train the classification model to get real predictions.', 'warning');
        return;
      }

      if (!response.ok) {
        setAnalysisState('error');
        setAnalysisError(data.detail || data.error || 'Server error.');
        addToast('Analysis Failed', data.detail || 'Server returned an error.', 'error');
        return;
      }

      setBackendResult(data);

      // Map backend response to SpecimenRecord shape
      const specimenRecord: SpecimenRecord = {
        id: data.id || `GEO-${Date.now()}`,
        commonName: data.predicted_class || 'Unknown',
        scientificName: data.scientific_name || `${data.predicted_class} sp.`,
        category: (data.category as GeologicalCategory) || 'Mineral',
        confidence: data.confidence ?? 0,
        capturedAt: new Date().toISOString(),
        inputMethod: 'upload',
        imageUrl: data.image_url
          ? `${backendUrl.replace('/api/v1', '')}${data.image_url}`
          : previewUrl!,
        gradCamUrl: data.gradcam_url
          ? `${backendUrl.replace('/api/v1', '')}${data.gradcam_url}`
          : undefined,
        notes: fieldNotes,
        fileSize: fileMetadata?.size,
        dimensions: fileMetadata?.dimensions,
        topCandidates: (data.top_candidates || []).map((c: Record<string, unknown>) => ({
          name: c.name as string,
          category: (c.category as GeologicalCategory) || 'Mineral',
          confidence: c.confidence as number,
          mohsHardness: (c.mohsHardness as string) || '—',
          description: '',
        })),
        characteristics: {
          mohsHardness: '—',
          luster: '—',
          density: '—',
          cleavageFracture: '—',
          occurrence: '—',
          diagnosticFeatures: [],
        },
        status: 'analyzed',
        modelVersion: data.model_version || 'v1.0.0',
      };

      setResult(specimenRecord);
      setAnalysisState('success');
      addToast('Analysis Complete', `Identified as ${specimenRecord.commonName} (${formatPercentage(specimenRecord.confidence)} confidence).`, 'success');

      if (data.low_confidence) {
        addToast('Low Confidence', 'Prediction confidence is below 40%. Result may be uncertain.', 'warning');
      }
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Network error';
      setAnalysisState('error');
      setAnalysisError(msg);
      addToast('Connection Error', 'Cannot reach the backend server.', 'error');
    }
  };

  const handleSaveResult = () => {
    const specimenToSave = result || demoSpecimen;
    if (!specimenToSave) return;
    addSpecimen({
      ...specimenToSave,
      id: `GEO-${Math.floor(1000 + Math.random() * 9000)}`,
      capturedAt: new Date().toISOString(),
      notes: fieldNotes || specimenToSave.notes,
    });
    setIsSaved(true);
  };

  const handleExportReport = () => {
    const specimenToExport = result || demoSpecimen;
    if (!specimenToExport) return;
    const blob = new Blob([JSON.stringify({ ...specimenToExport, notes: fieldNotes }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${specimenToExport.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Exported', `JSON report downloaded for ${specimenToExport.commonName}.`, 'success');
  };

  const handleExportExcelReport = () => {
    const specimenToExport = result || demoSpecimen;
    if (!specimenToExport) return;
    const rows = [
      ['Field', 'Value'],
      ['Specimen ID', specimenToExport.id],
      ['Common Name', specimenToExport.commonName],
      ['Scientific Name', specimenToExport.scientificName || '—'],
      ['Category', specimenToExport.category],
      ['Confidence (%)', `${(specimenToExport.confidence * 100).toFixed(1)}%`],
      ['Captured At', specimenToExport.capturedAt],
      ['Input Method', specimenToExport.inputMethod],
      ['Model Version', specimenToExport.modelVersion],
      ['Mohs Hardness', specimenToExport.characteristics.mohsHardness],
      ['Luster', specimenToExport.characteristics.luster],
      ['Density', specimenToExport.characteristics.density],
      ['Cleavage/Fracture', specimenToExport.characteristics.cleavageFracture],
      ['Occurrence', specimenToExport.characteristics.occurrence],
      ['Field Notes', fieldNotes || specimenToExport.notes || '']
    ];
    const csvContent = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${specimenToExport.id}_report.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Report Exported', `Spreadsheet report downloaded for ${specimenToExport.commonName}.`, 'success');
  };

  const activeResult = result || (isDemo ? demoSpecimen : null);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#E5E2DA]">
        <h2 className="font-serif-title text-xl font-semibold text-[#1C2127]">Identify Specimen</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8C7D6B] font-mono-data font-semibold">Sample:</span>
          {MOCK_SPECIMENS.slice(0, 3).map((s) => (
            <button
              key={s.id}
              onClick={() => loadSampleSpecimen(s)}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                demoSpecimen?.id === s.id && isDemo
                  ? 'bg-[#2B5742] text-white border-[#2B5742]'
                  : 'bg-white text-[#3E454F] border-[#DDD8CD] hover:bg-[#F4F2EB]'
              }`}
            >
              {s.commonName}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Upload */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-[#E5E2DA] rounded-xl p-4 shadow-xs">
            {!previewUrl ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
                  isDragging ? 'border-[#2B5742] bg-[#EBF3EE]/50' : 'border-[#DDD8CD] hover:border-[#B4ADA1] bg-[#FAF9F6]'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-[#EFEBE3] text-[#71685B] flex items-center justify-center mb-2">
                  <UploadCloud className="w-5 h-5 stroke-[1.75]" />
                </div>
                <div className="font-semibold text-xs text-[#1C2127]">Drag and drop specimen photo</div>
                <p className="text-[11px] text-[#6E7781] mt-0.5">
                  or <span className="text-[#2B5742] underline font-semibold">browse files</span>
                </p>
                <div className="mt-3 text-[10px] font-mono-data text-[#8C959F]">JPG, PNG, WebP up to 25MB</div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-[#181A1D] border border-[#E5E2DA]">
                  <img src={previewUrl} alt="Specimen preview" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    <button onClick={() => fileInputRef.current?.click()} className="p-1 rounded-md bg-white/90 hover:bg-white text-[#1C2127] shadow-xs" title="Replace image">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={removeImage} className="p-1 rounded-md bg-white/90 hover:bg-[#FBF1F1] text-[#9C382C] shadow-xs" title="Remove image">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {isDemo && (
                    <div className="absolute bottom-2 left-2 bg-[#F8DFC0]/90 text-[#9A5B13] text-[10px] font-mono-data px-2 py-0.5 rounded font-semibold">
                      DEMO
                    </div>
                  )}
                </div>

                {fileMetadata && (
                  <div className="p-2.5 bg-[#FAF9F6] rounded-lg border border-[#EDE7DE] text-[11px] font-mono-data space-y-0.5 text-[#57606A]">
                    <div className="flex justify-between"><span className="text-[#8C959F]">File:</span><span className="font-semibold text-[#1C2127] truncate max-w-[180px]">{fileMetadata.name}</span></div>
                    <div className="flex justify-between"><span className="text-[#8C959F]">Size:</span><span>{fileMetadata.size}</span></div>
                    {fileMetadata.dimensions && <div className="flex justify-between"><span className="text-[#8C959F]">Dims:</span><span>{fileMetadata.dimensions}</span></div>}
                  </div>
                )}
              </div>
            )}

            <input type="file" ref={fileInputRef} onChange={(e) => { if (e.target.files?.[0]) handleFileChange(e.target.files[0]); }} accept="image/jpeg,image/png,image/webp" className="hidden" />

            <div className="mt-3">
              <label className="block text-[11px] font-semibold text-[#57606A] uppercase tracking-wider mb-1 font-mono-data">Notes</label>
              <textarea value={fieldNotes} onChange={(e) => setFieldNotes(e.target.value)} placeholder="Optional field notes..." rows={2} className="w-full text-xs p-2 bg-white border border-[#DDD8CD] rounded-lg text-[#1C2127] placeholder-[#8C959F] focus:outline-none focus:border-[#2B5742] transition-all resize-none" />
            </div>

            {/* Grad-CAM toggle */}
            {!isDemo && (
              <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs text-[#57606A]">
                <input type="checkbox" checked={withGradCam} onChange={(e) => setWithGradCam(e.target.checked)} className="accent-[#2B5742]" />
                <Eye className="w-3.5 h-3.5" />
                <span>Generate Grad-CAM explanation</span>
              </label>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!previewUrl || analysisState === 'uploading'}
              className={`mt-3 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-xs uppercase tracking-wider transition-all shadow-xs ${
                previewUrl && analysisState !== 'uploading'
                  ? 'bg-[#2B5742] hover:bg-[#224635] text-white cursor-pointer'
                  : 'bg-[#E5E2DA] text-[#8C959F] cursor-not-allowed'
              }`}
            >
              {analysisState === 'uploading'
                ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Analyzing…</span></>
                : <><Scan className="w-4 h-4" /><span>{isDemo ? 'Load Demo' : 'Analyze'}</span></>
              }
            </button>
          </div>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-7 space-y-4">
          {/* Status Banners */}
          {analysisState === 'model_unavailable' && (
            <div className="p-4 bg-[#FEF7EE] border border-[#F8DFC0] rounded-xl text-xs text-[#9A5B13] space-y-2">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <WifiOff className="w-4 h-4" />
                Model Not Available
              </div>
              <p>The classification model has not been trained yet. To get real predictions:</p>
              <ol className="list-decimal ml-4 space-y-1 font-mono-data text-[11px]">
                <li>Download dataset: <code>python -m ml.dataset.download_kaggle</code></li>
                <li>Preprocess: <code>python -m ml.dataset.preprocess</code></li>
                <li>Train: <code>python -m ml.classification.train</code></li>
                <li>Restart backend: <code>uvicorn backend.app.main:app --reload --port 8000</code></li>
              </ol>
              {analysisError && <p className="text-[11px] text-[#7A4A0D] font-mono-data mt-1">Detail: {analysisError}</p>}
            </div>
          )}

          {analysisState === 'error' && (
            <div className="p-3 bg-[#FBF1F1] border border-[#F6C2BE] rounded-xl text-xs text-[#9C382C] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{analysisError}</span>
            </div>
          )}

          {isDemo && analysisState === 'idle' && (
            <div className="p-2.5 bg-[#EBF3EE] border border-[#CCE2D5] rounded-lg text-[11px] text-[#244B3B] flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Demo mode — showing a reference sample. Upload a real image and click <strong>Analyze</strong> for live inference.</span>
            </div>
          )}

          {activeResult ? (
            <div className="bg-white border border-[#E5E2DA] rounded-xl p-5 space-y-5 shadow-xs">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#F2EFE9]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CategoryBadge category={activeResult.category} size="md" />
                    <span className="text-[11px] font-mono-data text-[#8C959F]">{activeResult.id}</span>
                    {isDemo && <span className="text-[10px] font-mono-data px-1.5 py-0.5 bg-[#FEF7EE] text-[#9A5B13] border border-[#F8DFC0] rounded">DEMO</span>}
                  </div>
                  <h3 className="font-serif-title text-2xl font-bold text-[#1C2127]">{activeResult.commonName}</h3>
                  <div className="text-xs text-[#57606A] font-mono-data">{activeResult.scientificName}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono-data uppercase text-[#8C959F] mb-0.5">Confidence</div>
                  <ConfidenceBadge confidence={activeResult.confidence} />
                  {(backendResult?.inference_time_ms as number) > 0 && (
                    <div className="text-[10px] font-mono-data text-[#8C959F] mt-1">{(backendResult?.inference_time_ms as number).toFixed(0)}ms</div>
                  )}
                </div>
              </div>

              {/* Candidates */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-[#1C2127] uppercase tracking-wider font-mono-data">Candidate Ranking</div>
                <div className="space-y-2">
                  {activeResult.topCandidates.map((candidate, idx) => (
                    <div key={candidate.name} className="p-2.5 bg-[#FAF9F6] border border-[#EDE7DE] rounded-lg space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-[#E5E2DA] text-[#57606A] text-[9px] font-bold font-mono-data flex items-center justify-center">{idx + 1}</span>
                          <span className="font-semibold text-[#1C2127]">{candidate.name}</span>
                          <span className="text-[10px] text-[#8C959F]">({candidate.category})</span>
                        </div>
                        <span className="font-mono-data font-bold text-[#2B5742]">{formatPercentage(candidate.confidence)}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#E5E2DA] overflow-hidden">
                        <div className="h-full rounded-full bg-[#2B5742]" style={{ width: `${candidate.confidence * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Properties */}
              <div>
                <div className="text-xs font-bold text-[#1C2127] uppercase tracking-wider font-mono-data mb-2">Properties</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  {['mohsHardness', 'luster', 'density', 'cleavageFracture', 'streak'].map((k) => (
                    <div key={k} className="p-2 bg-[#FAF9F6] rounded-lg border border-[#EDE7DE]">
                      <span className="text-[10px] text-[#8C959F] uppercase font-mono-data block">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="font-semibold text-[#1C2127]">{((activeResult.characteristics as unknown as Record<string, unknown>)[k] as string) || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grad-CAM Viewer */}
              <GradCamViewer
                imageUrl={activeResult.gradCamUrl || activeResult.imageUrl}
                specimenName={activeResult.commonName}
                predictedClass={activeResult.commonName}
              />
              {activeResult.gradCamUrl && (
                <p className="text-[10px] text-[#8C959F] font-mono-data -mt-2">
                  ✔ Real Grad-CAM generated by model at layer: MobileNetV2 features[-1]
                </p>
              )}
              {!activeResult.gradCamUrl && !isDemo && (
                <p className="text-[10px] text-[#9A5B13] font-mono-data -mt-2">
                  Grad-CAM overlay is simulated (train model for real attention maps).
                </p>
              )}

              {/* Actions */}
              <div className="pt-3 border-t border-[#F2EFE9] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button onClick={handleSaveResult} disabled={isSaved} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${isSaved ? 'bg-[#EBF3EE] text-[#244B3B] border-[#CCE2D5]' : 'bg-white hover:bg-[#F4F2EB] text-[#1C2127] border-[#DDD8CD]'}`}>
                    {isSaved ? <CheckCircle2 className="w-3.5 h-3.5 text-[#2B5742]" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                    <span>{isSaved ? 'Saved' : 'Save'}</span>
                  </button>
                  <button onClick={handleExportReport} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F4F2EB] text-[#1C2127] border border-[#DDD8CD] text-xs font-semibold rounded-lg transition-colors">
                    <Download className="w-3.5 h-3.5 text-[#57606A]" />
                    <span>Export JSON</span>
                  </button>
                  <button onClick={handleExportExcelReport} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F4F2EB] text-[#2B5742] border border-[#2B5742]/40 text-xs font-semibold rounded-lg transition-colors">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#2B5742]" />
                    <span>Export CSV/Excel</span>
                  </button>
                </div>
                <span className="text-[11px] text-[#8C959F] font-mono-data">{activeResult.modelVersion}</span>
              </div>
            </div>
          ) : analysisState === 'idle' && !isDemo ? (
            <div className="bg-[#FAF9F6] border border-dashed border-[#DDD8CD] rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
              <div className="text-xs font-semibold text-[#1C2127]">No Specimen Analyzed</div>
              <p className="text-xs text-[#57606A] mt-1">Upload an image and click Analyze to run inference.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
