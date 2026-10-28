export type GeologicalCategory = 
  | 'Igneous'
  | 'Sedimentary'
  | 'Metamorphic'
  | 'Mineral'
  | 'Ore';

export type InputMethod = 'upload' | 'scanner';

export interface CandidateCategory {
  name: string;
  category: GeologicalCategory;
  confidence: number;
  mohsHardness: string;
  description: string;
}

export interface SpecimenCharacteristics {
  mohsHardness: string;
  crystalSystem?: string;
  chemicalFormula?: string;
  luster: string;
  cleavageFracture: string;
  density: string;
  streak?: string;
  occurrence: string;
  diagnosticFeatures: string[];
}

export interface SpecimenRecord {
  id: string;
  commonName: string;
  scientificName: string;
  category: GeologicalCategory;
  confidence: number;
  capturedAt: string;
  inputMethod: InputMethod;
  imageUrl: string;
  gradCamUrl?: string;
  notes: string;
  fileSize?: string;
  dimensions?: string;
  topCandidates: CandidateCategory[];
  characteristics: SpecimenCharacteristics;
  status: 'cataloged' | 'analyzed' | 'flagged';
  modelVersion: string;
  location?: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

export interface DashboardKPI {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: 'neutral' | 'increase' | 'benchmark';
  subtext: string;
  isMock: boolean;
}
