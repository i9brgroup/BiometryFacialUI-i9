import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/employee', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./login/login').then(m => m.Login) },
  { path: 'employee', loadComponent: () => import('./employee/employee-manager.component').then(m => m.EmployeeManagerComponent), canActivate: [authGuard] },
  { path: 'cadastro', loadComponent: () => import('./create-login/create-login').then(m => m.default), canActivate: [authGuard], data: { expectedRole: 'SUPER_ADMIN' } },
  { path: 'gerenciar-usuarios', loadComponent: () => import('./admin/manage-users.component').then(m => m.default), canActivate: [authGuard], data: { expectedRole: 'SUPER_ADMIN' } },
  { path: '**', redirectTo: '/login' }
];
