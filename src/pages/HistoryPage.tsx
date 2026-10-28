import React, { useState, useMemo } from 'react';
import {
  Search,
  LayoutGrid,
  Table as TableIcon,
  X,
  ChevronRight,
  Download,
  Trash2,
  Compass,
  FileSpreadsheet
} from 'lucide-react';
import { useSpecimens } from '../context/SpecimenContext';
import type { SpecimenRecord } from '../types/specimen';
import { CategoryBadge, ConfidenceBadge, InputMethodBadge } from '../components/common/StatusBadge';
import { GradCamViewer } from '../components/common/GradCamViewer';
import { formatDate, formatDateShort } from '../lib/formatters';

export const HistoryPage: React.FC = () => {
  const { specimens, deleteSpecimen, updateSpecimenNotes, defaultHistoryView, addToast, backendUrl } = useSpecimens();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedInputMethod, setSelectedInputMethod] = useState<string>('All');
  const [selectedConfidenceTier, setSelectedConfidenceTier] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(defaultHistoryView);

  const [selectedSpecimen, setSelectedSpecimen] = useState<SpecimenRecord | null>(null);
  const [editNotes, setEditNotes] = useState<string>('');
  const [isEditingNotes, setIsEditingNotes] = useState<boolean>(false);

  const filteredSpecimens = useMemo(() => {
    return specimens.filter((item) => {
      const matchesSearch =
        item.commonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.scientificName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.notes.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;

      const matchesInputMethod =
        selectedInputMethod === 'All' || item.inputMethod === selectedInputMethod;

      let matchesConfidence = true;
      if (selectedConfidenceTier === 'high') {
        matchesConfidence = item.confidence >= 0.9;
      } else if (selectedConfidenceTier === 'medium') {
        matchesConfidence = item.confidence >= 0.8 && item.confidence < 0.9;
      } else if (selectedConfidenceTier === 'low') {
        matchesConfidence = item.confidence < 0.8;
      }

      return matchesSearch && matchesCategory && matchesInputMethod && matchesConfidence;
    });
  }, [specimens, searchQuery, selectedCategory, selectedInputMethod, selectedConfidenceTier]);

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedCategory !== 'All' ||
    selectedInputMethod !== 'All' ||
    selectedConfidenceTier !== 'All';

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedInputMethod('All');
    setSelectedConfidenceTier('All');
  };

  const openSpecimenDetail = (specimen: SpecimenRecord) => {
    setSelectedSpecimen(specimen);
    setEditNotes(specimen.notes);
    setIsEditingNotes(false);
  };

  const handleSaveNotes = () => {
    if (selectedSpecimen) {
      updateSpecimenNotes(selectedSpecimen.id, editNotes);
      setSelectedSpecimen({
        ...selectedSpecimen,
        notes: editNotes
      });
      setIsEditingNotes(false);
    }
  };

  const handleExportSpecimen = (specimen: SpecimenRecord) => {
    const dataStr = JSON.stringify(specimen, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${specimen.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Record Exported', `Downloaded JSON for ${specimen.id}.`, 'success');
  };

  const handleExportSingleExcel = (specimen: SpecimenRecord) => {
    const rows = [
      ['Field', 'Value'],
      ['Specimen ID', specimen.id],
      ['Common Name', specimen.commonName],
      ['Scientific Name', specimen.scientificName || '—'],
      ['Category', specimen.category],
      ['Confidence (%)', `${(specimen.confidence * 100).toFixed(1)}%`],
      ['Captured At', specimen.capturedAt],
      ['Input Method', specimen.inputMethod],
      ['Model Version', specimen.modelVersion],
      ['Mohs Hardness', specimen.characteristics.mohsHardness],
      ['Luster', specimen.characteristics.luster],
      ['Density', specimen.characteristics.density],
      ['Cleavage/Fracture', specimen.characteristics.cleavageFracture],
      ['Occurrence', specimen.characteristics.occurrence],
      ['Field Notes', specimen.notes || '']
    ];
    const csvContent = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${specimen.id}_specimen.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Specimen Exported', `Downloaded spreadsheet report for ${specimen.id}.`, 'success');
  };

  const handleExportAllFilteredExcel = () => {
    const headers = [
      'Specimen ID',
      'Common Name',
      'Scientific Name',
      'Category',
      'Confidence (%)',
      'Capture Date',
      'Input Method',
      'Model Version',
      'Notes'
    ];
    const rows = filteredSpecimens.map(s => [
      `"${s.id}"`,
      `"${s.commonName}"`,
      `"${s.scientificName || ''}"`,
      `"${s.category}"`,
      `"${(s.confidence * 100).toFixed(1)}"`,
      `"${s.capturedAt}"`,
      `"${s.inputMethod}"`,
      `"${s.modelVersion}"`,
      `"${(s.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geovision_specimens_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Records Exported', `Exported ${filteredSpecimens.length} specimens to spreadsheet format.`, 'success');
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#E5E2DA]">
        <div className="flex items-center gap-2">
          <h2 className="font-serif-title text-xl font-semibold text-[#1C2127]">
            Specimen History
          </h2>
          <span className="text-xs bg-[#EBE7DE] text-[#57606A] px-2 py-0.5 rounded-full font-mono-data">
            {filteredSpecimens.length} of {specimens.length}
          </span>
        </div>

        {/* Actions & View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Download Dataset Excel (.xlsx) */}
          <a
            href={`${backendUrl}/dataset/download`}
            target="_blank"
            rel="noopener noreferrer"
            download="geovision_dataset_manifest.xlsx"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2B5742]/10 hover:bg-[#2B5742]/20 text-[#2B5742] border border-[#2B5742]/30 text-xs font-semibold rounded-lg transition-colors"
            title="Download full rock & mineral dataset as Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Dataset (Excel)</span>
          </a>

          {/* Export filtered specimens */}
          <button
            onClick={handleExportAllFilteredExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F4F2EB] text-[#1C2127] border border-[#DDD8CD] text-xs font-semibold rounded-lg transition-colors"
            title="Export current filtered specimens as CSV / Excel spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-[#57606A]" />
            <span>Export Table</span>
          </button>

          {/* View Switcher */}
          <div className="flex items-center gap-1 bg-[#EBE7DE] p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md flex items-center gap-1 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-[#1C2127] shadow-xs font-semibold'
                  : 'text-[#616B76] hover:text-[#1C2127]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md flex items-center gap-1 transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-[#1C2127] shadow-xs font-semibold'
                  : 'text-[#616B76] hover:text-[#1C2127]'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border border-[#E5E2DA] rounded-xl p-3.5 space-y-2.5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#8C7D6B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-[#FAF9F6] border border-[#DDD8CD] rounded-lg text-[#1C2127] placeholder-[#8C959F] focus:outline-none focus:border-[#2B5742] transition-all"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs py-1.5 px-2.5 bg-[#FAF9F6] border border-[#DDD8CD] rounded-lg text-[#1C2127] focus:outline-none focus:border-[#2B5742] cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Mineral">Minerals</option>
              <option value="Igneous">Igneous</option>
              <option value="Sedimentary">Sedimentary</option>
              <option value="Metamorphic">Metamorphic</option>
            </select>
          </div>

          <div>
            <select
              value={selectedInputMethod}
              onChange={(e) => setSelectedInputMethod(e.target.value)}
              className="w-full text-xs py-1.5 px-2.5 bg-[#FAF9F6] border border-[#DDD8CD] rounded-lg text-[#1C2127] focus:outline-none focus:border-[#2B5742] cursor-pointer"
            >
              <option value="All">All Methods</option>
              <option value="upload">Upload</option>
              <option value="scanner">Live Scan</option>
            </select>
          </div>

          <div>
            <select
              value={selectedConfidenceTier}
              onChange={(e) => setSelectedConfidenceTier(e.target.value)}
              className="w-full text-xs py-1.5 px-2.5 bg-[#FAF9F6] border border-[#DDD8CD] rounded-lg text-[#1C2127] focus:outline-none focus:border-[#2B5742] cursor-pointer"
            >
              <option value="All">All Confidence</option>
              <option value="high">High (≥ 90%)</option>
              <option value="medium">Medium (80% - 89%)</option>
              <option value="low">Low (&lt; 80%)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-[#F2EFE9] text-xs text-[#6E7781]">
          <div>
            <span className="font-semibold text-[#1C2127]">{filteredSpecimens.length}</span> specimens
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-[#9C382C] hover:underline flex items-center gap-1 font-semibold text-[11px]"
            >
              <X className="w-3 h-3" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Grid or Table */}
      {filteredSpecimens.length === 0 ? (
        <div className="bg-[#FAF9F6] border border-dashed border-[#DDD8CD] rounded-xl p-8 text-center flex flex-col items-center justify-center">
          <Compass className="w-8 h-8 text-[#8C7D6B] mb-2 stroke-[1.5]" />
          <div className="text-xs font-semibold text-[#1C2127]">No Specimens Found</div>
          <button
            onClick={clearAllFilters}
            className="mt-3 px-3 py-1 bg-[#EBF3EE] text-[#2B5742] border border-[#CCE2D5] text-xs font-semibold rounded-lg"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSpecimens.map((specimen) => (
            <div
              key={specimen.id}
              onClick={() => openSpecimenDetail(specimen)}
              className="bg-white border border-[#E5E2DA] rounded-xl overflow-hidden hover:border-[#2B5742] transition-all hover:shadow-xs cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[4/3] bg-[#181A1D] overflow-hidden">
                  <img
                    src={specimen.imageUrl}
                    alt={specimen.commonName}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2">
                    <CategoryBadge category={specimen.category} size="sm" />
                  </div>
                  <div className="absolute top-2 right-2">
                    <ConfidenceBadge confidence={specimen.confidence} />
                  </div>
                </div>

                <div className="p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono-data text-[#8C959F]">
                    <span>{specimen.id}</span>
                    <span>{formatDateShort(specimen.capturedAt)}</span>
                  </div>

                  <h3 className="font-serif-title font-semibold text-base text-[#1C2127] group-hover:text-[#2B5742] truncate">
                    {specimen.commonName}
                  </h3>

                  <p className="text-xs text-[#57606A] line-clamp-2 leading-relaxed">
                    {specimen.notes || specimen.scientificName}
                  </p>
                </div>
              </div>

              <div className="px-3.5 py-2 bg-[#FAF9F6] border-t border-[#F2EFE9] flex items-center justify-between text-xs">
                <InputMethodBadge method={specimen.inputMethod} />
                <span className="font-semibold text-[#2B5742] flex items-center gap-0.5 text-[11px]">
                  Details <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[#E5E2DA] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] text-[#57606A] uppercase font-mono-data border-b border-[#E5E2DA] text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Specimen</th>
                  <th className="py-2.5 px-3 font-semibold">Category</th>
                  <th className="py-2.5 px-3 font-semibold">Confidence</th>
                  <th className="py-2.5 px-3 font-semibold">Method</th>
                  <th className="py-2.5 px-3 font-semibold">Date</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EFE9]">
                {filteredSpecimens.map((specimen) => (
                  <tr
                    key={specimen.id}
                    onClick={() => openSpecimenDetail(specimen)}
                    className="hover:bg-[#FAF9F6] cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={specimen.imageUrl}
                          alt={specimen.commonName}
                          className="w-9 h-9 rounded object-cover border border-[#E5E2DA] flex-shrink-0"
                        />
                        <div>
                          <div className="font-semibold text-[#1C2127]">
                            {specimen.commonName}
                          </div>
                          <div className="font-mono-data text-[10px] text-[#8C959F]">
                            {specimen.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <CategoryBadge category={specimen.category} size="sm" />
                    </td>
                    <td className="py-2.5 px-3">
                      <ConfidenceBadge confidence={specimen.confidence} />
                    </td>
                    <td className="py-2.5 px-3">
                      <InputMethodBadge method={specimen.inputMethod} />
                    </td>
                    <td className="py-2.5 px-3 font-mono-data text-[#57606A]">
                      {formatDate(specimen.capturedAt)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openSpecimenDetail(specimen);
                        }}
                        className="px-2 py-1 text-[11px] font-semibold text-[#2B5742] bg-[#EBF3EE] hover:bg-[#DCEAE1] border border-[#CCE2D5] rounded transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedSpecimen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#DDD8CD] rounded-2xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto flex flex-col">
            <div className="p-4 border-b border-[#E5E2DA] bg-[#FAF9F6] flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="font-mono-data text-xs px-2 py-0.5 bg-[#EBE7DE] text-[#57606A] rounded font-bold">
                  {selectedSpecimen.id}
                </div>
                <div>
                  <h3 className="font-serif-title text-lg font-bold text-[#1C2127]">
                    {selectedSpecimen.commonName}
                  </h3>
                  <div className="text-[11px] text-[#57606A] font-mono-data">
                    {selectedSpecimen.scientificName}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedSpecimen(null)}
                className="p-1 rounded-lg text-[#8C959F] hover:text-[#1C2127]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                <div>
                  <GradCamViewer
                    imageUrl={selectedSpecimen.imageUrl}
                    specimenName={selectedSpecimen.commonName}
                    predictedClass={selectedSpecimen.commonName}
                  />
                </div>

                <div className="space-y-3.5">
                  <div className="flex items-center justify-between p-2.5 bg-[#FAF9F6] border border-[#EDE7DE] rounded-lg text-xs">
                    <span className="text-[#8C959F]">Class</span>
                    <div className="flex items-center gap-2">
                      <CategoryBadge category={selectedSpecimen.category} size="sm" />
                      <ConfidenceBadge confidence={selectedSpecimen.confidence} />
                    </div>
                  </div>

                  <div className="border border-[#E5E2DA] rounded-lg overflow-hidden text-xs">
                    <div className="bg-[#FAF9F6] px-3 py-1.5 font-mono-data uppercase text-[10px] font-bold text-[#8C7D6B] border-b border-[#E5E2DA]">
                      Properties
                    </div>
                    <div className="p-2.5 grid grid-cols-2 gap-2 text-[#57606A]">
                      <div>
                        <span className="text-[#8C959F] block text-[10px]">Hardness:</span>
                        <span className="font-semibold text-[#1C2127]">{selectedSpecimen.characteristics.mohsHardness}</span>
                      </div>
                      <div>
                        <span className="text-[#8C959F] block text-[10px]">Luster:</span>
                        <span className="font-semibold text-[#1C2127]">{selectedSpecimen.characteristics.luster}</span>
                      </div>
                      <div>
                        <span className="text-[#8C959F] block text-[10px]">Density:</span>
                        <span className="font-semibold text-[#1C2127]">{selectedSpecimen.characteristics.density}</span>
                      </div>
                      <div>
                        <span className="text-[#8C959F] block text-[10px]">Model:</span>
                        <span className="font-mono-data text-[#1C2127]">{selectedSpecimen.modelVersion}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[#8C959F] block text-[10px]">Cleavage:</span>
                        <span className="text-[#1C2127]">{selectedSpecimen.characteristics.cleavageFracture}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#1C2127] uppercase tracking-wider font-mono-data">
                        Notes
                      </label>
                      {!isEditingNotes ? (
                        <button
                          onClick={() => setIsEditingNotes(true)}
                          className="text-[11px] text-[#2B5742] hover:underline font-semibold"
                        >
                          Edit
                        </button>
                      ) : (
                        <button
                          onClick={handleSaveNotes}
                          className="text-[11px] text-[#2B5742] font-semibold hover:underline"
                        >
                          Save
                        </button>
                      )}
                    </div>

                    {isEditingNotes ? (
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        rows={2}
                        className="w-full text-xs p-2 bg-white border border-[#2B5742] rounded-lg text-[#1C2127] focus:outline-none resize-none"
                      />
                    ) : (
                      <div className="p-2 bg-[#FAF9F6] border border-[#EDE7DE] rounded-lg text-xs text-[#57606A]">
                        {selectedSpecimen.notes || 'No notes.'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3.5 border-t border-[#E5E2DA] bg-[#FAF9F6] flex items-center justify-between text-xs">
              <button
                onClick={() => {
                  deleteSpecimen(selectedSpecimen.id);
                  setSelectedSpecimen(null);
                }}
                className="text-[#9C382C] hover:underline flex items-center gap-1 font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportSpecimen(selectedSpecimen)}
                  className="px-2.5 py-1 bg-white hover:bg-[#F4F2EB] text-[#1C2127] border border-[#DDD8CD] rounded-lg font-semibold flex items-center gap-1"
                  title="Export as JSON file"
                >
                  <Download className="w-3.5 h-3.5 text-[#57606A]" /> JSON
                </button>
                <button
                  onClick={() => handleExportSingleExcel(selectedSpecimen)}
                  className="px-2.5 py-1 bg-white hover:bg-[#F4F2EB] text-[#2B5742] border border-[#2B5742]/40 rounded-lg font-semibold flex items-center gap-1"
                  title="Export as Spreadsheet / CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#2B5742]" /> Excel/CSV
                </button>
                <button
                  onClick={() => setSelectedSpecimen(null)}
                  className="px-3.5 py-1 bg-[#2B5742] hover:bg-[#224635] text-white rounded-lg font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
