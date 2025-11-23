import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

interface LoginResponse {
  token: string;
  correo: string;
  rol: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  //private apiUrl = 'https://backend-clinica-dental.onrender.com/api/auth';
  private apiUrl = 'http://localhost:3000/api/auth';

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
        })
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('correo');
    this.router.navigate(['/login']);
  }

  getRole(): string {
    return localStorage.getItem('rol') || '';
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
  
  getUserData(): { correo: string; rol: string } | null {
    const correo = localStorage.getItem('correo');
    const rol = localStorage.getItem('rol');
    
    if (correo && rol) {
      return { correo, rol };
    }
    
    return null;
  }
}