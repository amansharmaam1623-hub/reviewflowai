import { useEffect, useRef, useState, useCallback } from 'react';
import QRCode from 'qrcode';

interface RealQRCodeProps {
  value: string;
  color?: string;
  /** Render resolution in pixels (the canvas is then scaled responsively via CSS) */
  size?: number;
  className?: string;
}

export function RealQRCode({ value, color = '#202124', size = 320, className = '' }: RealQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  const draw = useCallback(() => {
    if (!canvasRef.current || !value) return;
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      color: { dark: color, light: '#FFFFFF' },
      errorCorrectionLevel: 'M',
    }, (err) => {
      setError(!!err);
    });
  }, [value, color, size]);

  useEffect(() => {
    draw();
  }, [draw]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-ink-50 rounded-lg ${className}`} style={{ maxWidth: size, aspectRatio: '1 / 1' }}>
        <span className="text-xs text-ink-400">QR error</span>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: 'auto', maxWidth: size, display: 'block' }}
    />
  );
}

export const QR_EXPORT_SIZE = 512;

/**
 * Both export formats go through here so they cannot drift apart again.
 * The anchor must be in the document - a detached one is a no-op in Firefox -
 * and the object URL must outlive the click, or the browser cancels the
 * download before it has finished reading the blob.
 */
function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

const withExt = (filename: string, ext: string) =>
  filename.endsWith(`.${ext}`) ? filename : `${filename}.${ext}`;

export async function downloadQrPng(value: string, color: string, filename: string) {
  const canvas = document.createElement('canvas');
  await QRCode.toCanvas(canvas, value, {
    width: QR_EXPORT_SIZE,
    margin: 2,
    color: { dark: color, light: '#FFFFFF' },
    errorCorrectionLevel: 'M',
  });
  await new Promise<void>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) saveBlob(blob, withExt(filename, 'png'));
      resolve();
    }, 'image/png');
  });
}

export async function downloadQrSvg(value: string, color: string, filename: string) {
  const svg = await QRCode.toString(value, {
    type: 'svg',
    // Without an explicit width the renderer emits a viewBox and no intrinsic
    // size, so the file lands as a ~29px stamp anywhere that is not a browser.
    width: QR_EXPORT_SIZE,
    margin: 2,
    color: { dark: color, light: '#FFFFFF' },
    errorCorrectionLevel: 'M',
  });
  saveBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), withExt(filename, 'svg'));
}
