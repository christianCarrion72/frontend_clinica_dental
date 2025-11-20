export interface ToothShapes { front?: string; top?: string }
export interface ToothEntry {
  toothNumber: number
  shapes: ToothShapes
  pathology?: string
  pathologyDetails?: Record<string, any>
  zones?: string[]
  timestamp?: string
}
export interface PatientDentalChart {
  patientId: string
  patientName?: string
  teeth: Record<number, ToothEntry>
  createdAt: string
  updatedAt: string
}