#!/usr/bin/env bash
# Generates API reference docs from TypeDoc and outputs a single
# Starlight-compatible markdown file with frontmatter.
set -euo pipefail

DOCS_DIR="./docs/src/content/docs/liteparse"
TMP_DIR="${DOCS_DIR}/.api-tmp"
OUT_FILE="${DOCS_DIR}/api.md"

# Generate markdown with TypeDoc
npx typedoc

# Prepend Starlight frontmatter to the generated README
cat > "${OUT_FILE}" <<'FRONTMATTER'
---
title: API Reference
description: API reference for the @llamaindex/liteparse TypeScript library.
sidebar:
  order: 6
---
FRONTMATTER

cat "${TMP_DIR}/README.md" >> "${OUT_FILE}"

# Clean up temp directory
rm -rf "${TMP_DIR}"

echo "Generated ${OUT_FILE}"
