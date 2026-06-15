"use client";

import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

type MemberData = {
  id: string;
  user: { name: string; email: string; image: string | null };
};

type CheckInResponse = {
  success?: boolean;
  blocked?: boolean;
  reason?: string;
  error?: string;
  member?: MemberData;
  upcomingBookings?: any[];
  attendanceId?: string;
};

export function CheckInKiosk() {
  const [scanResult, setScanResult] = useState<CheckInResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideTarget, setOverrideTarget] = useState<{ memberId: string, originalMethod?: string } | null>(null);
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Initialize QR Scanner only on mount (client-side)
    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scannerRef.current.render(
      (decodedText) => {
        // Debounce/Prevent duplicate rapid scans
        if (!loading) {
          handleScan(decodedText);
        }
      },
      (error) => {
        // ignore continuous scanning errors
      }
    );

    return () => {
      scannerRef.current?.clear().catch(console.error);
    };
  }, [loading]);

  const handleScan = async (token: string) => {
    if (!navigator.onLine) {
      setScanResult({ error: "OFFLINE: RETRY CONNECTION" });
      return;
    }
    setLoading(true);
    setScanResult(null);
    try {
      const res = await fetch("/api/admin/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, method: "QR" })
      });
      const data = await res.json();
      setScanResult(data);
      
      // Vibration feedback
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        if (data.success) {
          navigator.vibrate(200); // Success short vibration
        } else if (data.blocked || data.error) {
          navigator.vibrate([200, 100, 200]); // Failure double vibration
        }
      }

      if (data.blocked) {
        setOverrideTarget({ memberId: data.memberId, originalMethod: "QR" });
      }
    } catch (err: any) {
      setScanResult({ error: "OFFLINE: RETRY CONNECTION" });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.length < 2) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/checkin/lookup?query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.members || []);
      setScanResult(null); // Clear previous scan UI
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheckIn = async (memberId: string) => {
    setLoading(true);
    setScanResult(null);
    try {
      const res = await fetch("/api/admin/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, method: "MANUAL" })
      });
      const data = await res.json();
      setScanResult(data);
      
      if (data.blocked) {
        setOverrideTarget({ memberId: data.memberId, originalMethod: "MANUAL" });
      }
    } catch (err: any) {
      setScanResult({ error: "Network error." });
    } finally {
      setLoading(false);
    }
  };

  const submitOverride = async (overrideType: string) => {
    if (!overrideTarget) return;
    setLoading(true);
    setShowOverrideModal(false);
    
    try {
      const res = await fetch("/api/admin/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          memberId: overrideTarget.memberId, 
          method: "MANUAL",
          originalMethod: overrideTarget.originalMethod,
          overrideType 
        })
      });
      const data = await res.json();
      setScanResult(data);
      setOverrideTarget(null);
    } catch (err) {
      setScanResult({ error: "Failed to apply override." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      {/* LEFT COL: Scanner & Search */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 font-semibold text-gray-800">
            QR Scanner
          </div>
          <div className="p-4">
            <div id="qr-reader" className="w-full overflow-hidden rounded-lg border-2 border-dashed border-gray-200"></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 bg-gray-50 font-semibold text-gray-800">
            Manual Search
          </div>
          <div className="p-4">
            <form onSubmit={handleManualSearch} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Name or Email..." 
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button 
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                Search
              </button>
            </form>

            {searchResults.length > 0 && (
              <div className="mt-4 border border-gray-100 rounded-lg divide-y divide-gray-100 max-h-60 overflow-y-auto">
                {searchResults.map(member => (
                  <div key={member.id} className="flex justify-between items-center p-3 hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{member.user.name}</p>
                      <p className="text-xs text-gray-500">{member.user.email}</p>
                    </div>
                    <button 
                      onClick={() => handleManualCheckIn(member.id)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-md font-medium"
                    >
                      Check In
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COL: Status Screen */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 min-h-[400px] flex flex-col relative overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-900 text-white font-semibold flex justify-between items-center">
          <span>Check-In Status</span>
          {loading && <span className="animate-pulse text-xs bg-indigo-500 px-2 py-1 rounded">Processing...</span>}
        </div>
        
        <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
          {!scanResult ? (
            <div className="text-gray-400">
              <div className="text-6xl mb-4">📱</div>
              <p>Waiting for scan...</p>
            </div>
          ) : scanResult.success ? (
            <div className="animate-in zoom-in duration-300">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-4 border-4 border-green-200">
                ✓
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Access Granted</h2>
              <p className="text-lg text-gray-600 mb-6">{scanResult.member?.user.name}</p>
              
              {scanResult.upcomingBookings && scanResult.upcomingBookings.length > 0 && (
                <div className="bg-indigo-50 text-indigo-800 p-4 rounded-lg text-sm text-left w-full max-w-sm">
                  <p className="font-semibold mb-2">Upcoming Sessions Found:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    {scanResult.upcomingBookings.map((b: any) => (
                      <li key={b.id}>{b.classSession ? `Class: ${b.classSession.title}` : 'Trainer Session'}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-indigo-500 mt-2 italic">Attendance automatically linked.</p>
                </div>
              )}
            </div>
          ) : scanResult.blocked ? (
            <div className="animate-in zoom-in duration-300 w-full max-w-sm">
              <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-4 border-4 border-red-200">
                ✗
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Access Denied</h2>
              <p className="text-lg text-gray-600 mb-2">{scanResult.member?.user.name}</p>
              <p className="text-red-600 font-medium mb-6 bg-red-50 p-3 rounded-lg border border-red-100">
                Reason: {scanResult.reason}
              </p>
              
              <button 
                onClick={() => setShowOverrideModal(true)}
                className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition shadow-sm"
              >
                Manual Override
              </button>
            </div>
          ) : scanResult.error?.includes("RETRY CONNECTION") ? (
            <div className="animate-in zoom-in duration-300">
              <div className="w-24 h-24 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 border-4 border-gray-200">
                📡
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Offline Mode</h2>
              <button 
                onClick={() => setScanResult(null)}
                className="bg-gray-900 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-800 transition shadow-sm"
              >
                RETRY CONNECTION
              </button>
            </div>
          ) : (
            <div className="animate-in zoom-in duration-300">
              <div className="w-24 h-24 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-4 border-4 border-yellow-200">
                !
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-100 max-w-sm mx-auto">
                {scanResult.error}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="bg-red-600 p-4">
              <h3 className="text-white font-bold text-lg">Admin Override</h3>
              <p className="text-red-100 text-sm">Bypass membership lock</p>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                Select the reason for overriding the gate. This action will be securely logged to your staff account.
              </p>
              
              <button onClick={() => submitOverride("EMERGENCY_ACCESS")} className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-lg font-medium text-gray-800 transition">
                🚨 Emergency Access
              </button>
              <button onClick={() => submitOverride("PROMOTIONAL_ACCESS")} className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-lg font-medium text-gray-800 transition">
                🎟️ Promotional / Guest
              </button>
              <button onClick={() => submitOverride("STAFF_TESTING")} className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-lg font-medium text-gray-800 transition">
                🔧 Staff Testing
              </button>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setShowOverrideModal(false)}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
