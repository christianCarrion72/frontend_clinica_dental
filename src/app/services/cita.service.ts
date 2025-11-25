import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Cita {
  id: number;
  estado: string;
  consultorio: string;
  observaciones: string;
  externalEventId: string;
  paciente: {
    id: number;
    nombre: string;
    celular: string;
    email: string;
  };
  horarioFecha: {
    id: number;
    fecha: string;
    horario: {
      horaInicio: string;
      horaFin: string;
    };
    dentista: {
      id: number;
      especialidad: string;
    };
  };
  createdAt: string;
}

interface Paciente {
  id: number;
  nombre: string;
  celular: string;
  email: string;
}

interface HorarioFecha {
  id: number;
  fecha: string;
  disponible: boolean;
  horario: {
    id: number;
    horaInicio: string;
    horaFin: string;
  };
  dentista: {
    id: number;
    especialidad: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CitasService {
  private apiUrl = 'https://backend-clinica-dental.onrender.com/api';
  //private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getHeaders() {
    return { Authorization: `Bearer ${this.getToken()}` };
  }

  // Citas
  getCitas(): Observable<Cita[]> {
    return this.http.get<Cita[]>(`${this.apiUrl}/citas`, {
      headers: this.getHeaders()
    });
  }

  createCita(citaData: any): Observable<Cita> {
    return this.http.post<Cita>(`${this.apiUrl}/citas`, citaData, {
      headers: this.getHeaders()
    });
  }

  // Pacientes
  getPacientes(): Observable<Paciente[]> {
    return this.http.get<Paciente[]>(`${this.apiUrl}/pacientes`, {
      headers: this.getHeaders()
    });
  }

  // Horarios disponibles
  getHorariosFechas(): Observable<HorarioFecha[]> {
    return this.http.get<HorarioFecha[]>(`${this.apiUrl}/horario-fechas`, {
      headers: this.getHeaders()
    });
  }

  // Filtrar horarios disponibles por fecha
  getHorariosDisponiblesPorFecha(fecha: string, horariosOriginales: HorarioFecha[]): HorarioFecha[] {
    return horariosOriginales.filter(h => {
      const fechaHorario = this.normalizarFecha(h.fecha);
      const fechaBuscada = this.normalizarFecha(fecha);
      return fechaHorario === fechaBuscada && h.disponible;
    });
  }

  // Filtrar citas por fecha
  getCitasPorFecha(fecha: string, citas: Cita[]): Cita[] {
    return citas.filter(cita => {
      const fechaCita = this.normalizarFecha(cita.horarioFecha.fecha);
      const fechaBuscada = this.normalizarFecha(fecha);
      return fechaCita === fechaBuscada;
    });
  }

  // Contar citas por fecha
  contarCitasPorFecha(fecha: string, citas: Cita[]): number {
    return citas.filter(cita => {
      const fechaCita = this.normalizarFecha(cita.horarioFecha.fecha);
      const fechaBuscada = this.normalizarFecha(fecha);
      return fechaCita === fechaBuscada;
    }).length;
  }

  // Obtener citas para mostrar en calendario (máximo 2)
  getCitasParaCalendario(fecha: string, citas: Cita[]): Cita[] {
    return citas.filter(cita => {
      const fechaCita = this.normalizarFecha(cita.horarioFecha.fecha);
      const fechaBuscada = this.normalizarFecha(fecha);
      return fechaCita === fechaBuscada;
    }).slice(0, 2);
  }

  // Obtener horarios disponibles para una fecha específica desde el endpoint del backend
  getHorariosFechasDisponiblesPorFecha(fecha: string): Observable<HorarioFecha[]> {
    return this.http.get<HorarioFecha[]>(`${this.apiUrl}/horario-fechas/fecha/${fecha}`, {
      headers: this.getHeaders()
    });
  }

  // Actualizar cita
  updateCita(id: number, citaData: any): Observable<Cita> {
    return this.http.patch<Cita>(`${this.apiUrl}/citas/${id}`, citaData, {
      headers: this.getHeaders()
    });
  }

  // Eliminar cita
  deleteCita(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/citas/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Normalizar fecha a formato YYYY-MM-DD
  private normalizarFecha(fecha: any): string {
    if (!fecha) return '';

    // Si es un string en formato ISO (2025-10-17 o 2025-10-17T00:00:00)
    if (typeof fecha === 'string') {
      return fecha.split('T')[0]; // Extrae solo la parte de la fecha
    }

    // Si es un objeto Date
    if (fecha instanceof Date) {
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return '';
  }
}
