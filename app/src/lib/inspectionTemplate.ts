import type { CheckSection, ProductType } from "@/lib/constants";

// Default תקין/לא תקין row set for a new inspection, one set per product
// type — chosen once when the inspection starts (see startInspection in
// src/lib/inspections.ts). Rows are per-inspection (editable afterwards),
// not a shared config — this is just the seed.
export const CHECK_ROWS_BY_TYPE: Record<
  ProductType,
  { section: CheckSection; label: string }[]
> = {
  // Taken from the sample QC form (בדיקת אייכות לדוגמה.docx).
  MICROFIBER: [
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
  ],

  // Taken from the reference report מקרצפים.docx.
  SCRUBBER: [
    { section: "PACKAGING", label: "קרטון / שק" },
    { section: "PACKAGING", label: "תווית" },
    { section: "PACKAGING", label: "אופן האריזה" },
    { section: "PACKAGING", label: "כמות" },

    { section: "PRODUCT", label: "מידות" },
    { section: "PRODUCT", label: "ספוג" },
    { section: "PRODUCT", label: "קצוות / הלחמה" },
    { section: "PRODUCT", label: "ירידת צבע" },
    { section: "PRODUCT", label: "הרכב" },
    { section: "PRODUCT", label: "כושר ביצוע" },
  ],

  // Taken from the reference report בד שרוול.docx.
  FABRIC: [
    { section: "PRODUCT", label: "מארז- מס' אצווה" },
    { section: "PRODUCT", label: "מידות" },
    { section: "PRODUCT", label: "משקלים" },
    { section: "PRODUCT", label: "ירידת צבע" },
    { section: "PRODUCT", label: "הרכב" },
  ],
};
