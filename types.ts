
export interface QFLData {
  q: number;
  f: number;
  l: number;
}

export interface GeochemData {
  al2o3?: number;
  cao?: number;
  na2o?: number;
  k2o?: number;
  th?: number;
  sc?: number;
  la?: number;
  zr?: number;
}

export interface GeochronAge {
  id: string;
  age: number;
  error: number;
  mineral: string;
  method: 'U-Pb' | 'Ar-Ar' | 'K-Ar' | 'FT';
}

export interface AnalysisResult {
  tectonicSetting: string;
  basinPosition: string;
  unroofingPhase: string;
  depositionalEnvironment: string;
  provenanceType: string;
  modalComposition: string;
  interpretation: string;
  confidenceScore: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  image?: string;
}

export enum LabModule {
  XRD = 'XRD',
  XRF = 'XRF',
  ICPMS = 'ICP-MS',
  DTA = 'DTA',
  CIA = 'CIA Calculator',
  QFL = 'Petrographic Plotter',
  Orogenic = 'Orogenic Framework',
  Basins = 'Regional Cases',
  Geochronology = 'Geochronology'
}
