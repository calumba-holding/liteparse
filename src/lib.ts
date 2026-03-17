/**
 * @packageDocumentation
 *
 * LiteParse — open-source PDF parsing with spatial text extraction, OCR, and bounding boxes.
 *
 * @example
 * ```typescript
 * import { LiteParse } from "@llamaindex/liteparse";
 *
 * const parser = new LiteParse({ ocrEnabled: true });
 * const result = await parser.parse("document.pdf");
 * console.log(result.text);
 * ```
 */
export { LiteParse } from "./core/parser.js";
export type {
  LiteParseConfig,
  OutputFormat,
  ParseResult,
  ParseResultJson,
  ParsedPage,
  BoundingBox,
  TextItem,
  ScreenshotResult,
  MarkupData,
} from "./core/types.js";
