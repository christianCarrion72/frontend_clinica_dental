import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateFamiliarDto, Familiar } from './paciente.service';

@Injectable({
  providedIn: 'root'
})
export class FamiliarService {
  private apiUrl = 'https://backend-clinica-dental.onrender.com/api/familiares';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getAll(): Observable<Familiar[]> {
    return this.http.get<Familiar[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  getById(id: number): Observable<Familiar> {
    return this.http.get<Familiar>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  create(familiar: CreateFamiliarDto): Observable<Familiar> {
    return this.http.post<Familiar>(this.apiUrl, familiar, { headers: this.getHeaders() });
  }

  update(id: number, familiar: Partial<CreateFamiliarDto>): Observable<Familiar> {
    return this.http.patch<Familiar>(`${this.apiUrl}/${id}`, familiar, { headers: this.getHeaders() });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  getByPacienteId(pacienteId: number): Observable<Familiar[]> {
    return this.http.get<Familiar[]>(`${this.apiUrl}/paciente/${pacienteId}`, { headers: this.getHeaders() });
  }
}