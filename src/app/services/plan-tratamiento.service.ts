import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PlanTratamiento {
  id: number;
  diagnosticoTratamiento: string;
  estado: string;
  fecha: Date;
  pieza: string;
  precio: number;
  historiaClinica?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePlanTratamientoDto {
  diagnosticoTratamiento: string;
  estado: string;
  fecha: Date | string;
  pieza: string;
  precio: number;
  historiaClinicaId: number;
}

export interface UpdatePlanTratamientoDto extends Partial<CreatePlanTratamientoDto> {}

@Injectable({
  providedIn: 'root'
})
export class PlanTratamientoService {
  //private apiUrl = 'http://127.0.0.1:3000/api/plan-tratamientos';
  private apiUrl = 'https://backend-clinica-dental.onrender.com/api/plan-tratamientos';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getByHistoriaClinicaId(historiaClinicaId: number): Observable<PlanTratamiento[]> {
    return this.http.get<PlanTratamiento[]>(`${this.apiUrl}/historia-clinica/${historiaClinicaId}`, {
      headers: this.getHeaders()
    });
  }

  getByHistorialMedicoId(historialMedicoId: number): Observable<PlanTratamiento[]> {
    return this.http.get<PlanTratamiento[]>(`${this.apiUrl}/historial-medico/${historialMedicoId}`, {
      headers: this.getHeaders()
    });
  }

  create(planTratamiento: CreatePlanTratamientoDto): Observable<PlanTratamiento> {
    return this.http.post<PlanTratamiento>(this.apiUrl, planTratamiento, {
      headers: this.getHeaders()
    });
  }

  update(id: number, planTratamiento: UpdatePlanTratamientoDto): Observable<PlanTratamiento> {
    return this.http.patch<PlanTratamiento>(`${this.apiUrl}/${id}`, planTratamiento, {
      headers: this.getHeaders()
    });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }
}
