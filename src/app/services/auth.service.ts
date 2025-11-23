import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

interface LoginResponse {
  token: string;
  correo: string;
  rol: string;
  id: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://127.0.0.1:3000/api/auth';

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  login(credentials: { correo: string; contrasena: string }): Observable<LoginResponse> {

    const backendCredentials = {
      correo: credentials.correo,
      contraseña: credentials.contrasena
    };

    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, backendCredentials)
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
          localStorage.setItem('rol', response.rol);
          localStorage.setItem('correo', response.correo);
          localStorage.setItem('id', response.id.toString());
        })
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('correo');
    localStorage.removeItem('id');
    this.router.navigate(['/login']);
  }

  getRole(): string {
    return localStorage.getItem('rol') || '';
  }

  getId(): number | null {
    const id = localStorage.getItem('id');
    return id ? parseInt(id, 10) : null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getUserData(): { correo: string; rol: string; id: number } | null {
    const correo = localStorage.getItem('correo');
    const rol = localStorage.getItem('rol');
    const id = localStorage.getItem('id');

    if (correo && rol && id) {
      return { correo, rol, id: parseInt(id, 10) };
    }

    return null;
  }

  // Método para verificar todos los datos guardados (útil para debugging)
  getAllStoredData(): { token: string | null; correo: string | null; rol: string | null; id: string | null } {
    return {
      token: localStorage.getItem('token'),
      correo: localStorage.getItem('correo'),
      rol: localStorage.getItem('rol'),
      id: localStorage.getItem('id')
    };
  }
}
