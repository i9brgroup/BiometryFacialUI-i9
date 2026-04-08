import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  const token = auth.getToken();

  // If there's no token, always redirect to login
  if (!token) {
    return router.createUrlTree(['/login']);
  }

  // If everything is fine (token exists and no specific role is needed)
  const expectedRole = route.data['expectedRole'];
  if (!expectedRole) {
    return true;
  }

  // If a role is expected, verify it
  const userRole = auth.getRoleByToken();
  if (expectedRole !== userRole) {
    snackBar.open("Acesso negado. Você não possui permissões suficientes.", "Fechar", {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
    return router.createUrlTree(['/employee']);
  }

  return true;
};

