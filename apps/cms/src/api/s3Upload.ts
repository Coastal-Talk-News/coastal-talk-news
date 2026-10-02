import type { S3UploadTicketDto } from '@coastal-talk-news/types';

export interface S3UploadResult {
  storageKey: string;
}

/**
 * Sends the file straight to an S3-compatible bucket (AWS S3, Cloudflare R2,
 * or anything else speaking the same API) over XHR, using a presigned POST
 * policy this server already minted. The file never touches our own API.
 */
export function uploadToS3(
  file: File,
  ticket: S3UploadTicketDto,
  onProgress?: (percent: number) => void,
): Promise<S3UploadResult> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    for (const [key, value] of Object.entries(ticket.fields)) {
      form.append(key, value);
    }
    // The file field must come after the policy fields in an S3 POST.
    form.append('file', file);

    const request = new XMLHttpRequest();
    request.open('POST', ticket.uploadUrl);

    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    });

    request.addEventListener('load', () => {
      // A presigned POST succeeds with 204 (or 201 with an XML body, if the
      // policy asked for one - this one doesn't). Either way the storage
      // key is already known from the ticket; nothing to parse out.
      if (request.status >= 200 && request.status < 300) {
        resolve({ storageKey: ticket.storageKey });
        return;
      }

      // S3-compatible error responses are XML, not JSON.
      const message = /<Message>(.*?)<\/Message>/.exec(
        request.responseText,
      )?.[1];
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
