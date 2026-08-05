import "dotenv/config";
import { prisma } from "../lib/prisma";
import readline from "readline";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { generateSandbox } from "../lib/sandbox/generate";

// --- 1. Production Execution Guard ---
if (process.env.NODE_ENV === "production") {
  console.error("❌ Sandbox generation is strictly disabled in production environments.");
  process.exit(1);
}

if (process.env.ALLOW_SANDBOX_GENERATION !== "true") {
  console.error("❌ Missing ALLOW_SANDBOX_GENERATION=true in environment variables.");
  console.error("Please explicitly allow sandbox generation to proceed.");
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> =>
  new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log("\n==============================================");
  console.log("   AUTOMATED SANDBOX GENERATOR (DEV/DEMO)   ");
  console.log("==============================================\n");

  // --- 2. Database Safety Check ---
  const dbUrl = process.env.DATABASE_URL || "unknown";
  // Extract just the host/db part to not leak credentials in terminal
  const dbTarget = dbUrl.split("@")[1] || dbUrl;
  
  console.log(`⚠️  TARGET DATABASE: ${dbTarget}`);
  const dbConfirm = await question("Proceed with data creation? (yes/no): ");
  if (dbConfirm.toLowerCase() !== "yes") {
    console.log("Aborted.");
    process.exit(0);
  }

  // Collect Inputs
  const gymName = await question("\nEnter Gym Name (e.g. Titan Fitness): ");
  const logoUrl = await question("Enter Logo URL (or press enter for default): ");
  const primaryColor = await question("Enter Primary Hex Color (e.g. #FF0000): ");

  if (!gymName) {
    console.error("Gym name is required.");
    process.exit(1);
  }

  // --- 6. Slug Collision Handling ---
    const result = await generateSandbox({
      gymName,
      logoUrl: logoUrl || undefined,
      primaryColor: primaryColor || undefined
    });

    console.log("\n✅ Sandbox Generated Successfully!");
    console.log("======================================");
    console.log(`Tenant Slug: ${result.tenant.slug}`);
    console.log(`Admin Email: ${result.adminEmail}`);
    console.log(`Trainer Email: ${result.trainerEmail}`);
    console.log(`Member Email: ${result.memberEmail}`);
    console.log("======================================");
    console.log("⚠️  Password is auto-generated. Use impersonation or reset the password manually if direct login is needed.");

  } catch (error) {
    console.error("\n❌ Transaction failed. Rollback complete.");
    console.error(error);
  } finally {
    rl.close();
  }
}

main();
