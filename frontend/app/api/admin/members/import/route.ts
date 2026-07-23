import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { getTenantContextFromSession, requireAdmin, noTenantContext } from "@/lib/tenant";
import { auditLogger, AuditEventType } from "@/lib/auditLogger";
import Papa from "papaparse";

const MAX_ROWS = 1000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    const ctx = getTenantContextFromSession(session);

    // ── 1. Security & Isolation ───────────────────────────────────────────────
    const roleErr = requireAdmin(ctx);
    if (roleErr) return roleErr;
    if (!ctx) return noTenantContext();

    const tenantId = ctx.tenantId;

    // ── 2. Parse Multipart File ───────────────────────────────────────────────
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No CSV file uploaded." }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      return NextResponse.json({ error: "File must be a CSV." }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 5MB limit." }, { status: 400 });
    }

    const text = await file.text();
    if (!text.trim()) {
      return NextResponse.json({ error: "File is empty." }, { status: 400 });
    }

    // ── 3. Parse CSV (Using papaparse as requested for robustness) ────────────
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
    });

    if (parsed.errors.length > 0) {
      return NextResponse.json({ 
        error: "CSV parsing error. Ensure the file is a valid CSV.", 
        details: parsed.errors 
      }, { status: 400 });
    }

    const rows = parsed.data as any[];

    if (rows.length > MAX_ROWS) {
      return NextResponse.json({ 
        error: `Maximum row count exceeded. Please upload ${MAX_ROWS} rows or fewer.` 
      }, { status: 400 });
    }

    // ── 4. Process Rows Independently ─────────────────────────────────────────
    const summary = {
      totalRows: rows.length,
      imported: 0,
      alreadyExists: 0,
      invalid: 0,
      failed: 0,
      errors: [] as { row: number; email: string; reason: string }[],
    };

    let rowIndex = 0;
    for (const row of rows) {
      rowIndex++;
      const rawName = row.name || row.fullname || "";
      const rawEmail = row.email || "";

      const name = String(rawName).trim();
      const email = String(rawEmail).trim().toLowerCase();

      // Validation
      if (!name) {
        summary.invalid++;
        summary.errors.push({ row: rowIndex, email, reason: "Name is required." });
        continue;
      }
      if (!email || !EMAIL_REGEX.test(email)) {
        summary.invalid++;
        summary.errors.push({ row: rowIndex, email, reason: "Invalid email format." });
        continue;
      }

      // Check for existing user safely
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          if (existingUser.tenantId === tenantId) {
            // Case A: Existing user belongs to same tenant
            summary.alreadyExists++;
            summary.errors.push({ row: rowIndex, email, reason: "Already exists in your gym." });
          } else {
            // Case B: Existing user belongs to another tenant
            summary.failed++;
            summary.errors.push({ row: rowIndex, email, reason: "Email belongs to another gym on CortexFit." });
          }
          continue;
        }

        // Isolated transaction for this single row
        await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              email,
              name,
              role: "MEMBER",
              tenantId,
              // Note: password is left null, meaning they will login via Magic Link or reset password
            },
          });

          await tx.memberProfile.create({
            data: {
              userId: user.id,
            },
          });
        });

        summary.imported++;
      } catch (err: any) {
        summary.failed++;
        summary.errors.push({ row: rowIndex, email, reason: err.message || "Database error during insert." });
      }
    }

    // ── 5. Audit Logging ──────────────────────────────────────────────────────
    const eventType = "ADMIN_MEMBER_IMPORT_COMPLETED" as AuditEventType;
    const actorId = session?.user?.id;
    auditLogger.log(eventType, tenantId, {
      importedCount: summary.imported,
      skippedCount: summary.alreadyExists + summary.invalid,
      failedCount: summary.failed,
      timestamp: new Date().toISOString(),
    }, actorId);

    return NextResponse.json(summary);
  } catch (error: any) {
    console.error("[API] POST /api/admin/members/import error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
