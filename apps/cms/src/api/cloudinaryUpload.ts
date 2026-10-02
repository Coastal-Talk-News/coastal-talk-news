import type { CloudinaryUploadTicketDto } from '@coastal-talk-news/types';

export interface CloudinaryUploadResult {
  publicId: string;
}

interface CloudinarySuccessPayload {
  public_id?: string;
}

interface CloudinaryErrorPayload {
  error?: { message?: string };
}

/**
 * Sends the file straight to Cloudinary over XHR (for real upload-progress
 * events, which `fetch` can't report) using a signature this server already
 * minted. The file never touches our own API - this request's destination
 * is Cloudinary's own upload endpoint.
 */
export function uploadToCloudinary(
  file: File,
  signature: CloudinaryUploadTicketDto,
  onProgress?: (percent: number) => void,
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);
    form.append('api_key', signature.apiKey);
    form.append('timestamp', String(signature.timestamp));
    form.append('public_id', signature.publicId);
    form.append('allowed_formats', signature.allowedFormats);
    form.append('signature', signature.signature);

    const request = new XMLHttpRequest();
    request.open(
      'POST',
      `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
    );

    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    });

    request.addEventListener('load', () => {
      let payload: unknown = null;
      try {
        payload = JSON.parse(request.responseText);
      } catch {
        payload = null;
      }

      if (request.status >= 200 && request.status < 300) {
        const publicId = (payload as CloudinarySuccessPayload | null)
          ?.public_id;
        if (!publicId) {
          reject(new Error('Image storage did not confirm the upload.'));
          return;
        }
        resolve({ publicId });
        return;
      }

      const message = (payload as CloudinaryErrorPayload | null)?.error
        ?.message;
      reject(new Error(message || 'Upload to image storage failed.'));
    });

    request.addEventListener('error', () => {
      reject(
        new Error(
          'Could not reach image storage. Check your connection and try again.',
        ),
      );
    });

    request.send(form);
  });
}
