import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreatePacienteDto {
  nombre: string;
  fecha_nacimiento: Date;
  edad?: number;
  estado_civil_id: number;
  ocupacion?: string;
  telefono?: string;
  celular: string;
}

export interface UpdatePacienteDto extends Partial<CreatePacienteDto> {}

export interface Paciente extends CreatePacienteDto {
  id: number;
  created_at: Date;
  updated_at: Date;
  familiares?: Familiar[];
}

export interface CreateFamiliarDto {
  paciente_id: number;
  nombre: string;
  parentesco: 'madre' | 'padre' | 'tutor';
  celular: string;
}

export interface Familiar extends CreateFamiliarDto {
  id: number;
  created_at: Date;
  updated_at: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PacienteService {
  private apiUrl = 'http://localhost:3000/api/pacientes';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getAll(): Observable<Paciente[]> {
    return this.http.get<Paciente[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  getById(id: number): Observable<Paciente> {
    return this.http.get<Paciente>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  create(paciente: CreatePacienteDto): Observable<Paciente> {
    return this.http.post<Paciente>(this.apiUrl, paciente, { headers: this.getHeaders() });
  }

  update(id: number, paciente: UpdatePacienteDto): Observable<Paciente> {
    return this.http.patch<Paciente>(`${this.apiUrl}/${id}`, paciente, { headers: this.getHeaders() });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}