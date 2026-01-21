import { Component, ChangeDetectionStrategy, inject, signal, computed, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EmployeeService } from './employee.service';
import { Employee, ApiError } from './employee.model';
import { Subject, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-employee-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './employee-manager.component.html',
  styleUrls: ['./employee-manager.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeManagerComponent {
  private employeeService = inject(EmployeeService);
  private cd = inject(ChangeDetectorRef);

  @ViewChild('modalVideo') modalVideoRef?: ElementRef<HTMLVideoElement>;

  // Inputs (could be wired to route / parent)
  employeeId = signal<string | null>(null);

  // State
  employee = signal<Employee | null>(null);
  loading = signal(false);
  saving = signal(false);
  errorState = signal<ApiError | null>(null);
  statusMessage = signal<string | null>(null);

  // Draft image blob (captured)
  draftBlob = signal<Blob | null>(null);

  // Reactive search trigger
  private search$ = new Subject<string>();

  // Webcam state
  cameraActive = signal(false);
  videoStream: MediaStream | null = null;

  // Modal state
  modalOpen = signal(false);

  // Derived
  fullName = computed(() => {
    const e = this.employee();
    return e ? `${e.firstName} ${e.lastName}` : '';
  });

  canSave = computed(() => !!this.draftBlob() && !this.saving());

  constructor() {
    // React to search trigger
    this.search$
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.errorState.set(null);
          this.statusMessage.set(null);
          this.employee.set(null);
        }),
        switchMap((term) =>
          this.employeeService.findEmployee(term).pipe(
            tap((e) => this.employee.set(e)),
            catchError((err: ApiError) => {
              this.errorState.set(err);
              return of(null as unknown as Employee);
            }),
          ),
        ),
      )
      .subscribe(() => this.loading.set(false));
  }

  // Public API
  search(term: string) {
    if (!term) return;
    this.employeeId.set(term);
    this.search$.next(term);
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

  saveBiometry() {
    const id = this.employeeId();
    const blob = this.draftBlob();
    if (!id || !blob) return;
    this.saving.set(true);
    this.statusMessage.set('Enviando biometria...');
    this.employeeService
      .updateBiometry(id, blob)
      .pipe(
        tap((e) => {
          this.employee.set(e);
          this.statusMessage.set('Biometria atualizada com sucesso');
          this.draftBlob.set(null);
        }),
        catchError((err: ApiError) => {
          this.errorState.set(err);
          this.statusMessage.set(null);
          return of(null as unknown as Employee);
        }),
      )
      .subscribe(() => this.saving.set(false));
  }

  // Modal controls
  openCameraModal() {
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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, audio: false });
      this.videoStream = stream;
      // Do not mirror the video via CSS here; show natural feed so user movements match preview
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

    ctx.drawImage(videoElement, sx, sy, cropW, cropH, 0, 0, canvas.width, canvas.height);

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

  clearInputs() {
    this.employeeId.set(null);
    this.employee.set(null);
    this.draftBlob.set(null);
    this.errorState.set(null);
    this.statusMessage.set(null);
    this.stopCamera();
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
    const input = event.target as HTMLInputElement | null;
    const file = input?.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => this.onCapture((e.target?.result as string) ?? '');
    reader.readAsDataURL(file);
  }
}
