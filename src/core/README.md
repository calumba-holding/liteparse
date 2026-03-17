# src/core/

The core module contains the main orchestrator class, configuration management, and TypeScript type definitions that form the foundation of LiteParse.

## Files

### parser.ts
**The main LiteParse class** - orchestrates the entire parsing pipeline.

**Key Responsibilities:**
- Initializes PDF and OCR engines based on configuration
- Coordinates the document processing pipeline
- Manages document lifecycle (load, process, cleanup)
- Handles format conversion for non-PDF inputs

**Public Methods:**
- `parse(filePath, quiet?)` - Main entry point for document parsing
- `screenshot(filePath, pageNumbers?, quiet?)` - Generate page screenshots
- `getConfig()` - Returns current configuration

**Pipeline Flow (in `parse()`):**
1. Convert to PDF if needed (via `convertToPdf`)
2. Load PDF document with PDF engine
3. Extract pages
4. Run OCR on text-sparse pages/embedded images
5. Project pages to grid (spatial text reconstruction)
6. Build bounding boxes (if enabled)
7. Format output (JSON or text)
8. Cleanup resources

**Design Decisions:**
- **Engine auto-detection**: If `ocrServerUrl` is provided, uses HTTP OCR; otherwise defaults to Tesseract.js for zero-setup experience
- **Selective OCR**: Only runs OCR on pages with <100 characters of text OR pages with embedded images
- **Progress logging to stderr**: Keeps stdout clean for piped output
- **Graceful cleanup**: Always cleans up temp files and terminates OCR workers

---

### types.ts
**TypeScript type definitions** for the entire library.

**Configuration Types:**
- `LiteParseConfig` - All configuration options
- `OutputFormat` - 'json' | 'text'

**Data Types:**
- `TextItem` - Individual text element with position, font, rotation
- `ProjectionTextBox` - Extended text item with projection metadata (snap, anchors, etc.)
- `BoundingBox` - Coordinates (x1, y1, x2, y2)
- `ParsedPage` - Complete page data (text, textItems)
- `ParseResult` - Final parse output
- `ScreenshotResult` - Screenshot output with image buffer

**Key Type Details:**

`TextItem` contains:
- Position: `x`, `y`, `width`, `height` (also `w`, `h` aliases)
- Font info: `fontName`, `fontSize`
- Rotation: `r` (degrees), `rx`/`ry` (rotated coordinates)
- Markup: `markup` (highlight, underline, strikeout)
- Layout hints: `vgap`, `isPlaceholder`

`ProjectionTextBox` adds projection metadata:
- `snap` - Alignment type ('left', 'right', 'center', or undefined for floating)
- `leftAnchor`, `rightAnchor`, `centerAnchor` - Column anchor strings
- `isDup` - Marks duplicate text items
- `forceUnsnapped` - Override snap detection
- `fromOCR` - Text came from OCR

---

### config.ts
**Default configuration and merging logic.**

**DEFAULT_CONFIG Values:**
```typescript
{
  ocrLanguage: 'en',
  ocrEnabled: true,
  ocrServerUrl: undefined,  // Uses Tesseract if not set
  maxPages: 1000,
  dpi: 150,
  outputFormat: 'json',
  preciseBoundingBox: true,
  preserveVerySmallText: false,
  preserveLayoutAlignmentAcrossPages: false,
}
```

**mergeConfig(userConfig)**
Simple spread-based merge: `{ ...DEFAULT_CONFIG, ...userConfig }`

**Design Decision:**
The merge is intentionally shallow. Users provide only the options they want to change. This keeps the API simple while ensuring all required fields exist.

---

## Common Modifications

### Adding a new configuration option
1. Add field to `LiteParseConfig` interface in `types.ts`
2. Add default value in `DEFAULT_CONFIG` in `config.ts`
3. Use the option in `parser.ts` or pass to relevant module

### Adding a new output format
1. Add to `OutputFormat` type in `types.ts`
2. Create formatter in `src/output/`
3. Add case to switch in `parser.ts` `parse()` method

### Adding lifecycle hooks
The `parse()` method in `parser.ts` has clear pipeline stages. Add hooks between stages as needed (e.g., before/after OCR, before/after grid projection).
