import { expect, describe, it } from "vitest";
import { buildBbox, buildBoundingBoxes, filterImagesForOCR } from "./bbox";
import { LiteParseConfig } from "../lib";
import { DEFAULT_CONFIG } from "../core/config";
import { EasyOcrResultLine } from "../engines/pdf/interface";

describe("test filterImagesForOCR", () => {
  it("test valid image", () => {
    const images = [
      {
        type: "photo",
        width: 200,
        height: 200,
        x: 10,
        y: 10,
        coords: { x: 10, y: 10, w: 200, h: 200 },
      },
    ];
    const page = { width: 1000, height: 1000 };
    const result = filterImagesForOCR(images, page);
    expect(result).toStrictEqual(images);
  });

  it("test filter on patterns", () => {
    const images = [
      { type: "g_background", width: 200, height: 200, x: 0, y: 0 },
      { type: "pattern_stripe", width: 200, height: 200, x: 0, y: 0 },
      {
        type: "photo",
        width: 200,
        height: 200,
        x: 0,
        y: 0,
        coords: { x: 0, y: 0, w: 200, h: 200 },
      },
    ];
    const page = { width: 1000, height: 1000 };
    const result = filterImagesForOCR(images, page);
    expect(result).toStrictEqual([images[2]]);
  });

  it("test filter layout", () => {
    const images = [
      {
        type: "layout_header",
        width: 300,
        height: 300,
        x: 0,
        y: 0,
        coords: { x: 0, y: 0, w: 300, h: 300 },
      },
    ];
    const page = { width: 1000, height: 1000 };
    const result = filterImagesForOCR(images, page);
    expect(result.length).toBe(0);
  });

  it("test out of viewport", () => {
    const images = [
      {
        type: "photo",
        width: 200,
        height: 200,
        coords: { x: 1100, y: 0, w: 200, h: 200 },
        x: 0,
        y: 0,
      },
    ];
    const page = { width: 1000, height: 1000 };
    const result = filterImagesForOCR(images, page);
    expect(result.length).toBe(0);
  });

  it("test min dimensions", () => {
    const images = [
      { type: "photo", width: 5, height: 5, x: 0, y: 0, coords: { x: 0, y: 0, w: 5, h: 5 } },
    ];
    const page = { width: 1000, height: 1000 };
    const result = filterImagesForOCR(images, page);
    expect(result.length).toBe(0);
  });

  it("test max images per page", () => {
    const images = [
      {
        type: "photo",
        width: 100,
        height: 100,
        x: 0,
        y: 0,
        coords: { x: 0, y: 0, w: 100, h: 100 },
      },
      {
        type: "photo",
        width: 100,
        height: 100,
        x: 0,
        y: 0,
        coords: { x: 0, y: 0, w: 500, h: 500 },
      },
      {
        type: "photo",
        width: 100,
        height: 100,
        x: 0,
        y: 0,
        coords: { x: 0, y: 0, w: 300, h: 300 },
      },
      {
        type: "photo",
        width: 100,
        height: 100,
        x: 0,
        y: 0,
        coords: { x: 0, y: 0, w: 100, h: 100 },
      },
      {
        type: "photo",
        width: 100,
        height: 100,
        x: 0,
        y: 0,
        coords: { x: 0, y: 0, w: 500, h: 500 },
      },
      {
        type: "photo",
        width: 100,
        height: 100,
        x: 0,
        y: 0,
        coords: { x: 0, y: 0, w: 300, h: 300 },
      },
      {
        type: "photo",
        width: 100,
        height: 100,
        x: 0,
        y: 0,
        coords: { x: 0, y: 0, w: 100, h: 100 },
      },
      {
        type: "photo",
        width: 100,
        height: 100,
        x: 0,
        y: 0,
        coords: { x: 0, y: 0, w: 500, h: 500 },
      },
      {
        type: "photo",
        width: 100,
        height: 100,
        x: 0,
        y: 0,
        coords: { x: 0, y: 0, w: 300, h: 300 },
      },
      {
        type: "photo",
        width: 100,
        height: 100,
        x: 0,
        y: 0,
        coords: { x: 0, y: 0, w: 100, h: 100 },
      },
      {
        type: "photo",
        width: 100,
        height: 100,
        x: 0,
        y: 0,
        coords: { x: 0, y: 0, w: 500, h: 500 },
      },
      {
        type: "photo",
        width: 100,
        height: 100,
        x: 0,
        y: 0,
        coords: { x: 0, y: 0, w: 300, h: 300 },
      },
    ];
    const page = { width: 1000, height: 1000 };
    const result = filterImagesForOCR(images, page);
    expect(result).toStrictEqual(images.slice(0, 10));
  });
});

