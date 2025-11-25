import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OdontrogramaVersion {
  id: number;
  nombreVersion: string;
  json: any;
  odontograma: { id: number };
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class OdontogramaVersionService {
  // Coincide con el controlador del backend: @Controller('odontrograma-version')
  private apiUrl = 'https://backend-clinica-dental.onrender.com/api/odontrograma-version';
  //private apiUrl = 'http://localhost:3000/api/odontrograma-version';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  create(odontogramaId: number, nombreVersion: string, json: any): Observable<OdontrogramaVersion> {
    const body = { odontogramaId, nombreVersion, json };
    return this.http.post<OdontrogramaVersion>(this.apiUrl, body, { headers: this.getHeaders() });
  }

  findAll(): Observable<OdontrogramaVersion[]> {
    return this.http.get<OdontrogramaVersion[]>(this.apiUrl, { headers: this.getHeaders() });
  }
}

