/**
 * Regenerates and uploads the dataset to HuggingFace
 *
 * Usage:
 *   HF_TOKEN=xxx npx tsx scripts/upload-dataset.ts [dataset-dir] [repo-name]
 *
 * Arguments:
 *   dataset-dir - Directory containing the dataset with data/ subfolder
 *                 (default: ./dataset)
 *   repo-name   - HuggingFace repository name (default: llamaindex/liteparse_cicd_data)
 *
 * Environment variables:
 *   HF_TOKEN - HuggingFace API token with write access
 *
 * This script:
 * 1. Regenerates metadata.jsonl by re-running liteparse on data/ in the dataset
 * 2. Uploads to HuggingFace using the huggingface_hub API
 */

import { execSync } from "child_process";
import * as path from "path";

const DEFAULT_OUTPUT_DIR = path.join(import.meta.dirname, "..", "dataset");
const DEFAULT_REPO = "llamaindex/liteparse_cicd_data";

async function main() {
  const datasetDir = process.argv[2] || DEFAULT_OUTPUT_DIR;
  const repoName = process.argv[3] || DEFAULT_REPO;
  const hfToken = process.env.HF_TOKEN;

  if (!hfToken) {
    console.error("Error: HF_TOKEN environment variable is required");
    console.error("Get a token from https://huggingface.co/settings/tokens");
    process.exit(1);
  }

  const documentsDir = path.join(datasetDir, "documents");

  console.log("LiteParse Dataset Upload");
  console.log("========================");
  console.log(`Dataset: ${datasetDir}`);
  console.log(`Documents: ${documentsDir}`);
  console.log(`Repo: ${repoName}`);
  console.log();

  // Step 1: Regenerate dataset from documents in the dataset directory
  console.log("Step 1: Regenerating dataset from existing documents...");
  try {
    // Pass both output dir and source docs dir (data/ within the dataset)
    execSync(`npx tsx scripts/create-dataset.ts "${datasetDir}" "${documentsDir}"`, {
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
      `hf upload ${repoName} "${datasetDir}" --repo-type dataset --token "${hfToken}"`,
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
