import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {AuthService} from './auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  const token = auth.getToken();

  // Se não houver token, redireciona para login
  if (!token) {
    return router.createUrlTree(['/login']);
  }

  const userRole = auth.getRoleByToken();
  const expectedRole = route.data['expectedRole'];

  // Se houver uma role esperada e o usuário não a tiver
  if (expectedRole && expectedRole !== userRole) {
    const message = "Acesso negado. Você não possui permissões para acessar essa rota."
    const action = "Fechar";

    snackBar.open(message, action, {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });

    return router.createUrlTree(['/employee']);
  }

  // Se tudo estiver certo, permite o acesso
  return true;
};

