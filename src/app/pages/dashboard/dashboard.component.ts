import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  userEmail: string = '';
  userRole: string = '';
  userId: number | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Evitar bucles de redirección: decide acceso SOLO por token
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    const userData = this.authService.getUserData();
    this.userEmail = userData?.correo ?? '';
    this.userRole = userData?.rol ?? '';
    this.userId = userData?.id ?? null;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
