import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ImageService {
  /**
   * Converts a base64 (dataURL) to a Blob.
   */
  b64toBlob(dataURI: string, contentType = ''): Blob {
    const base64 = dataURI.split(',')[1] ?? '';
    const byteString = atob(base64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: contentType });
  }

  /**
   * Generates a preview URL from a Blob.
   */
  generatePreviewUrl(blob: Blob | null): string | null {
    if (!blob) return null;
    return URL.createObjectURL(blob);
  }
}
