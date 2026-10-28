import type { DashboardKPI } from '../types/specimen';

export const DASHBOARD_KPIS: DashboardKPI[] = [
  {
    id: 'kpi-images-analyzed',
    title: 'Analyzed',
    value: '1,429',
    change: '+14% this month',
    changeType: 'increase',
    subtext: '',
    isMock: true
  },
  {
    id: 'kpi-supported-classes',
    title: 'Classes',
    value: '124',
    change: 'Petrology & Minerals',
    changeType: 'neutral',
    subtext: '',
    isMock: false
  },
  {
    id: 'kpi-model-accuracy',
    title: 'Benchmark Acc',
    value: '94.2%',
    change: 'Top-1 Accuracy',
    changeType: 'benchmark',
    subtext: '',
    isMock: true
  },
  {
    id: 'kpi-completed-scans',
    title: 'Live Scans',
    value: '318',
    change: '+26 this week',
    changeType: 'increase',
    subtext: '',
    isMock: true
  }
];

export interface ActivityDataPoint {
  date: string;
  displayDate: string;
  imageUploads: number;
  liveScans: number;
  total: number;
}

export const CLASSIFICATION_ACTIVITY: ActivityDataPoint[] = [
  { date: '2026-10-18', displayDate: 'Oct 18', imageUploads: 24, liveScans: 8, total: 32 },
  { date: '2026-10-19', displayDate: 'Oct 19', imageUploads: 38, liveScans: 14, total: 52 },
  { date: '2026-10-20', displayDate: 'Oct 20', imageUploads: 42, liveScans: 19, total: 61 },
  { date: '2026-10-21', displayDate: 'Oct 21', imageUploads: 31, liveScans: 12, total: 43 },
  { date: '2026-10-22', displayDate: 'Oct 22', imageUploads: 55, liveScans: 22, total: 77 },
  { date: '2026-10-23', displayDate: 'Oct 23', imageUploads: 64, liveScans: 28, total: 92 },
  { date: '2026-10-24', displayDate: 'Oct 24', imageUploads: 48, liveScans: 16, total: 64 },
];

export interface CategoryBreakdownItem {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export const CATEGORY_DISTRIBUTION: CategoryBreakdownItem[] = [
  {
    name: 'Minerals & Sulfides',
    count: 543,
    percentage: 38,
    color: '#2B5742'
  },
  {
    name: 'Igneous Rocks',
    count: 400,
    percentage: 28,
    color: '#9C382C'
  },
  {
    name: 'Sedimentary Rocks',
    count: 257,
    percentage: 18,
    color: '#9A5B13'
  },
  {
    name: 'Metamorphic Rocks',
    count: 229,
    percentage: 16,
    color: '#3E5677'
  }
];
