"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import jsQR from "jsqr";

interface JsqrScannerProps {
  onScan: (result: string) => void;
  onError?: (error: Error) => void;
}

export function JsqrScanner({ onScan, onError }: JsqrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  // Time tracking for 150ms throttling
  const lastScanTimeRef = useRef<number>(0);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    if (!isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && video.readyState === video.HAVE_ENOUGH_DATA && canvas) {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        // Set canvas dimensions to match video to extract full resolution data
        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        const now = performance.now();
        // Throttle to roughly every 150ms (~6 fps) to save CPU
        if (now - lastScanTimeRef.current >= 150) {
          lastScanTimeRef.current = now;

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Pure math decode (no WASM!)
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data) {
            // STOP SCANNING IMMEDIATELY to prevent duplicate hits
            setIsScanning(false);
            stopCamera();
            onScan(code.data);
            return; // Exit the loop completely
          }
        }
      }
    }

    if (isScanning) {
      requestRef.current = requestAnimationFrame(tick);
    }
  }, [isScanning, onScan, stopCamera]);

  useEffect(() => {
    let mounted = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        if (mounted && videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true"); // required to tell iOS safari we don't want fullscreen
          await videoRef.current.play();
          
          // Kick off the throttled scan loop
          requestRef.current = requestAnimationFrame(tick);
        }
      } catch (err: any) {
        console.error("Camera access failed:", err);
        setCameraError(err.message || "Failed to access camera");
        if (onError) onError(err);
      }
    }

    if (isScanning) {
      startCamera();
    }

    return () => {
      mounted = false;
      stopCamera();
    };
  }, [isScanning, tick, stopCamera, onError]);

  if (cameraError) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center font-medium">
        📸 Camera Access Denied or Unavailable
        <p className="text-sm mt-1 text-red-500 opacity-80">{cameraError}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-black aspect-[4/3] flex items-center justify-center">
      {/* Hidden canvas used solely for frame extraction */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Video feed */}
      <video 
        ref={videoRef} 
        className="absolute inset-0 min-w-full min-h-full object-cover"
        muted
        playsInline
      />

      {/* Targeting Overlay Wrapper */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Semi-transparent mask surrounding the target box */}
        <div className="absolute inset-0 border-[60px] border-black/40 backdrop-blur-[1px]"></div>
        
        {/* The Targeting Box */}
        <div className="absolute inset-0 m-[60px] border-2 border-indigo-500/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] sm:shadow-none">
          
          {/* Corner Brackets */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white -translate-x-[2px] -translate-y-[2px]"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white translate-x-[2px] -translate-y-[2px]"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white -translate-x-[2px] translate-y-[2px]"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white translate-x-[2px] translate-y-[2px]"></div>
          
          {/* Scanning Animation Line */}
          {isScanning && (
            <div className="absolute top-0 left-0 w-full h-[2px] bg-indigo-500 shadow-[0_0_12px_4px_rgba(99,102,241,0.5)] animate-[scan_2s_ease-in-out_infinite]" />
          )}

          {/* Centered Instruction Text */}
          <div className="absolute inset-0 flex items-center justify-center">
             <span className="bg-black/60 text-white px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase backdrop-blur-md">
                Align QR Code
             </span>
          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}} />
    </div>
  );
}
