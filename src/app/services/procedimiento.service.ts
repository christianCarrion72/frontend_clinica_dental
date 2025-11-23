import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Procedimiento {
  id: number;
  fecha: Date;
  proximaCita?: Date;
  trabajoRealizado: string;
  planTratamiento?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProcedimientoDto {
  fecha: Date | string;
  proximaCita?: Date | string;
  trabajoRealizado: string;
  planTratamientoId: number;
}

export interface UpdateProcedimientoDto extends Partial<CreateProcedimientoDto> {}

@Injectable({
  providedIn: 'root'
})
export class ProcedimientoService {
  private apiUrl = 'http://127.0.0.1:3000/api/procedimientos';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getByPlanTratamientoId(planTratamientoId: number): Observable<Procedimiento[]> {
    return this.http.get<Procedimiento[]>(`${this.apiUrl}/plan-tratamiento/${planTratamientoId}`, {
      headers: this.getHeaders()
    });
  }

  getByHistoriaClinicaId(historiaClinicaId: number): Observable<Procedimiento[]> {
    return this.http.get<Procedimiento[]>(`${this.apiUrl}/historia-clinica/${historiaClinicaId}`, {
      headers: this.getHeaders()
    });
  }

  create(procedimiento: CreateProcedimientoDto): Observable<Procedimiento> {
    return this.http.post<Procedimiento>(this.apiUrl, procedimiento, {
      headers: this.getHeaders()
    });
  }

  update(id: number, procedimiento: UpdateProcedimientoDto): Observable<Procedimiento> {
    return this.http.patch<Procedimiento>(`${this.apiUrl}/${id}`, procedimiento, {
      headers: this.getHeaders()
    });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }
}
