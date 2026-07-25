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

  const [debug, setDebug] = useState("Initializing...");
  const scanCountRef = useRef(0);
  const isProcessingRef = useRef(false);
  const nativeDetectorRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        nativeDetectorRef.current = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      } catch (e) {
        console.warn("BarcodeDetector not fully supported", e);
      }
    }
  }, []);

  const lastScanTimeRef = useRef<number>(0);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

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

  const tick = useCallback(async () => {
    if (!isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const now = performance.now();

    // If currently processing a scan, just loop and skip decoding
    if (isProcessingRef.current) {
      requestRef.current = requestAnimationFrame(tick);
      return;
    }

    if (video && video.readyState >= 2 && video.videoWidth > 0 && canvas) {
      if (now - lastScanTimeRef.current >= 150) {
        lastScanTimeRef.current = now;
        scanCountRef.current += 1;

        try {
          // 1. Try Native Hardware Scanner First (Lightning Fast)
          if (nativeDetectorRef.current) {
            const barcodes = await nativeDetectorRef.current.detect(video);
            if (barcodes.length > 0) {
              const code = barcodes[0].rawValue;
              handleSuccess(code, "Native");
              return;
            }
          }

          // 2. Fallback to JSQR (Software Decoder)
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (ctx) {
            // Laptops don't have BarcodeDetector, but they have strong CPUs. 
            // Don't scale down aggressively. Allow up to 1280px to preserve QR details for blurry webcams.
            const scale = Math.min(1, 1280 / video.videoWidth);
            const drawWidth = Math.floor(video.videoWidth * scale);
            const drawHeight = Math.floor(video.videoHeight * scale);

            if (canvas.width !== drawWidth || canvas.height !== drawHeight) {
              canvas.width = drawWidth;
              canvas.height = drawHeight;
            }

            ctx.drawImage(video, 0, 0, drawWidth, drawHeight);
            const imageData = ctx.getImageData(0, 0, drawWidth, drawHeight);
            
            // Laptops struggle with glare and bloom from phone screens. 
            // attemptBoth is required for washed out contrast.
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "attemptBoth" 
            });

            if (code && code.data) {
              handleSuccess(code.data, "jsQR");
              return;
            } else {
              setDebug(`Native:False | Res:${drawWidth}x${drawHeight} | Scans:${scanCountRef.current}`);
            }
          }
        } catch (err) {
          console.error("Scan error:", err);
        }
      }
    } else if (video) {
       setDebug(`Waiting for video...`);
    }

    if (isScanning) {
      requestRef.current = requestAnimationFrame(tick);
    }
  }, [isScanning]);

  const handleSuccess = (data: string, engine: string) => {
    isProcessingRef.current = true; // Pause decoding
    setDebug(`SUCCESS (${engine})`);
    
    // Call the parent API asynchronously without unmounting
    (async () => {
      try {
        await Promise.resolve(onScanRef.current(data));
      } catch (e) {
        console.error(e);
      } finally {
        // Cooldown period before scanning again (prevents double scans)
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 1500);
        
        // Re-schedule tick if it dropped
        if (!requestRef.current && isScanning) {
          requestRef.current = requestAnimationFrame(tick);
        }
      }
    })();
  };

  useEffect(() => {
    let mounted = true;

    async function startCamera() {
      try {
        setDebug("Requesting camera...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: { ideal: "environment" },
            // Ask for HD resolution. If the phone is portrait, 1080 is the width!
            width: { ideal: 1080 },
            height: { ideal: 1920 }
          }
        });

        if (mounted && videoRef.current) {
          setDebug("Camera granted. Starting...");
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true"); 
          await videoRef.current.play();
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning]); 

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
        autoPlay
      />

      {/* Targeting Overlay Wrapper */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute inset-0 border-[60px] border-black/40 backdrop-blur-[1px]"></div>
        
        <div className="absolute inset-0 m-[60px] border-2 border-indigo-500/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] sm:shadow-none">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white -translate-x-[2px] -translate-y-[2px]"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white translate-x-[2px] -translate-y-[2px]"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white -translate-x-[2px] translate-y-[2px]"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white translate-x-[2px] translate-y-[2px]"></div>
          
          {isScanning && (
            <div className="absolute top-0 left-0 w-full h-[2px] bg-indigo-500 shadow-[0_0_12px_4px_rgba(99,102,241,0.5)] animate-[scan_2s_ease-in-out_infinite]" />
          )}

          <div className="absolute inset-0 flex items-center justify-center">
             <span className="bg-black/60 text-white px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase backdrop-blur-md">
                Align QR Code
             </span>
          </div>
        </div>

        {/* ON-SCREEN DEBUG INFO */}
        <div className="absolute bottom-2 left-2 right-2 bg-black/80 text-green-400 text-[10px] font-mono p-1.5 rounded z-50 text-center">
          {debug}
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
