// Run: node scripts/scanner.mjs
// Scans blockchain every 2 minutes for pending deposits

import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Load env
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

// Dynamic import after env loaded
const { runScanner } = await import("../src/lib/scanner.js");

console.log("[Scanner] Started — checking every 2 minutes");
runScanner();
setInterval(runScanner, 2 * 60 * 1000);
