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
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
