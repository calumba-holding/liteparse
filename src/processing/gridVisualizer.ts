import sharp from "sharp";
import { mkdirSync } from "fs";
import { VisualizerPageData } from "./gridDebugLogger.js";

/** Maximum image dimension in pixels to prevent excessive memory usage. */
const MAX_IMAGE_DIM = 4000;

/** Padding around content bounding box in PDF points. */
const CROP_PADDING = 15;

/** Color scheme for snap types */
const COLORS = {
  left: { fill: "rgba(59,130,246,0.15)", stroke: "#3b82f6", anchor: "#3b82f6" },
  right: { fill: "rgba(239,68,68,0.15)", stroke: "#ef4444", anchor: "#ef4444" },
  center: { fill: "rgba(34,197,94,0.15)", stroke: "#22c55e", anchor: "#22c55e" },
  floating: { fill: "rgba(156,163,175,0.15)", stroke: "#9ca3af", anchor: "#9ca3af" },
  flowing: { fill: "rgba(234,179,8,0.15)", stroke: "#eab308", anchor: "#eab308" },
} as const;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Compute the bounding box of all content in PDF coordinates.
 * Returns { x, y, w, h } clamped to page dimensions.
 */
function getContentBounds(data: VisualizerPageData): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  if (data.boxes.length === 0) {
    return { x: 0, y: 0, w: data.width, h: data.height };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const box of data.boxes) {
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.w);
    maxY = Math.max(maxY, box.y + box.h);
  }

  // Also include anchor lines in the horizontal extent
  for (const x of data.anchors.left) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
  }
  for (const x of data.anchors.right) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
  }
  for (const x of data.anchors.center) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
  }

  // Add padding and clamp to page
  minX = Math.max(0, minX - CROP_PADDING);
  minY = Math.max(0, minY - CROP_PADDING);
  maxX = Math.min(data.width, maxX + CROP_PADDING);
  maxY = Math.min(data.height, maxY + CROP_PADDING);

  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/**
 * Render a grid visualization for a single page as a PNG.
 *
 * Draws text boxes as colored rectangles (by snap type), anchor positions
 * as vertical lines, and text labels inside each box. Auto-crops to the
 * content bounding box to avoid large empty regions.
 */
