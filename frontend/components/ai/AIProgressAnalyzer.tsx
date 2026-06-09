"use client";

import { useState } from "react";

interface ProgressRecord {
  weightKg: number | null;
  bodyFatPct: number | null;
  muscleMass: number | null;
  waistCm: number | null;
  recordedAt: string;
}

interface MemberData {
  weightKg: number | null;
  heightCm: number | null;
  fitnessGoals: string[];
  progressRecords: ProgressRecord[];
  totalAttendance: number;
  totalWorkouts: number;
}

interface Trend {
  metric: string;
  direction: string;
  change: string;
  insight: string;
}

interface Recommendation {
  category: string;
  action: string;
  priority: string;
}

interface Analysis {
  summary: string;
  trends: Trend[];
  achievements: string[];
  concerns: string[];
  recommendations: Recommendation[];
  nextGoals: string[];
  motivationalMessage: string;
}

export default function AIProgressAnalyzer({ memberData }: { memberData: MemberData }) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberData),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to analyze progress.");
      } else {
        setAnalysis(await res.json());
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const priorityColor: Record<string, string> = {
    high: "bg-red-100 text-red-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-green-100 text-green-700",
  };

  const trendIcon = (direction: string) =>
    direction === "improving" ? "📈" : direction === "declining" ? "📉" : "➡️";

  return (
    <div className="space-y-6">
      {/* Stats overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">{memberData.progressRecords.length}</p>
          <p className="text-xs text-gray-500 mt-1">Progress Records</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{memberData.totalAttendance}</p>
          <p className="text-xs text-gray-500 mt-1">Gym Visits</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{memberData.totalWorkouts}</p>
          <p className="text-xs text-gray-500 mt-1">Workout Plans</p>
        </div>
      </div>

      {memberData.progressRecords.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-4xl mb-3">📊</p>
          <p className="font-semibold text-yellow-800">No progress records yet</p>
          <p className="text-sm text-yellow-700 mt-1">
            Ask your trainer to record your measurements (weight, body fat, waist, etc.)
            before using the AI analyzer.
          </p>
        </div>
      ) : (
        <>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Analyzing your progress...
              </>
            ) : "📊 Analyze My Progress with AI"}
          </button>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>
          )}
        </>
      )}

      {analysis && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
            <h3 className="font-bold text-purple-900 mb-2">📋 Overall Assessment</h3>
            <p className="text-sm text-purple-800 leading-relaxed">{analysis.summary}</p>
          </div>

          {/* Motivational message */}
          <div className="bg-indigo-600 rounded-xl p-5 text-white">
            <p className="text-sm font-medium opacity-80 mb-1">🤖 Your AI Coach says:</p>
            <p className="text-base leading-relaxed">&ldquo;{analysis.motivationalMessage}&rdquo;</p>
          </div>

          {/* Trends */}
          {analysis.trends.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-4">📈 Progress Trends</h3>
              <div className="space-y-3">
                {analysis.trends.map((t, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="text-xl shrink-0">{trendIcon(t.direction)}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 text-sm">{t.metric}</p>
                        <span className="text-xs font-semibold text-gray-500">{t.change}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{t.insight}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements & concerns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {analysis.achievements.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h3 className="font-bold text-green-800 mb-3">🏆 Achievements</h3>
                <ul className="space-y-1.5">
                  {analysis.achievements.map((a, i) => (
                    <li key={i} className="text-sm text-green-700 flex gap-2">
                      <span className="shrink-0">✓</span>{a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.concerns.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h3 className="font-bold text-red-800 mb-3">⚠️ Areas of Attention</h3>
                <ul className="space-y-1.5">
                  {analysis.concerns.map((c, i) => (
                    <li key={i} className="text-sm text-red-700 flex gap-2">
                      <span className="shrink-0">•</span>{c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-4">💡 AI Recommendations</h3>
              <div className="space-y-3">
                {analysis.recommendations.map((r, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${priorityColor[r.priority] ?? "bg-gray-100 text-gray-600"}`}>
                      {r.priority}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-indigo-600">{r.category}</p>
                      <p className="text-sm text-gray-700 mt-0.5">{r.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next goals */}
          {analysis.nextGoals.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
              <h3 className="font-bold text-blue-800 mb-3">🎯 Suggested Next Goals</h3>
              <ul className="space-y-2">
                {analysis.nextGoals.map((g, i) => (
                  <li key={i} className="text-sm text-blue-700 flex gap-2">
                    <span className="shrink-0">{i + 1}.</span>{g}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full border-2 border-purple-300 text-purple-600 hover:bg-purple-50 font-semibold py-2.5 rounded-xl text-sm transition"
          >
            🔄 Re-analyze Progress
          </button>
        </div>
      )}
    </div>
  );
}
