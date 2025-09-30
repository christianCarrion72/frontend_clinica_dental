import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface User {
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
  // Propiedades específicas para cada tipo de usuario
  especialidad?: string; // Para dentistas
  area?: string; // Para administrativos
  cargo?: string; // Para administrativos
}

export interface CreateUserDto {
  nombre: string;
  correo: string;
  password: string;
  telefono: string;
  direccion: string;
  estado?: boolean;
  especialidad?: string; // Para dentistas
  area?: string; // Para administrativos
  cargo?: string; // Para administrativos
}

export interface UpdateUserDto {
  nombre?: string;
  correo?: string;
  password?: string;
  telefono?: string;
  direccion?: string;
  estado?: boolean;
  especialidad?: string; // Para dentistas
  area?: string; // Para administrativos
  cargo?: string; // Para administrativos
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3000/api/users';

  constructor(private http: HttpClient) { }
  
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  createDentist(createUserDto: CreateUserDto): Observable<User> {
    const backendData = {
      nombre: createUserDto.nombre,
      correo: createUserDto.correo,
      contraseña: createUserDto.password,
      telefono: createUserDto.telefono,
      direccion: createUserDto.direccion,
      especialidad: createUserDto.especialidad
    };
    return this.http.post<User>(`${this.apiUrl}/dentist`, backendData, { headers: this.getHeaders() });
  }

  
  updateDentist(id: number, updateUserDto: UpdateUserDto): Observable<User> {
    const backendData = {
      ...(updateUserDto.nombre && { nombre: updateUserDto.nombre }),
      ...(updateUserDto.correo && { correo: updateUserDto.correo }),
      ...(updateUserDto.password && { contraseña: updateUserDto.password }),
      ...(updateUserDto.telefono && { telefono: updateUserDto.telefono }),
      ...(updateUserDto.direccion && { direccion: updateUserDto.direccion }),
      ...(updateUserDto.especialidad && { especialidad: updateUserDto.especialidad })
    };
    return this.http.put<User>(`${this.apiUrl}/dentist/${id}`, backendData, { headers: this.getHeaders() });
  }

  createAdministrative(createUserDto: CreateUserDto): Observable<User> {
    const backendData = {
      nombre: createUserDto.nombre,
      correo: createUserDto.correo,
      contraseña: createUserDto.password,
      telefono: createUserDto.telefono,
      direccion: createUserDto.direccion,
      area: createUserDto.area,
      cargo: createUserDto.cargo
    };
    return this.http.post<User>(`${this.apiUrl}/administrative`, backendData, { headers: this.getHeaders() });
  }

  updateAdministrative(id: number, updateUserDto: UpdateUserDto): Observable<User> {
    const backendData = {
      ...(updateUserDto.nombre && { nombre: updateUserDto.nombre }),
      ...(updateUserDto.correo && { correo: updateUserDto.correo }),
      ...(updateUserDto.password && { contraseña: updateUserDto.password }),
      ...(updateUserDto.telefono && { telefono: updateUserDto.telefono }),
      ...(updateUserDto.direccion && { direccion: updateUserDto.direccion }),
      ...(updateUserDto.area && { area: updateUserDto.area }),
      ...(updateUserDto.cargo && { cargo: updateUserDto.cargo })
    };
    return this.http.put<User>(`${this.apiUrl}/administrative/${id}`, backendData, { headers: this.getHeaders() });
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}