export async function renderGridVisualization(
  data: VisualizerPageData,
  outputPath: string
): Promise<void> {
  // Compute content bounds for cropping
  const bounds = getContentBounds(data);

  // Calculate scale to fit within MAX_IMAGE_DIM based on cropped size
  const scale = Math.min(MAX_IMAGE_DIM / bounds.w, MAX_IMAGE_DIM / bounds.h, 2);
  const imgWidth = Math.round(bounds.w * scale);
  const imgHeight = Math.round(bounds.h * scale);

  // Offset: shift all coordinates so content starts at (0,0)
  const ox = bounds.x;
  const oy = bounds.y;

  // Build SVG overlay
  const svgParts: string[] = [];
  svgParts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${imgWidth}" height="${imgHeight}" viewBox="0 0 ${imgWidth} ${imgHeight}">`
  );

  // Font size scales with image
  const fontSize = Math.max(6, Math.min(10, Math.round(8 * scale)));

  // Draw anchor lines (behind boxes)
  const drawnAnchors = new Set<string>();

  for (const x of data.anchors.left) {
    const key = `left-${x}`;
    if (drawnAnchors.has(key)) continue;
    drawnAnchors.add(key);
    const sx = Math.round((x - ox) * scale);
    svgParts.push(
      `<line x1="${sx}" y1="0" x2="${sx}" y2="${imgHeight}" stroke="${COLORS.left.anchor}" stroke-width="1" stroke-dasharray="4,4" opacity="0.5"/>`
    );
  }
  for (const x of data.anchors.right) {
    const key = `right-${x}`;
    if (drawnAnchors.has(key)) continue;
    drawnAnchors.add(key);
    const sx = Math.round((x - ox) * scale);
    svgParts.push(
      `<line x1="${sx}" y1="0" x2="${sx}" y2="${imgHeight}" stroke="${COLORS.right.anchor}" stroke-width="1" stroke-dasharray="4,4" opacity="0.5"/>`
    );
  }
  for (const x of data.anchors.center) {
    const key = `center-${x}`;
    if (drawnAnchors.has(key)) continue;
    drawnAnchors.add(key);
    const sx = Math.round((x - ox) * scale);
    svgParts.push(
      `<line x1="${sx}" y1="0" x2="${sx}" y2="${imgHeight}" stroke="${COLORS.center.anchor}" stroke-width="1" stroke-dasharray="2,6" opacity="0.5"/>`
    );
  }

  // Draw block boundaries
  for (const block of data.blocks) {
    const blockBoxes = data.boxes.filter(
      (b) => b.lineIndex >= block.start && b.lineIndex < block.end
    );
    if (blockBoxes.length === 0) continue;
    const minY = Math.min(...blockBoxes.map((b) => b.y));
    const maxY = Math.max(...blockBoxes.map((b) => b.y + b.h));
    const sy = Math.round((minY - oy) * scale) - 2;
    const ey = Math.round((maxY - oy) * scale) + 2;
    const blockColor = block.flowing ? COLORS.flowing.stroke : "#6b7280";
    svgParts.push(
      `<rect x="0" y="${sy}" width="${imgWidth}" height="${ey - sy}" fill="none" stroke="${blockColor}" stroke-width="1" stroke-dasharray="6,3" opacity="0.3"/>`
    );
  }

  // Draw text boxes
  for (const box of data.boxes) {
    const sx = Math.round((box.x - ox) * scale);
    const sy = Math.round((box.y - oy) * scale);
    const sw = Math.max(Math.round(box.w * scale), 1);
    const sh = Math.max(Math.round(box.h * scale), 1);

    let color: (typeof COLORS)[keyof typeof COLORS];
    if (box.isFlowing) {
      color = COLORS.flowing;
    } else if (box.snap === "left") {
      color = COLORS.left;
    } else if (box.snap === "right") {
      color = COLORS.right;
    } else if (box.snap === "center") {
      color = COLORS.center;
    } else {
      color = COLORS.floating;
    }

    svgParts.push(
      `<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="${color.fill}" stroke="${color.stroke}" stroke-width="0.75"/>`
    );

    // Text label (truncated to fit)
    const maxChars = Math.max(1, Math.floor(sw / (fontSize * 0.55)));
    const label =
      box.text.length > maxChars ? box.text.substring(0, maxChars - 1) + "\u2026" : box.text;
    if (label.length > 0 && sh >= fontSize) {
      svgParts.push(
        `<text x="${sx + 2}" y="${sy + sh - 2}" font-family="monospace" font-size="${fontSize}" fill="${color.stroke}" clip-path="url(#clip-${sx}-${sy})">${escapeXml(label)}</text>`
      );
    }
  }

  // Legend (top-right corner of cropped image)
  const legendY = 10;
  const legendX = imgWidth - 200;
  svgParts.push(
    `<rect x="${legendX - 5}" y="${legendY - 5}" width="195" height="95" fill="white" stroke="#d1d5db" stroke-width="1" rx="3"/>`
  );
  const legendItems = [
    { label: "Left snap", color: COLORS.left },
    { label: "Right snap", color: COLORS.right },
    { label: "Center snap", color: COLORS.center },
    { label: "Floating", color: COLORS.floating },
    { label: "Flowing text", color: COLORS.flowing },
  ];
  for (let i = 0; i < legendItems.length; i++) {
    const ly = legendY + i * 17;
    svgParts.push(
      `<rect x="${legendX}" y="${ly}" width="12" height="12" fill="${legendItems[i].color.fill}" stroke="${legendItems[i].color.stroke}" stroke-width="1"/>`
    );
    svgParts.push(
      `<text x="${legendX + 18}" y="${ly + 10}" font-family="sans-serif" font-size="11" fill="#374151">${legendItems[i].label}</text>`
    );
  }

  svgParts.push("</svg>");

  const svgBuffer = Buffer.from(svgParts.join("\n"));

  // Create white background image and composite SVG
  await sharp({
    create: {
      width: imgWidth,
      height: imgHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: svgBuffer, top: 0, left: 0 }])
    .png({ compressionLevel: 6 })
    .toFile(outputPath);
}

/**
 * Render all captured visualization pages to PNG files.
 */
export async function renderAllVisualizations(
  pages: VisualizerPageData[],
  outputDir: string
): Promise<string[]> {
  mkdirSync(outputDir, { recursive: true });

  const paths: string[] = [];
  for (const page of pages) {
    const filePath = `${outputDir}/page-${page.pageNum}-grid.png`;
    await renderGridVisualization(page, filePath);
    paths.push(filePath);
  }
  return paths;
}
