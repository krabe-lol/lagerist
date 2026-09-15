"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { EntityType } from "@/lib/constants";

type Stage = "closed" | "starting" | "live" | "preview" | "uploading";

// Captures a photo entirely in-page (getUserMedia + canvas snapshot) instead
// of launching the native camera app via <input capture>. On Android,
// launching that external app backgrounds the tab, and the OS is free to
// kill it under memory pressure — the captured photo then has nowhere to be
// delivered once the user returns. Since this component never leaves the
// page, that class of failure can't happen. See KNOWN_ISSUES.md.
//
// Requires a secure context (HTTPS, or localhost) — getUserMedia is
// unavailable otherwise, which is surfaced as an error below rather than a
// silent failure.
export default function CameraCapture({ entityType, entityId }: { entityType: EntityType; entityId: string }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const blobRef = useRef<Blob | null>(null);

  const [stage, setStage] = useState<Stage>("closed");
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function clearPreview() {
    setPreviewUrl((url) => {
      if (url) URL.revokeObjectURL(url);
      return null;
    });
    blobRef.current = null;
  }

  async function open() {
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        'Kamera ist nur über eine sichere Verbindung (HTTPS) verfügbar. Bitte "Aus Galerie wählen" nutzen.'
      );
      return;
    }

    setStage("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setStage("live");
      // Attach after the <video> element has actually mounted (stage change above).
      requestAnimationFrame(() => {
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.play().catch(() => {});
        }
      });
    } catch (err) {
      setError(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? 'Kamera-Zugriff wurde verweigert. Bitte in den Browser-Einstellungen erlauben, oder "Aus Galerie wählen" nutzen.'
          : 'Kamera konnte nicht gestartet werden. Bitte "Aus Galerie wählen" nutzen.'
      );
      setStage("closed");
    }
  }

  function close() {
    stopStream();
    clearPreview();
    setStage("closed");
  }

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        blobRef.current = blob;
        setPreviewUrl(URL.createObjectURL(blob));
        stopStream();
        setStage("preview");
      },
      "image/jpeg",
      0.9
    );
  }

  function retake() {
    clearPreview();
    open();
  }

  async function confirm() {
    const blob = blobRef.current;
    if (!blob) return;

    setStage("uploading");
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", blob, `foto-${Date.now()}.jpg`);
      const params = new URLSearchParams({ entityType, entityId, kind: "PHOTO" });
      const res = await fetch(`/api/uploads?${params.toString()}`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Upload fehlgeschlagen. Bitte erneut versuchen.");
        setStage("preview");
        return;
      }

      close();
      router.refresh();
    } catch {
      setError("Upload fehlgeschlagen. Bitte erneut versuchen.");
      setStage("preview");
    }
  }

  if (stage === "closed") {
    return (
      <div className="flex flex-col gap-1">
        <button type="button" className="btn btn-primary btn-sm" onClick={open}>
          Foto aufnehmen
        </button>
        {error && (
          <div role="alert" className="alert alert-error py-2 text-sm">
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/90 p-4">
      {stage === "starting" && <span className="loading loading-spinner loading-lg text-white" />}

      <video
        ref={videoRef}
        playsInline
        muted
        className={`max-h-[70vh] max-w-full rounded-box ${stage === "live" ? "" : "hidden"}`}
      />
      {previewUrl && (stage === "preview" || stage === "uploading") && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="Vorschau" className="max-h-[70vh] max-w-full rounded-box" />
      )}
      <canvas ref={canvasRef} className="hidden" />

      {error && (
        <div role="alert" className="alert alert-error max-w-sm py-2 text-sm">
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-2">
        {stage === "live" && (
          <>
            <button type="button" className="btn btn-primary" onClick={capture}>
              Auslösen
            </button>
            <button type="button" className="btn btn-outline btn-neutral" onClick={close}>
              Abbrechen
            </button>
          </>
        )}
        {stage === "preview" && (
          <>
            <button type="button" className="btn btn-primary" onClick={confirm}>
              Verwenden
            </button>
            <button type="button" className="btn btn-outline btn-neutral" onClick={retake}>
              Wiederholen
            </button>
            <button type="button" className="btn btn-ghost text-white" onClick={close}>
              Abbrechen
            </button>
          </>
        )}
        {stage === "uploading" && <span className="loading loading-spinner loading-lg text-white" />}
      </div>
    </div>
  );
}
