export interface ToothShapes { front?: string; top?: string }
export interface ToothEntry {
  toothNumber: number
  shapes: ToothShapes
  pathology?: string
  pathologyDetails?: Record<string, any>
  zones?: string[]
  timestamp?: string
}
export interface OdontogramLayout {
  images?: {
    front?: Record<number, string>;
    top?: Record<number, string>;
  };
  rows?: {
    upperFront?: number[];
    lowerFront?: number[];
  };
  offsets?: {
    front?: Record<number, { x: number; y: number }>;
    top?: Record<number, { x: number; y: number }>;
  };
  meta?: {
    front?: { width?: number; height?: number };
    top?: { width?: number; height?: number };
  };
  teeth?: Record<number, ToothEntry>;
}
export interface PatientDentalChart {
  patientId: string
  patientName?: string
  teeth: Record<number, ToothEntry>
  createdAt: string
  updatedAt: string

  // Layout y metadatos de versión
  layout?: OdontogramLayout
  layoutName?: string
  layoutVersion?: number
  version?: number | string
}