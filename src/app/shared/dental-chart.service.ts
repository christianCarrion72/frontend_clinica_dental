import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { PatientDentalChart, ToothEntry } from './dental-chart.types'

@Injectable({ providedIn: 'root' })
export class DentalChartService {
  constructor(private http: HttpClient) {}

  getChart(patientId: string) {
    return this.http.get<PatientDentalChart>(`/api/patients/${patientId}/dental-chart`)
  }

  saveChart(chart: PatientDentalChart) {
    return this.http.put(`/api/patients/${chart.patientId}/dental-chart`, chart)
  }

  updateTooth(chart: PatientDentalChart, toothNumber: number, partial: Partial<ToothEntry>) {
    const existing = chart.teeth[toothNumber] || { toothNumber, shapes: {} }
    chart.teeth[toothNumber] = { ...existing, ...partial, timestamp: new Date().toISOString() }
    chart.updatedAt = new Date().toISOString()
    return chart
  }

  setToothShapes(chart: PatientDentalChart, toothNumber: number, front?: string, top?: string) {
    return this.updateTooth(chart, toothNumber, { shapes: { front, top } })
  }
}