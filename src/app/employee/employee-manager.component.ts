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
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {EmployeeService} from './employee.service';
import {ApiError, Employee, Page, SearchEmployee} from './employee.model';
import {SidebarComponent} from '../shared/sidebar/sidebar.component';
import {Router} from '@angular/router';
import {AuthService} from '../auth.service';


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
  private cd = inject(ChangeDetectorRef);
  public auth = inject(AuthService);

  @ViewChild('modalVideo') modalVideoRef?: ElementRef<HTMLVideoElement>;

  // Inputs (could be wired to route / parent)
  employeeId = signal<string | null>(null);

  // State
  employee = signal<Employee | null>(null);
  // removed unused `loading` signal
  saving = signal(false);
  errorState = signal<ApiError | null>(null);
  statusMessage = signal<string | null>(null);

  // Draft image blob (captured)
  draftBlob = signal<Blob | null>(null);

  // Search modal state
  searchResults = signal<SearchEmployee[]>([]);
  searchModalOpen = signal(false);
  searching = signal(false);
  searchError = signal<string | null>(null);

  // Webcam state
  cameraActive = signal(false);
  videoStream: MediaStream | null = null;

  // Mirror preview flag (true = mirror preview like a mirror)
  mirror = signal(true);

  // Modal state
  modalOpen = signal(false);

  // Keep track of the selected SearchEmployee (original API shape)
  selectedSearchEmployee = signal<SearchEmployee | null>(null);

  // Derived
  fullName = computed(() => {
    const e = this.employee();
    return e ? `${e.firstName} ${e.lastName}` : '';
  });

  canSave = computed(() => !!this.draftBlob() && !this.saving() && !!this.selectedSearchEmployee())

  // Public API
  setMirror(value: boolean) {
    this.mirror.set(value);
  }

  // removed unused search() helper - use performSearch directly from template

  // New: perform search and open results modal
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
        const msg = err.status === 404 ? 'Funcionário não encontrado' : (err?.message || 'Erro ao buscar usuário');
        this.searchError.set(msg);
        this.searchResults.set([]);
      },
    });
  }

  // Removed handlePageEvent as pagination is no longer supported by the API

  selectEmployee(emp: SearchEmployee) {
    if (!emp) return;
    // Map remote fields to local model if necessary
    const split = (emp.name || '').split(' ');
    const e: Employee = {
      id: emp.id,
      firstName: split[0] ?? emp.name ?? '',
      lastName: split.slice(1).join(' ') ?? '',
      badge: emp.id,
      siteID: emp.siteId,
      localID: emp.localId,
      tem_biometria: !!emp.faceTemplate,
      photoUrl: (emp as any).photoUrl ?? null,
      email: emp.email,
    } as Employee;

    this.employee.set(e);
    this.employeeId.set(emp.id);
    this.searchModalOpen.set(false);
    // set selected original
    this.selectedSearchEmployee.set(emp);
  }

  onCapture(base64: string) {
    // convert to blob and set draft
    const blob = this.b64toBlob(base64, 'image/jpeg');
    this.draftBlob.set(blob);
    // stop camera after capture
    this.stopCamera();
  }

  clearDraft() {
    this.draftBlob.set(null);
    this.statusMessage.set(null);
  }

  clearInputs() {
    this.employeeId.set(null);
    this.employee.set(null);
    // also clear the selected SearchEmployee to avoid accidental uploads
    this.selectedSearchEmployee.set(null);
    this.draftBlob.set(null);
    this.errorState.set(null);
    this.statusMessage.set(null);
    this.stopCamera();
  }

  // Modal controls
  openCameraModal() {
    // Do not allow opening camera if there is no selected employee
    if (!this.selectedSearchEmployee()) {
      this.errorState.set({ status: 400, message: 'Selecione um funcionário antes de abrir a câmera.' });
      return;
    }

    // stop any existing inline camera first
    this.stopCamera();

    this.modalOpen.set(true);
    // Ensure view is updated
    this.cd.detectChanges();

    // Auto-attach camera after modal is visible
    setTimeout(() => {
      this.attachModalCamera(2000).then((ok) => {
        if (!ok) {
          this.errorState.set({ status: 0, message: 'Elemento de vídeo do modal não encontrado.' });
        }
      });
    }, 50);
  }

  // Wait for the modal video element to be present, then attach/start camera
  public async attachModalCamera(timeoutMs = 1000): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      // Trigger change detection to ensure ViewChild is populated
      try {
        this.cd.detectChanges();
      } catch {}

      const modalVideo = (this.modalVideoRef && this.modalVideoRef.nativeElement) ?? document.getElementById('modalVideoEl') ?? document.querySelector<HTMLVideoElement>('#modalVideoEl');
      if (modalVideo) {
        try {
          await this.startCamera(modalVideo as HTMLVideoElement);
          return true;
        } catch (err) {
          // continue retrying
        }
      }
      await new Promise((r) => setTimeout(r, 70));
    }
    return false;
  }

  closeCameraModal() {
    this.modalOpen.set(false);
    this.stopCamera();
  }

  async onModalCapture() {
    // Ensure modal video is attached and camera started before capture
    let modalVideo = (this.modalVideoRef && this.modalVideoRef.nativeElement) ?? document.getElementById('modalVideoEl') ?? document.querySelector<HTMLVideoElement>('#modalVideoEl');
    if (!modalVideo) {
      const ok = await this.attachModalCamera(1200);
      if (!ok) {
        this.errorState.set({ status: 0, message: 'Não foi possível acessar a câmera. Tente novamente.' });
        return;
      }
      modalVideo = (this.modalVideoRef && this.modalVideoRef.nativeElement) ?? document.getElementById('modalVideoEl') ?? document.querySelector<HTMLVideoElement>('#modalVideoEl');
    }

    if (!modalVideo) {
      this.errorState.set({ status: 0, message: 'Não foi possível acessar a câmera. Tente novamente.' });
      return;
    }

    try {
      await this.takeSnapshotModal(modalVideo as HTMLVideoElement);
    } catch (err) {
      this.errorState.set({ status: 0, message: 'Falha ao capturar a imagem. Tente novamente.' });
    }
  }

  // Webcam controls (native MediaDevices)
  async startCamera(videoElement: HTMLVideoElement) {
    if (this.cameraActive()) return;
    if (!videoElement) throw new Error('videoElement is required');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, audio: false });
      this.videoStream = stream;

      // Ensure consistent attributes for modal preview
      videoElement.muted = true; // avoid feedback
      // playsInline helps on iOS/Safari
      try { videoElement.playsInline = true; } catch {}
      videoElement.setAttribute('playsinline', '');
      videoElement.autoplay = true;
      videoElement.style.objectFit = 'cover';

      videoElement.srcObject = stream;
      await videoElement.play();
      this.cameraActive.set(true);
    } catch (err) {
      this.errorState.set({ status: 0, message: 'Não foi possível acessar a câmera' });
    }
  }

  async takeSnapshotModal(videoElement: HTMLVideoElement) {
    // Ensure video has data
    if (videoElement.readyState < 2) {
      await new Promise<void>((resolve) => {
        const onCan = () => { resolve(); videoElement.removeEventListener('canplay', onCan); };
        videoElement.addEventListener('canplay', onCan);
      });
    }

    // draw current frame to canvas and get dataURL
    const canvas = document.createElement('canvas');
    // For vertical framing, set canvas to portrait ratio
    const vw = videoElement.videoWidth || Math.max(videoElement.clientWidth, 480);
    const vh = videoElement.videoHeight || Math.max(videoElement.clientHeight, 640);

    // aim for portrait orientation (swap if landscape)
    if (vw > vh) {
      canvas.width = Math.floor(vw * 0.6);
      canvas.height = Math.floor(vh * 1.2);
    } else {
      canvas.width = Math.floor(vw * 0.6);
      canvas.height = Math.floor(vh * 1.2);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw centered crop based on overlay mask (vertical oval)
    const srcW = videoElement.videoWidth;
    const srcH = videoElement.videoHeight;
    const cropW = Math.floor(srcW * 0.6);
    const cropH = Math.floor(srcH * 0.85);
    const sx = Math.max(0, Math.floor((srcW - cropW) / 2));
    const sy = Math.max(0, Math.floor((srcH - cropH) / 2));

    if (this.mirror()) {
      // Mirror draw so the captured image matches the mirrored preview
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);

      // When the video is mirrored via CSS transform, drawImage will capture the natural feed; by flipping the canvas horizontally
      // we make the resulting image match what the user saw in the preview (mirror-like).
      ctx.drawImage(videoElement, sx, sy, cropW, cropH, 0, 0, canvas.width, canvas.height);

      ctx.restore();
    } else {
      // Normal draw
      ctx.drawImage(videoElement, sx, sy, cropW, cropH, 0, 0, canvas.width, canvas.height);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    this.onCapture(dataUrl);
    this.closeCameraModal();
  }

  stopCamera() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach((t) => t.stop());
      this.videoStream = null;
    }
    this.cameraActive.set(false);
  }

  // Save biometry: upload image (file) to S3 endpoint and then POST payload to FastAPI
  saveBiometry() {
    const emp = this.selectedSearchEmployee();
    const blob = this.draftBlob();
    if (!emp) {
      this.errorState.set({ status: 400, message: 'Nenhum funcionário selecionado.' });
      return;
    }
    if (!blob) {
      this.errorState.set({ status: 400, message: 'Nenhuma imagem capturada.' });
      return;
    }

    this.saving.set(true);
    this.errorState.set(null);
    this.statusMessage.set(null);

    const fileName = emp.photoUrl || `${emp.id}_biometry.jpg`;
    const file = new File([blob], fileName, {type: 'image/jpeg'});

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
          this.selectedSearchEmployee.set(updatedEmp);

          const split = (updatedEmp.name || '').split(' ');
          const e: Employee = {
            id: updatedEmp.id,
            firstName: split[0] ?? updatedEmp.name ?? '',
            lastName: split.slice(1).join(' ') ?? '',
            badge: updatedEmp.id,
            siteID: updatedEmp.siteId,
            localID: updatedEmp.localId,
            tem_biometria: !!updatedEmp.faceTemplate,
            photoUrl: (updatedEmp as any).photoUrl ?? null,
            email: updatedEmp.email,
          } as Employee;

          this.employee.set(e);
          this.cd.detectChanges();
        }
      },
      error: () => {
        this.saving.set(false);
        this.cd.detectChanges();
      }
    });
  }

  // Utility to convert base64 (dataURL) to Blob
  private b64toBlob(dataURI: string, contentType = ''): Blob {
    const base64 = dataURI.split(',')[1] ?? '';
    const byteString = atob(base64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: contentType });
  }

  // Helpers used from template
  previewUrl(): string | null {
    const b = this.draftBlob();
    if (!b) return null;
    return URL.createObjectURL(b);
  }

  onFileChange(event: Event) {
    // Prevent file upload if no employee is selected
    if (!this.selectedSearchEmployee()) {
      this.errorState.set({ status: 400, message: 'Selecione um funcionário antes de enviar um arquivo.' });
      return;
    }

    const input = event.target as HTMLInputElement | null;
    const file = input?.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => this.onCapture((e.target?.result as string) ?? '');
    reader.readAsDataURL(file);
  }
}
