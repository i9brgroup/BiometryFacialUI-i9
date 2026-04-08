import {ChangeDetectionStrategy, Component, inject, signal, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SidebarComponent} from '../shared/sidebar/sidebar.component';
import {FormBuilder, FormControl, FormGroupDirective, ReactiveFormsModule, Validators} from '@angular/forms';
import {AuthService} from '../auth.service';
import {firstValueFrom, merge, Observable} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

// Use Module imports for standalone components
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatSelectModule} from '@angular/material/select';
import {MatDividerModule} from '@angular/material/divider';
import { CreateLoginPayload, CreateLoginResponse } from '../auth.model';
import { AdminService } from './admin.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-create-login',
  imports: [
    CommonModule,
    SidebarComponent,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  standalone: true,
  templateUrl: './create-login.html',
  styleUrls: ['./create-login.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateLogin {

  private snackBar = inject(MatSnackBar);
  private adminService = inject(AdminService);
  loading = signal(false);
  error = signal<string | null>(null);
  protected readonly value = signal('');
  errorMessage = signal('')
  hide = signal(true);
  private fb = inject(FormBuilder);
  public readonly auth = inject(AuthService);
  @ViewChild(FormGroupDirective) formDirective!: FormGroupDirective;

  constructor() {
    merge(this.form.statusChanges, this.form.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateErrorMessage());
  }

  clickEvent(event: MouseEvent) {
    this.hide.update(v => !v);
    event.preventDefault();
    event.stopPropagation();
  }

  protected onInput(event: Event) {
    this.value.set((event.target as HTMLInputElement).value);
  }

  form = this.fb.group({
    username: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    siteId: ['', [Validators.required]],
    roles: ['', [Validators.required]]
  });

  updateErrorMessage() {
    if (this.form.hasError('required')) {
      this.errorMessage.set('Campo obrigatório');
    } else if (this.form.hasError('email')) {
      this.errorMessage.set('Email inválido');
    } else {
      this.errorMessage.set('');
    }
  }

  get emailFormControl(): FormControl {
    return this.form.get("email") as FormControl;
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  async submit() {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Preencha todos os campos.');
      return;
    }

    const payload = this.form.value as CreateLoginPayload;

    try {
      this.loading.set(true);
      const response: CreateLoginResponse = await firstValueFrom(this.adminService.createLogin(payload));
      if (response.status === 'success') {
        this.error.set('Login criado com sucesso!');
        this.openSnackBar('Login criado com sucesso!', 'Fechar');
        this.formDirective.resetForm();
      }
    } catch (error: any) {
      const message = error?.error?.detail || error?.message || 'Erro ao criar login';
      this.error.set(String(message));
    } finally {
      this.loading.set(false);
    }
  }
}

export default CreateLogin;
