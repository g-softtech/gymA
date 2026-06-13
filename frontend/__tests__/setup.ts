import { beforeAll } from "vitest";
import { execSync } from "child_process";

beforeAll(() => {
  // Use dotenv-cli via npm script or directly if needed
  // Assuming npx dotenv -e .env.test is run before vitest, process.env.DATABASE_URL points to test DB
  // execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
});
