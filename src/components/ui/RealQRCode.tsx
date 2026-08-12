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

export function downloadQrPng(value: string, color: string, filename: string) {
  QRCode.toDataURL(value, {
    width: 512,
    margin: 2,
    color: { dark: color, light: '#FFFFFF' },
    errorCorrectionLevel: 'M',
  }, (err: Error | null | undefined, url: string) => {
    if (err || !url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    a.click();
  });
}

export function downloadQrSvg(value: string, color: string, filename: string) {
  QRCode.toString(value, {
    type: 'svg',
    margin: 2,
    color: { dark: color, light: '#FFFFFF' },
    errorCorrectionLevel: 'M',
  }, (err: Error | null | undefined, svg: string) => {
    if (err || !svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  });
}
