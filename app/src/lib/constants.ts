// String-union "enums" (Prisma enums don't work on SQLite, used in dev — see schema.prisma)

export const ROLES = ["INSPECTOR", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ITEM_DECISIONS = ["PENDING", "INSPECT", "SKIP"] as const;
export type ItemDecision = (typeof ITEM_DECISIONS)[number];

export const INSPECTION_STATUS = ["OPEN", "CLOSED"] as const;
export type InspectionStatus = (typeof INSPECTION_STATUS)[number];

export const CHECK_RESULTS = ["OK", "NOT_OK", "NA"] as const;
export type CheckResult = (typeof CHECK_RESULTS)[number];

export const SEVERITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const CHECK_SECTIONS = ["PACKAGING", "VISUAL", "PRODUCT"] as const;
export type CheckSection = (typeof CHECK_SECTIONS)[number];

export const SEVERITY_LABELS_HE: Record<Severity, string> = {
  LOW: "נמוכה",
  MEDIUM: "בינונית",
  HIGH: "גבוהה",
};

export const SEVERITY_LABELS_EN: Record<Severity, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const CHECK_SECTION_LABELS_HE: Record<CheckSection, string> = {
  PACKAGING: "אריזה",
  VISUAL: "בדיקה ויזואלית מארז",
  PRODUCT: "תוצאות בדיקת המוצר",
};

// English translations for the fixed check-row labels seeded from
// src/lib/inspectionTemplate.ts (DEFAULT_CHECK_ROWS). Keyed by the Hebrew
// label text since that's what's actually stored on InspectionCheckItem —
// look up with a fallback to the Hebrew text itself for any row that isn't
// one of the known defaults (e.g. if labels ever become editable).
export const CHECK_ROW_LABELS_EN: Record<string, string> = {
  "קרטון חיצוני": "Outer carton",
  "בר קוד": "Barcode",
  "לוגו": "Logo",
  "אופן האריזה": "Packing method",
  "כמות בקרטון": "Quantity per carton",
  "תקינות המארז": "Box Condition",
  "תווית": "Label",
  "משקל": "Weight",
  "אחידות אריזת הצבעים": "Color-packaging uniformity",
  "מידות": "Dimensions",
  "משקלים": "Weights",
  "קצוות / תפר": "Edges / seams",
  "תווית כביסה": "Wash label",
  "בדיקת ספיגה": "Absorption test",
  "בדיקת ירידת צבע": "Color-fastness test",
};

export const CHECK_RESULT_LABELS_EN: Record<string, string> = {
  OK: "Pass",
  NOT_OK: "Fail",
};

// Common product colors, Hebrew name -> English, used as a select dropdown
// on measurement rows so the PDF's English translation is automatic and
// never needs a manual-translation entry (see build_status memory).
export const MEASUREMENT_COLORS: { he: string; en: string }[] = [
  { he: "לבן", en: "White" },
  { he: "שחור", en: "Black" },
  { he: "אדום", en: "Red" },
  { he: "כחול", en: "Blue" },
  { he: "כחול כהה", en: "Navy" },
  { he: "תכלת", en: "Light Blue" },
  { he: "ירוק", en: "Green" },
  { he: "ירוק בהיר", en: "Light Green" },
  { he: "צהוב", en: "Yellow" },
  { he: "כתום", en: "Orange" },
  { he: "ורוד", en: "Pink" },
  { he: "סגול", en: "Purple" },
  { he: "חום", en: "Brown" },
  { he: "בז'", en: "Beige" },
  { he: "אפור", en: "Gray" },
  { he: "אפור בהיר", en: "Light Gray" },
  { he: "כסף", en: "Silver" },
  { he: "זהב", en: "Gold" },
  { he: "טורקיז", en: "Turquoise" },
  { he: "בורדו", en: "Burgundy" },
  { he: "שקוף", en: "Clear / Transparent" },
  { he: "רב-גוני", en: "Multicolor" },
  { he: "קרם", en: "Cream" },
  { he: "פודרה", en: "Powder Pink" },
];

export function colorLabelEn(colorHe: string | null | undefined): string {
  if (!colorHe) return "";
  return MEASUREMENT_COLORS.find((c) => c.he === colorHe)?.en ?? colorHe;
}

export const INSPECTION_COUNTER_START = 23456;
