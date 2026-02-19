/**
 * Uploads/updates the dataset to HuggingFace
 *
 * Usage:
 *   HF_TOKEN=xxx npx tsx scripts/upload-dataset.ts [dataset-dir] [repo-name]
 *
 * Environment variables:
 *   HF_TOKEN - HuggingFace API token with write access
 *
 * This script:
 * 1. Regenerates the dataset from e2e-test-docs
 * 2. Uploads to HuggingFace using the huggingface_hub API
 */

import { execSync } from "child_process";
import * as path from "path";

const DEFAULT_OUTPUT_DIR = path.join(import.meta.dirname, "..", "dataset");
const DEFAULT_REPO = "liteparse/e2e-test-outputs";

async function main() {
  const outputDir = process.argv[2] || DEFAULT_OUTPUT_DIR;
  const repoName = process.argv[3] || DEFAULT_REPO;
  const hfToken = process.env.HF_TOKEN;

  if (!hfToken) {
    console.error("Error: HF_TOKEN environment variable is required");
    console.error("Get a token from https://huggingface.co/settings/tokens");
    process.exit(1);
  }

  console.log("LiteParse Dataset Upload");
  console.log("========================");
  console.log(`Output: ${outputDir}`);
  console.log(`Repo: ${repoName}`);
  console.log();

  // Step 1: Regenerate dataset
  console.log("Step 1: Regenerating dataset...");
  try {
    execSync(`npx tsx scripts/create-dataset.ts "${outputDir}"`, {
      cwd: path.join(import.meta.dirname, ".."),
      stdio: "inherit",
    });
  } catch (error) {
    console.error("Failed to generate dataset");
    process.exit(1);
  }

  // Step 2: Upload to HuggingFace
  console.log("\nStep 2: Uploading to HuggingFace...");
  try {
    // Use hf cli to upload
    // This requires hf cli to be installed: brew install huggingface-cli
    execSync(
      `hf upload ${repoName} "${outputDir}" --repo-type dataset --token "${hfToken}"`,
      {
        cwd: path.join(import.meta.dirname, ".."),
        stdio: "inherit",
      }
    );
    console.log("\n✓ Dataset uploaded successfully!");
    console.log(`  View at: https://huggingface.co/datasets/${repoName}`);
  } catch (error) {
    console.error("Failed to upload to HuggingFace");
    console.error("Make sure hf cli is installed: brew install huggingface-cli");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
