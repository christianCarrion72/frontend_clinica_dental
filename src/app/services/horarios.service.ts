import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Horario {
  id: number;
  horaInicio: string;
  horaFin: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
  direccion: string;
  estado: boolean;
  rol: {
    id: number;
    nombre: string;
    descripcion: string;
  };
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface Dentista {
  id: number;
  nombre: string;
}

interface HorarioFecha {
  id: number;
  fecha: string;
  disponible: boolean;
  horario: Horario;
  dentista: {
    id: number;
    nombre?: string;
    especialidad?: string;
  };
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

interface CreateHorarioFechaDto {
  fecha: string;
  disponible: boolean;
  horarioId: number;
  dentistaId: number;
}

interface ResultadoGeneracion {
  exitosos: number;
  fallidos: number;
  detalles: Array<{
    dentista: string;
    horario: string;
    status: 'exitoso' | 'fallido';
    error?: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class HorariosService {
  private apiUrl = 'https://backend-clinica-dental.onrender.com/api';

  constructor(private http: HttpClient) {}

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getHeaders() {
    return { Authorization: `Bearer ${this.getToken()}` };
  }

  // ========== HORARIOS ==========

  /**
   * Obtiene todos los horarios disponibles en el sistema
   */
  getHorarios(): Observable<Horario[]> {
    return this.http.get<Horario[]>(`${this.apiUrl}/horarios`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Obtiene un horario específico por ID
   */
  getHorario(id: number): Observable<Horario> {
    return this.http.get<Horario>(`${this.apiUrl}/horarios/${id}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Crea un nuevo horario
   */
  createHorario(horarioData: { horaInicio: string; horaFin: string }): Observable<Horario> {
    return this.http.post<Horario>(`${this.apiUrl}/horarios`, horarioData, {
      headers: this.getHeaders()
    });
  }

  /**
   * Actualiza un horario existente
   */
  updateHorario(id: number, horarioData: Partial<Horario>): Observable<Horario> {
    return this.http.patch<Horario>(`${this.apiUrl}/horarios/${id}`, horarioData, {
      headers: this.getHeaders()
    });
  }

  /**
   * Elimina un horario (soft delete)
   */
  deleteHorario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/horarios/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ========== USUARIOS / DENTISTAS ==========

  /**
   * Obtiene todos los usuarios del sistema
   */
  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/users`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Filtra solo los dentistas de la lista de usuarios
   */
  getDentistas(usuarios: Usuario[]): Dentista[] {
    return usuarios
      .filter(user => user.rol.nombre === 'Dentista')
      .map(user => ({
        id: user.id,
        nombre: user.nombre
      }));
  }

  /**
   * Obtiene el ID de dentista a partir del ID de usuario
   */
  async getDentistaIdFromUserId(userId: number): Promise<number> {
    try {
      console.log(`[Service] Llamando a: ${this.apiUrl}/users/dentistUser/${userId}`);
      
      const response = await this.http.get<number>(
        `${this.apiUrl}/users/dentistUser/${userId}`, 
        { headers: this.getHeaders() }
      ).toPromise();
      
      console.log('[Service] Respuesta recibida:', response);
      console.log('[Service] Tipo de respuesta:', typeof response);
      
      // Convertir la respuesta a número si viene como string
      const dentistaId = typeof response === 'string' ? parseInt(response, 10) : response;
      
      console.log('[Service] ID convertido:', dentistaId);
      
      if (dentistaId === null || dentistaId === undefined || isNaN(dentistaId)) {
        throw new Error('No se recibió un ID válido del servidor');
      }
      
      if (dentistaId <= 0) {
        throw new Error('El ID del dentista debe ser mayor a 0');
      }
      
      return dentistaId;
    } catch (error: any) {
      console.error('[Service] Error en getDentistaIdFromUserId:', error);
      
      // Manejar diferentes tipos de errores
      if (error.status === 404) {
        throw new Error('El usuario no es un dentista o no existe');
      } else if (error.status === 401) {
        throw new Error('No autorizado. Por favor, inicia sesión nuevamente');
      } else if (error.status === 0) {
        throw new Error('No se pudo conectar al servidor');
      } else if (error.error?.message) {
        throw new Error(error.error.message);
      } else {
        throw new Error(error.message || 'Error desconocido al obtener ID de dentista');
      }
    }
  }

  /**
   * Obtiene solo los dentistas directamente (versión observable)
   */
  getDentistasObservable(): Observable<Dentista[]> {
    return new Observable(observer => {
      this.getUsuarios().subscribe({
        next: (usuarios) => {
          const dentistas = this.getDentistas(usuarios);
          observer.next(dentistas);
          observer.complete();
        },
        error: (err) => observer.error(err)
      });
    });
  }

  // ========== HORARIO-FECHAS ==========

  /**
   * Obtiene todos los horarios-fecha
   */
  getHorariosFechas(): Observable<HorarioFecha[]> {
    return this.http.get<HorarioFecha[]>(`${this.apiUrl}/horario-fechas`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Obtiene un horario-fecha específico por ID
   */
  getHorarioFecha(id: number): Observable<HorarioFecha> {
    return this.http.get<HorarioFecha>(`${this.apiUrl}/horario-fechas/${id}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Obtiene horarios-fecha disponibles para una fecha específica
   */
  getHorariosFechasPorFecha(fecha: string): Observable<HorarioFecha[]> {
    return this.http.get<HorarioFecha[]>(`${this.apiUrl}/horario-fechas/fecha/${fecha}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Crea un nuevo horario-fecha
   */
  createHorarioFecha(data: CreateHorarioFechaDto): Observable<HorarioFecha> {
    return this.http.post<HorarioFecha>(`${this.apiUrl}/horario-fechas`, data, {
      headers: this.getHeaders()
    });
  }

  /**
   * Actualiza un horario-fecha existente
   */
  updateHorarioFecha(id: number, data: Partial<CreateHorarioFechaDto>): Observable<HorarioFecha> {
    return this.http.patch<HorarioFecha>(`${this.apiUrl}/horario-fechas/${id}`, data, {
      headers: this.getHeaders()
    });
  }

  /**
   * Elimina un horario-fecha (soft delete)
   */
  deleteHorarioFecha(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/horario-fechas/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ========== GENERACIÓN MASIVA ==========

  /**
   * Genera múltiples horarios-fecha para dentistas
   * @param fecha Fecha para la cual se generarán los horarios
   * @param asignaciones Array con las asignaciones de dentistas y sus horarios
   * @returns Promesa con el resultado de la generación
   */
  async generarHorariosFechasMasivo(
    fecha: string,
    asignaciones: Array<{
      dentista: Dentista;
      horarios: Horario[];
    }>
  ): Promise<ResultadoGeneracion> {
    const resultado: ResultadoGeneracion = {
      exitosos: 0,
      fallidos: 0,
      detalles: []
    };

    for (const asignacion of asignaciones) {
      // Convertir ID de usuario a ID de dentista
      let dentistaId: number;
      try {
        dentistaId = await this.getDentistaIdFromUserId(asignacion.dentista.id);
        console.log(`Usuario ID: ${asignacion.dentista.id} -> Dentista ID: ${dentistaId}`);
      } catch (error: any) {
        // Si falla la conversión, marcar todos los horarios de este dentista como fallidos
        console.error(`Error obteniendo ID de dentista para usuario ${asignacion.dentista.id}:`, error);
        for (const horario of asignacion.horarios) {
          resultado.fallidos++;
          resultado.detalles.push({
            dentista: asignacion.dentista.nombre,
            horario: `${this.formatearHora(horario.horaInicio)} - ${this.formatearHora(horario.horaFin)}`,
            status: 'fallido',
            error: `Error obteniendo ID de dentista: ${error.message || 'Error desconocido'}`
          });
        }
        continue; // Saltar al siguiente dentista
      }

      // Crear horarios-fecha con el ID de dentista correcto
      for (const horario of asignacion.horarios) {
        try {
          const dto: CreateHorarioFechaDto = {
            fecha: fecha,
            disponible: true,
            horarioId: horario.id,
            dentistaId: dentistaId // Usar el ID de dentista, no el de usuario
          };

          console.log('Creando horario-fecha:', dto);
          await this.createHorarioFecha(dto).toPromise();

          resultado.exitosos++;
          resultado.detalles.push({
            dentista: asignacion.dentista.nombre,
            horario: `${this.formatearHora(horario.horaInicio)} - ${this.formatearHora(horario.horaFin)}`,
            status: 'exitoso'
          });
        } catch (error: any) {
          console.error('Error creando horario-fecha:', error);
          resultado.fallidos++;
          resultado.detalles.push({
            dentista: asignacion.dentista.nombre,
            horario: `${this.formatearHora(horario.horaInicio)} - ${this.formatearHora(horario.horaFin)}`,
            status: 'fallido',
            error: error.error?.message || error.message || 'Error desconocido'
          });
        }
      }
    }

    return resultado;
  }

  // ========== UTILIDADES ==========

  /**
   * Formatea una hora de formato HH:MM:SS a HH:MM
   */
  formatearHora(hora: string): string {
    if (!hora) return '';
    return hora.slice(0, 5);
  }

  /**
   * Normaliza una fecha a formato YYYY-MM-DD
   */
  normalizarFecha(fecha: any): string {
    if (!fecha) return '';
    
    if (typeof fecha === 'string') {
      return fecha.split('T')[0];
    }
    
    if (fecha instanceof Date) {
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    return '';
  }

  /**
   * Verifica si un horario-fecha ya existe para evitar duplicados
   */
  existeHorarioFecha(
    fecha: string,
    horarioId: number,
    dentistaId: number,
    horariosFechas: HorarioFecha[]
  ): boolean {
    const fechaNormalizada = this.normalizarFecha(fecha);
    
    return horariosFechas.some(hf => {
      const hfFecha = this.normalizarFecha(hf.fecha);
      return hfFecha === fechaNormalizada &&
             hf.horario.id === horarioId &&
             hf.dentista.id === dentistaId;
    });
  }

  /**
   * Filtra horarios disponibles por dentista
   */
  getHorariosPorDentista(dentistaId: number, horariosFechas: HorarioFecha[]): HorarioFecha[] {
    return horariosFechas.filter(hf => 
      hf.dentista.id === dentistaId && hf.disponible
    );
  }

  /**
   * Agrupa horarios-fecha por dentista
   */
  agruparPorDentista(horariosFechas: HorarioFecha[]): Map<number, HorarioFecha[]> {
    const grupos = new Map<number, HorarioFecha[]>();
    
    horariosFechas.forEach(hf => {
      const dentistaId = hf.dentista.id;
      if (!grupos.has(dentistaId)) {
        grupos.set(dentistaId, []);
      }
      grupos.get(dentistaId)!.push(hf);
    });
    
    return grupos;
  }

  /**
   * Obtiene estadísticas de horarios para una fecha
   */
  getEstadisticasPorFecha(fecha: string, horariosFechas: HorarioFecha[]): {
    total: number;
    disponibles: number;
    ocupados: number;
    porDentista: Map<string, number>;
  } {
    const fechaNormalizada = this.normalizarFecha(fecha);
    const horariosDelDia = horariosFechas.filter(hf => 
      this.normalizarFecha(hf.fecha) === fechaNormalizada
    );

    const porDentista = new Map<string, number>();
    
    horariosDelDia.forEach(hf => {
      const nombreDentista = hf.dentista.nombre || `Dentista ${hf.dentista.id}`;
      porDentista.set(nombreDentista, (porDentista.get(nombreDentista) || 0) + 1);
    });

    return {
      total: horariosDelDia.length,
      disponibles: horariosDelDia.filter(hf => hf.disponible).length,
      ocupados: horariosDelDia.filter(hf => !hf.disponible).length,
      porDentista
    };
  }
}