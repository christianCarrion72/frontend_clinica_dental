import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginData = {
    correo: '',
    contrasena: ''
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    if (!this.loginData.correo || !this.loginData.contrasena) {
      console.error('Por favor, complete todos los campos');
      return;
    }

    this.authService.login(this.loginData).subscribe({
      next: (response) => {
        console.log('Login exitoso');
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Error al iniciar sesión:', error);
      }
    });
  }
}
