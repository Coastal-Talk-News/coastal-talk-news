import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

const SIZE = 192;

/**
 * Drawn in the browser from the otpauth URI, so the secret is never put into
 * an image URL, a request or a log. Always black on white with a quiet zone:
 * scanners need the contrast, whatever theme the page is in.
 */
export function QrCode({ value }: { value: string }) {
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    void QRCode.toDataURL(value, {
      width: SIZE * 2,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' },
    }).then((url) => {
      if (current) setSource(url);
    });
    return () => {
      current = false;
    };
  }, [value]);

  return (
    <div
      className="grid shrink-0 place-items-center rounded-xl bg-white p-1 shadow-sm"
      style={{ width: SIZE + 8, height: SIZE + 8 }}
    >
      {source && (
        <img
          src={source}
          width={SIZE}
          height={SIZE}
          alt="QR code to add Coastal Talk News to your authenticator app"
        />
      )}
    </div>
  );
}
