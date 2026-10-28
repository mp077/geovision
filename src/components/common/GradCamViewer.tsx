import React, { useState } from 'react';
import { Eye, Layers, Sliders } from 'lucide-react';

interface GradCamViewerProps {
  imageUrl: string;
  specimenName: string;
  predictedClass: string;
  className?: string;
}

export const GradCamViewer: React.FC<GradCamViewerProps> = ({
  imageUrl,
  specimenName,
  predictedClass,
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<'original' | 'heatmap' | 'blend'>('blend');
  const [blendOpacity, setBlendOpacity] = useState<number>(0.65);

  return (
    <div className={`border border-[#E4E0D6] rounded-xl overflow-hidden bg-white ${className}`}>
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-[#EBE7DE] bg-[#FAF8F5]">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#2B5742]" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1C2127]">
            Grad-CAM Heatmap
          </h4>
        </div>

        {/* View Mode controls */}
        <div className="flex items-center gap-1 bg-[#EBE7DE] p-0.5 rounded-lg text-xs font-medium">
          <button
            onClick={() => setViewMode('original')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              viewMode === 'original'
                ? 'bg-white text-[#1C2127] shadow-xs font-semibold'
                : 'text-[#616B76] hover:text-[#1C2127]'
            }`}
          >
            Optical
          </button>
          <button
            onClick={() => setViewMode('blend')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              viewMode === 'blend'
                ? 'bg-white text-[#1C2127] shadow-xs font-semibold'
                : 'text-[#616B76] hover:text-[#1C2127]'
            }`}
          >
            Blend
          </button>
          <button
            onClick={() => setViewMode('heatmap')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              viewMode === 'heatmap'
                ? 'bg-white text-[#1C2127] shadow-xs font-semibold'
                : 'text-[#616B76] hover:text-[#1C2127]'
            }`}
          >
            Heatmap
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="relative aspect-[4/3] w-full bg-[#181A1D] overflow-hidden flex items-center justify-center">
        {/* Base Specimen Image */}
        <img
          src={imageUrl}
          alt={specimenName}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            viewMode === 'heatmap' ? 'opacity-20 filter grayscale' : 'opacity-100'
          }`}
        />

        {/* Grad-CAM Heatmap Simulation Layer (Thermal Gradient) */}
        {(viewMode === 'blend' || viewMode === 'heatmap') && (
          <div
            className="absolute inset-0 pointer-events-none mix-blend-screen transition-opacity duration-300"
            style={{
              opacity: viewMode === 'heatmap' ? 0.95 : blendOpacity,
              background: `radial-gradient(circle at 45% 48%, rgba(255, 30, 0, 0.9) 0%, rgba(255, 140, 0, 0.8) 25%, rgba(255, 230, 0, 0.6) 45%, rgba(0, 180, 255, 0.35) 65%, rgba(0, 20, 100, 0.1) 85%, transparent 100%)`,
              filter: 'blur(16px)'
            }}
          />
        )}

        {/* Secondary Hotspot overlay */}
        {(viewMode === 'blend' || viewMode === 'heatmap') && (
          <div
            className="absolute inset-0 pointer-events-none mix-blend-color-dodge transition-opacity duration-300"
            style={{
              opacity: viewMode === 'heatmap' ? 0.8 : blendOpacity * 0.85,
              background: `radial-gradient(ellipse at 60% 38%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 40, 0, 0.8) 30%, transparent 60%)`,
              filter: 'blur(20px)'
            }}
          />
        )}

        {/* Floating Reticle Annotation */}
        <div className="absolute top-2.5 left-2.5 bg-[#1C2127]/80 backdrop-blur-sm border border-white/10 text-white px-2 py-0.5 rounded text-[11px] font-mono-data flex items-center gap-1.5">
          <Eye className="w-3 h-3 text-[#5EEAD4]" />
          <span>{predictedClass}</span>
        </div>

        {/* Heatmap Legend */}
        {(viewMode === 'blend' || viewMode === 'heatmap') && (
          <div className="absolute bottom-2.5 right-2.5 bg-[#1C2127]/85 backdrop-blur-sm border border-white/15 px-2.5 py-1 rounded flex items-center gap-2 text-[10px] text-white font-mono-data">
            <span>0.0</span>
            <div className="w-16 h-1.5 rounded-full bg-gradient-to-r from-blue-600 via-yellow-400 to-red-600" />
            <span>1.0</span>
          </div>
        )}
      </div>

      {/* Blend opacity slider if blend mode */}
      {viewMode === 'blend' && (
        <div className="px-4 py-2 bg-[#F9F8F5] border-t border-[#EBE7DE] flex items-center gap-3 text-xs text-[#57606A]">
          <Sliders className="w-3.5 h-3.5 text-[#848D97]" />
          <span className="font-medium text-[#1C2127]">Opacity</span>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={blendOpacity}
            onChange={(e) => setBlendOpacity(parseFloat(e.target.value))}
            className="w-full accent-[#2B5742] h-1.5 bg-[#E4E0D6] rounded-lg cursor-pointer"
            aria-label="Heatmap blend opacity"
          />
          <span className="font-mono-data text-[11px] w-8 text-right font-semibold text-[#1C2127]">
            {Math.round(blendOpacity * 100)}%
          </span>
        </div>
      )}
    </div>
  );
};
