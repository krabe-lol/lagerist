"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";

export default function ScanClient() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Kamera wird gestartet …");
  const router = useRouter();

  useEffect(() => {
    let stream: MediaStream | null = null;
    let rafId: number;
    let stopped = false;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (stopped) return;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setStatus("Halte einen Lagerist-QR-Code in die Kamera.");
        tick();
      } catch {
        setError(
          "Kamera konnte nicht gestartet werden. Bitte Kamera-Zugriff erlauben (funktioniert nur über HTTPS oder localhost)."
        );
      }
    }

    function tick() {
      if (stopped) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code?.data) {
            handleResult(code.data);
            return;
          }
        }
      }
      rafId = requestAnimationFrame(tick);
    }

    function handleResult(data: string) {
      stopped = true;
      stream?.getTracks().forEach((t) => t.stop());
      try {
        const url = new URL(data, window.location.origin);
        setStatus(`Gefunden: ${url.pathname} — weiterleiten …`);
        router.push(url.pathname);
      } catch {
        setError(`Unbekannter QR-Code-Inhalt: ${data}`);
      }
    }

    start();

    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [router]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-box border border-base-300 bg-black">
        <video ref={videoRef} className="w-full" muted playsInline />
      </div>
      <canvas ref={canvasRef} className="hidden" />
      {error ? (
        <p className="max-w-md text-center text-error">{error}</p>
      ) : (
        <p className="text-base-content/70">{status}</p>
      )}
    </div>
  );
}
