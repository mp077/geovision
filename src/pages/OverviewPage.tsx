import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Scan,
  Camera,
  TrendingUp,
  Database,
  Award,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  DASHBOARD_KPIS,
  CLASSIFICATION_ACTIVITY,
  CATEGORY_DISTRIBUTION
} from '../data/mockDashboard';
import { useSpecimens } from '../context/SpecimenContext';
import { CategoryBadge, ConfidenceBadge } from '../components/common/StatusBadge';
import { formatDateShort } from '../lib/formatters';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { specimens, backendUrl } = useSpecimens();
  const recentSpecimens = specimens.slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-[#FAF9F6] border border-[#E5E2DA] rounded-xl">
        <div>
          <h2 className="font-serif-title text-xl sm:text-2xl font-semibold text-[#1C2127]">
            Specimen Intelligence Dashboard
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/identify"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#2B5742] hover:bg-[#224635] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            <Scan className="w-4 h-4" />
            <span>Identify Specimen</span>
          </Link>

          <Link
            to="/scanner"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-[#F4F2EB] text-[#2E353F] border border-[#DDD8CD] text-xs font-semibold rounded-lg transition-colors"
          >
            <Camera className="w-4 h-4 text-[#57606A]" />
            <span>Live Scanner</span>
          </Link>

          <a
            href={`${backendUrl}/dataset/download`}
            target="_blank"
            rel="noopener noreferrer"
            download="geovision_dataset_manifest.xlsx"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#2B5742]/10 hover:bg-[#2B5742]/20 text-[#2B5742] border border-[#2B5742]/30 text-xs font-semibold rounded-lg transition-colors"
            title="Download geological rock & mineral dataset as Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#2B5742]" />
            <span>Dataset (Excel .xlsx)</span>
          </a>
        </div>
      </div>

      {/* 4 Clean KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {DASHBOARD_KPIS.map((kpi, idx) => {
          let Icon = TrendingUp;
          if (idx === 1) Icon = Database;
          if (idx === 2) Icon = Award;
          if (idx === 3) Icon = Camera;

          return (
            <div
              key={kpi.id}
              className="bg-white border border-[#E5E2DA] rounded-xl p-4 space-y-1.5"
            >
              <div className="flex items-center justify-between text-[#6E7781]">
                <span className="text-xs font-medium text-[#57606A] uppercase tracking-wider font-mono-data">
                  {kpi.title}
                </span>
                <Icon className="w-4 h-4 text-[#8C7D6B]" />
              </div>

              <div className="font-serif-title text-2xl font-bold text-[#1C2127]">
                {kpi.value}
              </div>

              <div className="text-[11px] font-mono-data text-[#2B5742] font-semibold">
                {kpi.change}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Classification Activity & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Classification Activity Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-[#E5E2DA] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F2EFE9]">
              <h3 className="font-serif-title text-base font-semibold text-[#1C2127]">
                Classification Volume
              </h3>
              <div className="flex items-center gap-3 text-xs font-mono-data">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#2B5742]" />
                  <span className="text-[#57606A]">Uploads</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#C5B69F]" />
                  <span className="text-[#57606A]">Scans</span>
                </div>
              </div>
            </div>

            <div className="h-60 w-full pt-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={CLASSIFICATION_ACTIVITY}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2B5742" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2B5742" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C5B69F" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#C5B69F" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0ECE1" vertical={false} />
                  <XAxis
                    dataKey="displayDate"
                    stroke="#8C959F"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E5E2DA' }}
                  />
                  <YAxis
                    stroke="#8C959F"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E5E2DA',
                      borderRadius: '6px',
                      fontSize: '11px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="imageUploads"
                    name="Uploads"
                    stroke="#2B5742"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorUploads)"
                  />
                  <Area
                    type="monotone"
                    dataKey="liveScans"
                    name="Scans"
                    stroke="#8F7F68"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#colorScans)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Specimen Category Breakdown (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-[#E5E2DA] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-[#F2EFE9]">
              <h3 className="font-serif-title text-base font-semibold text-[#1C2127]">
                Category Distribution
              </h3>
            </div>

            <div className="mt-4 space-y-3.5">
              {CATEGORY_DISTRIBUTION.map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#1C2127]">{item.name}</span>
                    <span className="font-mono-data font-semibold text-[#57606A]">
                      {item.percentage}% ({item.count})
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#F4F2EB] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#F2EFE9] mt-3 flex justify-end">
            <Link
              to="/history"
              className="text-xs font-semibold text-[#2B5742] hover:underline flex items-center gap-1"
            >
              View Full History <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Specimens Section */}
      <div className="bg-white border border-[#E5E2DA] rounded-xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#F2EFE9] mb-2">
          <h3 className="font-serif-title text-base font-semibold text-[#1C2127]">
            Recent Specimens
          </h3>
          <Link
            to="/history"
            className="text-xs font-semibold text-[#2B5742] hover:underline flex items-center gap-1"
          >
            All Records <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-[#F2EFE9]">
          {recentSpecimens.map((specimen) => (
            <div
              key={specimen.id}
              onClick={() => navigate('/history')}
              className="py-2.5 flex items-center justify-between gap-3 hover:bg-[#FAF9F6] px-2 -mx-2 rounded-lg cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={specimen.imageUrl}
                  alt={specimen.commonName}
                  className="w-10 h-10 rounded-lg object-cover border border-[#E5E2DA] flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs sm:text-sm text-[#1C2127] group-hover:text-[#2B5742] truncate">
                      {specimen.commonName}
                    </span>
                    <span className="font-mono-data text-[10px] text-[#8C959F]">
                      {specimen.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <CategoryBadge category={specimen.category} size="sm" />
                    <span className="text-[11px] text-[#8C959F] font-mono-data">
                      {formatDateShort(specimen.capturedAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-shrink-0">
                <ConfidenceBadge confidence={specimen.confidence} />
                <ChevronRight className="w-4 h-4 text-[#B8B2A6] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
