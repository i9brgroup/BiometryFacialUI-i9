import { Routes } from '@angular/router';

export const employeeRoutes: Routes = [
  {
    path: 'biometria',
    loadComponent: () => import('./employee-manager.component').then(m => m.EmployeeManagerComponent),
  },
];

