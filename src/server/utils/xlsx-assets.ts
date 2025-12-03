// server/utils/xlsx-assets.ts
import { resolve } from "node:path";
import { copyFileSync, mkdirSync } from "node:fs";

export default defineNitroPlugin(() => {
  // Only run during build
  if (process.env.NODE_ENV === "production") {
    const srcDir = resolve("./node_modules/xlsx/dist");
    const destDir = resolve("./.output/public/_xlsx_dist");
    
    mkdirSync(destDir, { recursive: true });
    
    // Copy critical files
    ["xlsx.full.min.js", "cpexcel.js"].forEach(file => {
      try {
        copyFileSync(
          resolve(srcDir, file),
          resolve(destDir, file)
        );
        console.log("✅ Copied xlsx asset:", file);
      } catch (e) {
        console.warn("⚠️ Failed to copy xlsx asset:", file, e.message);
      }
    });
  }
});
