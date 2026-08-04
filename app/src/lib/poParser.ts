// Parses a הזמנת רכש (purchase order) PDF into order number, container
// number and line items.
//
// This only works on PDFs that carry a real text layer. Files produced by
// "Print to PDF" style drivers sometimes outline every glyph as vector
// paths instead of embedding text/fonts — those have zero extractable
// text and must be rejected up front (see hasNoTextLayer below), not
// silently parsed into nothing. See memory: po_document_format.md.
//
// Column layout is read from the header row itself (matching each data
// item to the header whose right edge — x1 — is closest), rather than
// hardcoding pixel positions, so small shifts between exported documents
// don't break parsing. Row anchors are the "#" index column, since that's
// present even on rows where קוד פריט is blank.

export interface ParsedPoItem {
  rowIndex: number;
  itemCode: string | null;
  description: string;
  quantity: number | null;
}

export interface ParsedPo {
  orderNumber: string | null;
  containerNumber: string | null;
  items: ParsedPoItem[];
  warnings: string[];
}

interface TextItem {
  text: string;
  x0: number;
  x1: number;
  y: number;
}

const CONTAINER_NUMBER_RE = /\b[A-Z]{4}\d{7}\b/;
const HEADER_LABELS = {
  index: "#",
  code: "קוד פריט",
  description: "תיאור",
  quantity: "כמות",
  orderTitle: "הזמנת רכש",
} as const;

const COLUMN_MATCH_TOLERANCE = 6;
const ROW_Y_TOLERANCE = 3;

export class PoParseError extends Error {}

export async function parsePurchaseOrderPdf(data: Buffer): Promise<ParsedPo> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(data),
    useSystemFonts: true,
    disableFontFace: true,
  }).promise;

  const warnings: string[] = [];
  let orderNumber: string | null = null;
  let containerNumber: string | null = null;
  const items: ParsedPoItem[] = [];

  let columns: { code: number; description: number; quantity: number; index: number } | null = null;
  let sawAnyText = false;

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();

    const pageItems: TextItem[] = [];
    for (const raw of content.items) {
      if (!("str" in raw)) continue;
      const text = raw.str.trim();
      if (!text) continue;
      sawAnyText = true;
      const x0 = raw.transform[4];
      const x1 = x0 + raw.width;
      const y = raw.transform[5];
      pageItems.push({ text, x0, x1, y });
    }

    if (!containerNumber) {
      const match = pageItems.find((i) => CONTAINER_NUMBER_RE.test(i.text));
      if (match) containerNumber = match.text.match(CONTAINER_NUMBER_RE)![0];
    }

    if (!orderNumber) {
      const titleItem = pageItems.find((i) => i.text === HEADER_LABELS.orderTitle);
      if (titleItem) {
        const sameRow = pageItems.find(
          (i) => Math.abs(i.y - titleItem.y) < ROW_Y_TOLERANCE && /^\d{4,8}$/.test(i.text)
        );
        orderNumber = sameRow?.text ?? null;
      }
    }

    const codeHeader = pageItems.find((i) => i.text === HEADER_LABELS.code);
    const descHeader = pageItems.find((i) => i.text === HEADER_LABELS.description);
    const qtyHeader = pageItems.find((i) => i.text === HEADER_LABELS.quantity);
    const idxHeader = pageItems.find((i) => i.text === HEADER_LABELS.index);

    if (codeHeader && descHeader && qtyHeader && idxHeader) {
      columns = {
        code: codeHeader.x1,
        description: descHeader.x1,
        quantity: qtyHeader.x1,
        index: idxHeader.x1,
      };
    }

    if (!columns) continue; // no table header found yet on this page

    const headerY = idxHeader?.y ?? Infinity;

    const closestInColumn = (y: number, colX1: number) => {
      let best: TextItem | null = null;
      let bestDist = Infinity;
      for (const it of pageItems) {
        if (Math.abs(it.y - y) > ROW_Y_TOLERANCE) continue;
        const dist = Math.abs(it.x1 - colX1);
        if (dist < COLUMN_MATCH_TOLERANCE && dist < bestDist) {
          best = it;
          bestDist = dist;
        }
      }
      return best;
    };

    const rowAnchors = pageItems.filter(
      (i) =>
        i.y < headerY - ROW_Y_TOLERANCE &&
        Math.abs(i.x1 - columns!.index) < COLUMN_MATCH_TOLERANCE &&
        /^\d{1,3}$/.test(i.text)
    );

    const seenY = new Set<number>();
    for (const anchor of rowAnchors) {
      const yKey = Math.round(anchor.y);
      if (seenY.has(yKey)) continue;
      seenY.add(yKey);

      const descItem = closestInColumn(anchor.y, columns.description);
      const codeItem = closestInColumn(anchor.y, columns.code);
      const qtyItem = closestInColumn(anchor.y, columns.quantity);

      if (!descItem) continue; // not a real data row (likely a footer number)

      const quantity = qtyItem ? Number(qtyItem.text.replace(/[^\d]/g, "")) : null;
      if (qtyItem && (quantity === null || Number.isNaN(quantity))) {
        warnings.push(`שורה עם כמות לא תקינה: "${qtyItem.text}"`);
      }

      items.push({
        rowIndex: items.length + 1,
        itemCode: codeItem && /^\d+$/.test(codeItem.text) ? codeItem.text : null,
        description: descItem.text,
        quantity: quantity ?? null,
      });

      if (!codeItem) {
        warnings.push(`שורה ${items.length} ("${descItem.text}") ללא קוד פריט — יש להשלים ידנית`);
      }
    }
  }

  if (!sawAnyText) {
    throw new PoParseError(
      "לא נמצא טקסט הניתן לחילוץ בקובץ. ייתכן שהקובץ הופק בהדפסה לתמונה/וקטור ולא בייצוא טקסט אמיתי."
    );
  }

  if (items.length === 0) {
    throw new PoParseError("לא זוהו שורות פריטים במסמך. יש לבדוק שהפורמט תואם להזמנת רכש.");
  }

  if (!orderNumber) warnings.push("לא זוהה מספר הזמנה — יש להזין ידנית");
  if (!containerNumber) warnings.push("לא זוהה מספר מכולה — ניתן להזין ידנית");

  return { orderNumber, containerNumber, items, warnings };
}
