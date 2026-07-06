"use client";

import { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";

export function AccessPass() {
  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchQR = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/member/qr");
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate access pass");
      }
      
      setToken(data.token);
    } catch (err: any) {
      setError(err.message);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isOpen) {
      fetchQR();
      // Refresh token every 10 seconds
      interval = setInterval(() => {
        fetchQR();
      }, 10000);
    } else {
      setToken(null);
      setError(null);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, fetchQR]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-black text-white px-5 py-2.5 rounded-xl font-bold hover:bg-gray-800 transition flex items-center gap-2 shadow-md"
      >
        <span className="text-xl">📱</span>
        My Access Pass
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card text-card-foreground w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-indigo-600 p-4 text-center">
              <h2 className="text-xl font-bold text-white">Gym Access Pass</h2>
              <p className="text-indigo-100 text-sm mt-1">Scan at the front desk</p>
            </div>
            
            <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
              {error ? (
                <div className="text-center">
                  <div className="text-4xl mb-3">⚠️</div>
                  <p className="text-red-600 font-medium">{error}</p>
                  <button 
                    onClick={fetchQR}
                    className="mt-4 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted"
                  >
                    Try Again
                  </button>
                </div>
              ) : token ? (
                <div className="flex flex-col items-center relative">
                  <div className="bg-white p-4 rounded-xl shadow-sm relative overflow-hidden flex items-center justify-center">
                    <QRCodeSVG 
                      value={token} 
                      size={200}
                      level="M"
                      includeMargin={true}
                      bgColor="#FFFFFF"
                      fgColor="#000000"
                    />
                  </div>
                  <p className="text-muted-foreground text-xs mt-4 flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Auto-refreshing securely
                  </p>
                </div>
              ) : (
                <div className="animate-pulse flex flex-col items-center">
                  <div className="w-[200px] h-[200px] bg-muted rounded-xl" />
                  <div className="h-4 w-32 bg-muted rounded mt-4" />
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border bg-muted">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full bg-card text-card-foreground border border-border text-foreground py-2.5 rounded-lg font-semibold hover:bg-muted transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(220px); }
          100% { transform: translateY(0); }
        }
      `}} />
    </>
  );
}