describe("test buildBox", () => {
  it("test with OCR disabled", () => {
    const pageData = {
      pageNum: 1,
      width: 612,
      height: 792,
      textItems: [
        { str: "Hello World", x: 50, y: 100, width: 120, height: 14, w: 120, h: 14 },
        { str: "Some body text", x: 50, y: 130, width: 200, height: 14, w: 200, h: 14 },
      ],
      images: [],
    };
    const config: LiteParseConfig = { ...DEFAULT_CONFIG, ocrEnabled: false };

    const expectedOutput = [
      {
        x: 50,
        y: 100,
        rx: 0,
        ry: 0,
        w: 120,
        h: 14,
        r: 0,
        str: "Hello World",
        strLength: 11,
        pageBbox: { x: 50, y: 100, w: 120, h: 14 },
        vgap: undefined,
        isPlaceholder: undefined,
      },
      {
        x: 50,
        y: 130,
        rx: 0,
        ry: 0,
        w: 200,
        h: 14,
        r: 0,
        str: "Some body text",
        strLength: 14,
        pageBbox: { x: 50, y: 130, w: 200, h: 14 },
        vgap: undefined,
        isPlaceholder: undefined,
      },
    ];

    const result = buildBbox(pageData, config);
    expect(result).toStrictEqual(expectedOutput);
  });

  it("test with OCR enabled", () => {
    const pageData = {
      pageNum: 1,
      width: 612,
      height: 792,
      textItems: [
        // Native PDF text (top-left)
        { str: "Hello World", x: 50, y: 100, width: 120, height: 14, w: 120, h: 14 },
      ],
      images: [
        {
          x: 0,
          y: 200,
          width: 612,
          height: 400,
          originalOrientationAngle: 0,
          // parseImageOcrBlocks() reads this internally:
          ocrRaw: [
            // Block A: no spatial overlap with native text, unique content → KEPT
            [
              [
                [50, 50],
                [250, 50],
                [250, 70],
                [50, 70],
              ],
              "Scanned paragraph text",
              0.95,
              // resolved by parseImageOcrBlocks to absolute page coords:
              // x:50, y:50, w:200, h:20, rx/ry/rw/rh for rotated coords
            ] as EasyOcrResultLine,
            // Block B: text already exists in native items ("hello world") → FILTERED (content dedup)
            [
              [
                [50, 0],
                [170, 0],
                [170, 14],
                [50, 14],
              ],
              "Hello World",
              0.97,
              // x:50, y:200, w:120, h:14 — also overlaps native text box
            ] as EasyOcrResultLine,
            // Block C: low confidence → FILTERED (below threshold)
            [
              [
                [300, 100],
                [500, 100],
                [500, 120],
                [300, 120],
              ],
              "Low confidence text",
              0.05,
            ] as EasyOcrResultLine,
          ],
        },
      ],
    };
    const config: LiteParseConfig = { ...DEFAULT_CONFIG, ocrEnabled: true };

    const expectedOutput = [
      // ── Native text item ──────────────────────────────────────────────
      {
        x: 50,
        y: 100,
        rx: 0,
        ry: 0,
        w: 120,
        h: 14,
        r: 0,
        str: "Hello World",
        strLength: 11,
        pageBbox: { x: 50, y: 100, w: 120, h: 14 },
        vgap: undefined,
        isPlaceholder: undefined,
      },

      // ── OCR block A (passed all filters) ─────────────────────────────
      {
        fromOCR: true,
        x: 50,
        y: 50,
        w: 200,
        h: 20,
        r: 0,
        str: "Scanned paragraph text",
        strLength: 22,
        pageBbox: { x: 50, y: 50, w: 200, h: 20 },
      },

      // Block B removed: spatial overlap >50% of native text item AND content dedup match
      // Block C removed: confidence 0.40 < OCR_CONFIDENCE_THRESHOLD (0.5)
    ];

    const result = buildBbox(pageData, config);
    expect(result).toStrictEqual(expectedOutput);
  });
});

describe("test buildBoundingBoxes", () => {
  it("test buildBoundingBoxes success", () => {
    const textItems = [
      { str: "Hello", x: 50, y: 100, width: 60, height: 14, w: 60, h: 14 },
      { str: "   ", x: 50, y: 120, width: 30, height: 14, w: 30, h: 14 },
      { str: "World", x: 50, y: 140, width: 80, height: 14, w: 80, h: 14 },
    ];

    const expectedOutput = [
      { x1: 50, y1: 100, x2: 110, y2: 114 },
      { x1: 50, y1: 140, x2: 130, y2: 154 },
    ];

    const result = buildBoundingBoxes(textItems);
    expect(result).toStrictEqual(expectedOutput);
  });
});
