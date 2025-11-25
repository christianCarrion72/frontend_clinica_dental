import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';

export interface OdontogramaEntity {
  id: number;
  json: any;
  paciente?: { id: number };
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class OdontogramaService {
  private apiUrl = 'http://localhost:3000/api/odontograma';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getByPacienteId(pacienteId: number): Observable<OdontogramaEntity | null> {
    return this.http.get<OdontogramaEntity | null>(
      `${this.apiUrl}/paciente/${pacienteId}`,
      { headers: this.getHeaders() }
    );
  }

  create(pacienteId: number, json: any): Observable<OdontogramaEntity> {
    return this.http.post<OdontogramaEntity>(this.apiUrl, { pacienteId, json }, { headers: this.getHeaders() });
  }

  update(id: number, json: any): Observable<OdontogramaEntity> {
    return this.http.patch<OdontogramaEntity>(`${this.apiUrl}/${id}`, { json }, { headers: this.getHeaders() });
  }
}