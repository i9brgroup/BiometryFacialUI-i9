import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { firstValueFrom } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class Login {
  // sinais para os campos
  loading = signal(false);
  error = signal<string | null>(null);

  private fb = inject(FormBuilder);
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  // Expose FormControl for template binding
  get emailFormControl(): FormControl {
    return this.form.get('email') as FormControl;
  }

  // ErrorStateMatcher implementation (mirror of example provided)
  matcher = new MyErrorStateMatcher();

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  async submit() {
    this.error.set(null);
    if (this.form.invalid) {
      // mark touched so mat-error shows
      this.form.markAllAsTouched();
      this.error.set('Preencha email e senha.');
      return;
    }

    const { email, password } = this.form.value as { email: string; password: string };
    try {
      this.loading.set(true);
      await firstValueFrom(this.auth.login({ email, password }));
      await this.router.navigate(['/employee']);
    } catch (err: any) {
      const msg = err.error?.message || 'Erro ao autenticar';
      console.log('erro', msg);
      this.error.set(String(msg));
    } finally {
      this.loading.set(false);
    }
  }
}

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = !!(form && form.submitted);
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}
