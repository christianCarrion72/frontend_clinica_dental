import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./pages/usuarios/usuarios.component').then(m => m.UsuariosComponent),
    canActivate: [authGuard]
  },
  {
    path: 'pacientes',
    loadChildren: () => import('./pages/pacientes/pacientes.module').then(m => m.PacientesModule),
    canActivate: [authGuard]
  },
  {
    path: 'citas',
    loadComponent: () => import('./pages/citas/citas.component').then(m => m.CitasComponent),
    canActivate: [authGuard]
  },
  {
    path: 'cita-dia',
    loadComponent: () => import('./pages/citas/cita-dia.component').then(m => m.CitaDiaComponent),
    canActivate: [authGuard]
  },
  {
    path: 'horarios',
    loadComponent: () => import('./pages/horarios/horarios.component').then(m => m.HorariosComponent),
    canActivate: [authGuard]
  },
  {
    path: 'welcome',
    loadComponent: () => import('./pages/welcome/welcome.component').then(m => m.WelcomeComponent)
  },
  {
    path: 'paciente-detail/:id',
    loadComponent: () => import('./pages/paciente-detail/paciente-detail.component').then(m => m.PacienteDetailComponent)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];