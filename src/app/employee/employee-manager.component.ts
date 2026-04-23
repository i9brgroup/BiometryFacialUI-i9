import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { AuthService } from '../auth.service';
import { EmployeeService } from './employee.service';
import { ApiError, Employee, SearchEmployee } from './employee.model';
import { CameraService } from '../shared/services/camera.service';
import { ImageService } from '../shared/services/image.service';
import { EmployeeMapper } from './employee.model';

@Component({
  selector: 'app-employee-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SidebarComponent, MatPaginatorModule],
  templateUrl: './employee-manager.component.html',
  styleUrls: ['./employee-manager.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeManagerComponent {
  isShown = signal(false);
  private router = inject(Router);
  private employeeService = inject(EmployeeService);
  private cameraService = inject(CameraService);
  private imageService = inject(ImageService);
  private cd = inject(ChangeDetectorRef);
  public auth = inject(AuthService);

  @ViewChild('modalVideo') modalVideoRef?: ElementRef<HTMLVideoElement>;

  // State
  employee = signal<Employee | null>(null);
  saving = signal(false);
  errorState = signal<ApiError | null>(null);
  statusMessage = signal<string | null>(null);
  draftBlob = signal<Blob | null>(null);
  searchResults = signal<Employee[]>([]);
  searchModalOpen = signal(false);
  searching = signal(false);
  searchError = signal<string | null>(null);
  mirror = signal(true);
  modalOpen = signal(false);
  selectedEmployee = signal<Employee | null>(null);

  // Derived
  fullName = computed(() => {
    const e = this.selectedEmployee() || this.employee();
    return e ? `${e.firstName} ${e.lastName}` : '';
  });

  canSave = computed(() => !!this.draftBlob() && !this.saving() && !!this.selectedEmployee());

  cameraActive = this.cameraService.cameraActive;

  setMirror(value: boolean) {
    this.mirror.set(value);
  }

  performSearch(term: string) {
    const t = term?.trim();
    if (!t) return;

    this.isShown.set(true);
    this.searchModalOpen.set(true);
    this.searching.set(true);
    this.searchError.set(null);
    this.searchResults.set([]);

    this.employeeService.searchEmployees(t).subscribe({
      next: (res) => {
        this.searching.set(false);
        this.searchResults.set(res ? [res] : []);
      },
      error: (err: ApiError) => {
        this.searching.set(false);
        this.searchError.set(err.status === 404 ? 'Funcionário não encontrado' : (err?.message || 'Erro ao buscar usuário'));
        this.searchResults.set([]);
      },
    });
  }

  selectEmployee(emp: Employee) {
    if (!emp) return;
    this.employee.set(emp);
    this.searchModalOpen.set(false);
    this.selectedEmployee.set(emp);
  }

  onCapture(base64: string) {
    this.draftBlob.set(this.imageService.b64toBlob(base64, 'image/jpeg'));
    this.cameraService.stopCamera();
  }

  clearDraft() {
    this.draftBlob.set(null);
    this.statusMessage.set(null);
  }

  clearInputs() {
    this.employee.set(null);
    this.selectedEmployee.set(null);
    this.draftBlob.set(null);
    this.errorState.set(null);
    this.statusMessage.set(null);
    this.cameraService.stopCamera();
  }

  openCameraModal() {
    if (!this.selectedEmployee()) {
      this.errorState.set({ status: 400, message: 'Selecione um funcionário antes de abrir a câmera.' });
      return;
    }

    this.cameraService.stopCamera();
    this.modalOpen.set(true);
    this.cd.detectChanges();

    setTimeout(() => {
      const video = this.modalVideoRef?.nativeElement;
      if (video) {
        this.cameraService.startCamera(video).catch(() => {
          this.errorState.set({ status: 0, message: 'Não foi possível acessar a câmera.' });
        });
      }
    }, 100);
  }

  closeCameraModal() {
    this.modalOpen.set(false);
    this.cameraService.stopCamera();
  }

  async onModalCapture() {
    const video = this.modalVideoRef?.nativeElement;
    if (!video) return;

    try {
      this.takeSnapshot(video);
      this.closeCameraModal();
    } catch (err) {
      this.errorState.set({ status: 0, message: 'Falha ao capturar imagem.' });
    }
  }

  private takeSnapshot(video: HTMLVideoElement) {
    const canvas = document.createElement('canvas');
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;

    canvas.width = Math.floor(vw * 0.6);
    canvas.height = Math.floor(vh * 1.2);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cropW = Math.floor(vw * 0.6);
    const cropH = Math.floor(vh * 0.85);
    const sx = Math.max(0, Math.floor((vw - cropW) / 2));
    const sy = Math.max(0, Math.floor((vh - cropH) / 2));

    if (this.mirror()) {
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, sx, sy, cropW, cropH, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      ctx.drawImage(video, sx, sy, cropW, cropH, 0, 0, canvas.width, canvas.height);
    }

    this.onCapture(canvas.toDataURL('image/jpeg', 0.92));
  }

  saveBiometry() {
    const emp = this.selectedEmployee();
    const blob = this.draftBlob();
    if (!emp || !blob) return;

    this.saving.set(true);
    this.errorState.set(null);
    this.statusMessage.set(null);

    const file = new File([blob], emp.urlPhoto || `${emp.id}_biometry.jpg`, { type: 'image/jpeg' });

    this.employeeService.sendEmployeePayload(emp, file).subscribe({
      next: () => {
        this.statusMessage.set('Biometria salva com sucesso.');
        this.draftBlob.set(null);
        this.refreshEmployeeData(emp.id);
      },
      error: (err) => {
        this.saving.set(false);
        this.errorState.set({ status: err.status ?? 500, message: err.message || 'Falha ao enviar biometria.' });
      }
    });
  }

  private refreshEmployeeData(employeeId: string) {
    this.employeeService.searchEmployees(employeeId).subscribe({
      next: (updatedEmp) => {
        this.saving.set(false);
        if (updatedEmp) {
          this.selectedEmployee.set(updatedEmp);
          this.employee.set(updatedEmp);
          this.cd.detectChanges();
        }
      },
      error: () => this.saving.set(false)
    });
  }

  previewUrl(): string | null {
    return this.imageService.generatePreviewUrl(this.draftBlob());
  }

  onFileChange(event: Event) {
    if (!this.selectedEmployee()) {
      this.errorState.set({ status: 400, message: 'Selecione um funcionário antes de enviar um arquivo.' });
      return;
    }

    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => this.onCapture(e.target?.result as string);
    reader.readAsDataURL(file);
  }
}
