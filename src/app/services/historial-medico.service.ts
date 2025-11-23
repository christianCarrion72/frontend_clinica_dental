import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface HistorialMedico {
  id: number;
  alergia: boolean;
  fuma: boolean;
  nombreAlergias?: string;
  nombreTratamiento?: string;
  otrasEnfermedades?: string;
  tratamientoActivo: boolean;
  ultimaConsulta?: Date;
  enfermedades?: string[];
  historiaClinica?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateHistorialMedicoDto {
  historiaClinicaId: number;
  alergia: boolean;
  fuma: boolean;
  nombreAlergias?: string;
  nombreTratamiento?: string;
  otrasEnfermedades?: string;
  tratamientoActivo: boolean;
  ultimaConsulta?: Date;
  enfermedades?: string[];
}

export interface CreateHistoriaCompletaDto {
  // Datos Historia Clínica
  fechaIngreso: Date;
  motivoConsulta: string;
  pacienteId: number;
  dentistaId: number;
  examenBucal?: string[];

  // Datos Historial Médico
  alergia: boolean;
  fuma: boolean;
  nombreAlergias?: string;
  nombreTratamiento?: string;
  otrasEnfermedades?: string;
  tratamientoActivo: boolean;
  ultimaConsulta?: Date;
  enfermedades?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class HistorialMedicoService {
  private apiUrl = 'http://127.0.0.1:3000/api/historial-medicos';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getByHistoriaClinicaId(historiaClinicaId: number): Observable<HistorialMedico> {
    return this.http.get<HistorialMedico>(`${this.apiUrl}/historia-clinica/${historiaClinicaId}`, {
      headers: this.getHeaders()
    });
  }

  create(historialMedico: CreateHistorialMedicoDto): Observable<HistorialMedico> {
    return this.http.post<HistorialMedico>(this.apiUrl, historialMedico, {
      headers: this.getHeaders()
    });
  }

  update(id: number, historialMedico: Partial<CreateHistorialMedicoDto>): Observable<HistorialMedico> {
    return this.http.patch<HistorialMedico>(`${this.apiUrl}/${id}`, historialMedico, {
      headers: this.getHeaders()
    });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }
}
