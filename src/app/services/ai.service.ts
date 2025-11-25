import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AudioAnalysisResponse {
  fecha?: string;
  proximaCita?: string;
  planesTratamiento: {
    diagnosticoTratamiento: string;
    estado: string;
    pieza: string;
    precio: number;
    fecha?: string;
  }[];
  procedimientos: {
    trabajoRealizado: string;
    planIndex: number;
    fecha?: string;
    proximaCita?: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  //private apiUrl = 'http://127.0.0.1:3000/api/ai';
  private apiUrl = 'https://backend-clinica-dental.onrender.com/api/ai';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  analyzeAudio(audioFile: File): Observable<AudioAnalysisResponse> {
    const formData = new FormData();
    formData.append('audio', audioFile);

    return this.http.post<AudioAnalysisResponse>(`${this.apiUrl}/analyze-audio`, formData, {
      headers: this.getHeaders()
    });
  }
}
