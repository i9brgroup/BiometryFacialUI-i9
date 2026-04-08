import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CameraService {
  private videoStream: MediaStream | null = null;
  cameraActive = signal(false);

  async startCamera(videoElement: HTMLVideoElement): Promise<MediaStream> {
    if (this.videoStream) {
      this.stopCamera();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false
      });
      
      this.videoStream = stream;
      videoElement.muted = true;
      try { videoElement.playsInline = true; } catch {}
      videoElement.setAttribute('playsinline', '');
      videoElement.autoplay = true;
      videoElement.style.objectFit = 'cover';
      videoElement.srcObject = stream;
      
      await videoElement.play();
      this.cameraActive.set(true);
      return stream;
    } catch (err) {
      this.cameraActive.set(false);
      throw err;
    }
  }

  stopCamera() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach((t) => t.stop());
      this.videoStream = null;
    }
    this.cameraActive.set(false);
  }

  isStreamActive(): boolean {
    return !!this.videoStream;
  }
}
