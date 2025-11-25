import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface HistoriaClinica {
  id: number;
  fechaIngreso: Date;
  motivoConsulta: string;
  examenBucal?: string[];
  paciente: {
    id: number;
    nombre: string;
  };
  dentistas?: any[];
  planTratamientos?: any[];
  historialMedico?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateHistoriaClinicaDto {
  fechaIngreso: string | Date;
  motivoConsulta: string;
  pacienteId: number;
  dentistas: number[];
  examenBucal?: string[];
}

export interface UpdateHistoriaClinicaDto extends Partial<CreateHistoriaClinicaDto> {}

@Injectable({
  providedIn: 'root'
})
export class HistoriaClinicaService {
  //private apiUrl = 'http://127.0.0.1:3000/api/historia-clinicas';
  private apiUrl = 'https://backend-clinica-dental.onrender.com/api/historia-clinicas';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getByPacienteId(pacienteId: number): Observable<HistoriaClinica> {
    return this.http.get<HistoriaClinica>(`${this.apiUrl}/paciente/${pacienteId}`, {
      headers: this.getHeaders()
    });
  }

  create(historiaClinica: CreateHistoriaClinicaDto): Observable<HistoriaClinica> {
    return this.http.post<HistoriaClinica>(this.apiUrl, historiaClinica, {
      headers: this.getHeaders()
    });
  }

  update(id: number, historiaClinica: UpdateHistoriaClinicaDto): Observable<HistoriaClinica> {
    return this.http.patch<HistoriaClinica>(`${this.apiUrl}/${id}`, historiaClinica, {
      headers: this.getHeaders()
    });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }
}
