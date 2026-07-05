import fs from "fs";
import path from "path";

export const REPORTS_DIR = path.join(__dirname, "reports");
export const EVIDENCE_FILE = path.join(REPORTS_DIR, "evidence.json");

export type VerificationStatus = string;

export interface EvidenceEntry {
  status: VerificationStatus;
  exitCode?: number;
  executedAt?: string;
  [key: string]: any;
}

export function ensureReportsDir() {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
  const screenshotsDir = path.join(REPORTS_DIR, "screenshots");
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  if (!fs.existsSync(EVIDENCE_FILE)) {
    fs.writeFileSync(EVIDENCE_FILE, JSON.stringify({}, null, 2));
  }
}

export function recordEvidence(key: string, data: Partial<EvidenceEntry>) {
  ensureReportsDir();
  const existing = JSON.parse(fs.readFileSync(EVIDENCE_FILE, "utf-8"));
  existing[key] = {
    ...existing[key],
    executedAt: new Date().toISOString(),
    ...data,
  };
  fs.writeFileSync(EVIDENCE_FILE, JSON.stringify(existing, null, 2));
}

export function generateReportFile(filename: string, content: string) {
  ensureReportsDir();
  fs.writeFileSync(path.join(REPORTS_DIR, filename), content);
}
