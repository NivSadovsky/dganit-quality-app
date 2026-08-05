import type { CheckSection } from "@/lib/constants";

// Default תקין/לא תקין row set for a new inspection, taken from the sample
// QC form (בדיקת אייכות לדוגמה.docx). Rows are per-inspection (editable
// afterwards), not a shared config — this is just the seed.
export const DEFAULT_CHECK_ROWS: { section: CheckSection; label: string }[] = [
  { section: "PACKAGING", label: "קרטון חיצוני" },
  { section: "PACKAGING", label: "בר קוד" },
  { section: "PACKAGING", label: "לוגו" },
  { section: "PACKAGING", label: "אופן האריזה" },
  { section: "PACKAGING", label: "כמות בקרטון" },

  { section: "VISUAL", label: "תקינות המארז" },
  { section: "VISUAL", label: "תווית" },
  { section: "VISUAL", label: "משקל" },
  { section: "VISUAL", label: "אחידות אריזת הצבעים" },

  { section: "PRODUCT", label: "מידות" },
  { section: "PRODUCT", label: "משקלים" },
  { section: "PRODUCT", label: "קצוות / תפר" },
  { section: "PRODUCT", label: "תווית כביסה" },
  { section: "PRODUCT", label: "בדיקת ספיגה" },
  { section: "PRODUCT", label: "בדיקת ירידת צבע" },
];
