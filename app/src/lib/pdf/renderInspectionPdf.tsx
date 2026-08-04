import { Document, Page, View, Text, Image, Font, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { join } from "path";
import type { InspectionFull } from "@/lib/inspections";
import { storageAbsPath } from "@/lib/storage";
import {
  CHECK_SECTION_LABELS_HE,
  CHECK_ROW_LABELS_EN,
  SEVERITY_LABELS_HE,
  SEVERITY_LABELS_EN,
  type CheckSection,
} from "@/lib/constants";

const FONTS_DIR = join(process.cwd(), "src/lib/pdf/fonts");

Font.register({
  family: "Heebo",
  fonts: [
    { src: join(FONTS_DIR, "Heebo-Regular.ttf"), fontWeight: "normal" },
    { src: join(FONTS_DIR, "Heebo-Bold.ttf"), fontWeight: "bold" },
  ],
});

const styles = StyleSheet.create({
  page: { padding: 28, fontFamily: "Heebo", fontSize: 9, direction: "rtl" },
  pageEn: { padding: 28, fontFamily: "Heebo", fontSize: 9, direction: "ltr" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    borderBottom: "2pt solid #0b2f6b",
    paddingBottom: 8,
  },
  logo: { width: 110, height: 35 },
  title: { fontSize: 16, fontWeight: "bold", color: "#0b2f6b" },
  meta: { fontSize: 9, color: "#555", textAlign: "right" },
  metaEn: { fontSize: 9, color: "#555", textAlign: "left" },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0b2f6b",
    backgroundColor: "#eef2fb",
    padding: 4,
    marginTop: 10,
    marginBottom: 4,
  },
  kvGrid: { flexDirection: "row", flexWrap: "wrap" },
  kvItem: { width: "50%", flexDirection: "row", paddingVertical: 2, gap: 4 },
  kvLabel: { color: "#555", fontWeight: "bold" },
  kvValue: { flexGrow: 1 },
  table: { borderTop: "0.5pt solid #ccc", borderLeft: "0.5pt solid #ccc" },
  tr: { flexDirection: "row" },
  th: {
    flex: 1,
    borderRight: "0.5pt solid #ccc",
    borderBottom: "0.5pt solid #ccc",
    backgroundColor: "#f4f6fb",
    padding: 4,
    fontWeight: "bold",
  },
  tdOk: { backgroundColor: "#e8f5e9", textAlign: "center", fontWeight: "bold", color: "#2e7d32" },
  tdNotOk: { backgroundColor: "#ffebee", textAlign: "center", fontWeight: "bold", color: "#c62828" },
  td: {
    flex: 1,
    borderRight: "0.5pt solid #ccc",
    borderBottom: "0.5pt solid #ccc",
    padding: 4,
  },
  tdLabel: { flex: 2 },
  tdNarrow: { flex: 0.8 },
  conclusions: { marginTop: 4, lineHeight: 1.4 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  photoBox: { width: 150 },
  photo: { width: 150, height: 150, objectFit: "cover", borderRadius: 4 },
  photoNote: { fontSize: 8, color: "#555", marginTop: 2 },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 28,
    right: 28,
    fontSize: 8,
    color: "#999",
    textAlign: "center",
  },
});

const CHECK_SECTIONS: CheckSection[] = ["PACKAGING", "VISUAL", "PRODUCT"];

// @react-pdf/renderer's bidi engine misorders Latin/digit runs that touch
// Hebrew letters with no space between them (e.g. "X80שניב" renders as
// "שניבX80" instead of staying put) — insert a space at each such boundary.
// Confirmed via isolated render tests; not needed for the on-screen HTML
// (the browser's own bidi implementation handles the ungapped form fine).
function pdfSafe(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/([֐-׿])([A-Za-z0-9])/g, "$1 $2")
    .replace(/([A-Za-z0-9])([֐-׿])/g, "$1 $2");
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("he-IL").format(d);
}

export async function renderInspectionPdf(inspection: InspectionFull): Promise<Buffer> {
  const logoPath = join(process.cwd(), "public", "logo.png");
  const photos = inspection.photos.map((p) => ({
    ...p,
    absPath: storageAbsPath(p.url),
  }));

  const doc = (
    <Document
      title={`דוח בקרת אייכות ${inspection.serialNumber}`}
      author="Sadovsky Ltd"
    >
      {/* ---------------- Hebrew page ---------------- */}
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.headerRow}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={logoPath} style={styles.logo} />
          <View>
            <Text style={styles.title}>דוח בקרת אייכות</Text>
            <Text style={styles.meta}>מספר סידורי: {inspection.serialNumber}</Text>
            <Text style={styles.meta}>תאריך: {formatDate(inspection.createdAt)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>פרטים כלליים</Text>
        <View style={styles.kvGrid}>
          <KV label="תיאור המוצר" value={inspection.productDescription} />
          <KV label="קוד פריט סדובסקי" value={inspection.itemCodeSadovsky} />
          <KV label="מידות לפי מפרט" value={inspection.specDimensions} />
          <KV label="משקל לפי מפרט" value={inspection.specWeight} />
          <KV label="מספר הזמנה / מכולה" value={inspection.orderOrContainer} />
          <KV label="שם הבודק/ת" value={inspection.inspector.name} />
        </View>

        <Text style={styles.sectionTitle}>פרטי המדגם</Text>
        <View style={styles.kvGrid}>
          <KV label="כמות לבדיקה" value={inspection.qtyToInspect?.toString()} />
          <KV label="כמות קרטונים לבדיקה" value={inspection.cartonsToInspect?.toString()} />
          <KV label="כמות בהזמנה" value={inspection.qtyInOrder?.toString()} />
          <KV label="קוד פריט לקוח" value={inspection.customerItemCode} />
        </View>

        {CHECK_SECTIONS.map((section) => {
          const rows = inspection.checkItems.filter((c) => c.section === section);
          if (rows.length === 0) return null;
          return (
            <View key={section}>
              <Text style={styles.sectionTitle}>{CHECK_SECTION_LABELS_HE[section]}</Text>
              <View style={styles.table}>
                <View style={styles.tr}>
                  <Text style={[styles.th, styles.tdLabel]}></Text>
                  <Text style={styles.th}>תקין</Text>
                  <Text style={styles.th}>לא תקין</Text>
                  <Text style={[styles.th, { flex: 2 }]}>הערות</Text>
                </View>
                {rows.map((row) => (
                  <View style={styles.tr} key={row.id}>
                    <Text style={[styles.td, styles.tdLabel]}>{row.label}</Text>
                    <Text style={[styles.td, row.result === "OK" ? styles.tdOk : {}]}>
                      {row.result === "OK" ? "V" : ""}
                    </Text>
                    <Text style={[styles.td, row.result === "NOT_OK" ? styles.tdNotOk : {}]}>
                      {row.result === "NOT_OK" ? "X" : ""}
                    </Text>
                    <Text style={[styles.td, { flex: 2 }]}>{pdfSafe(row.note)}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        {inspection.measurements.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>מידות ומשקלים</Text>
            <View style={styles.table}>
              <View style={styles.tr}>
                <Text style={styles.th}>משקל יחידה (g)</Text>
                <Text style={styles.th}>רוחב (cm)</Text>
                <Text style={styles.th}>אורך (cm)</Text>
                <Text style={styles.th}>צבע</Text>
              </View>
              {inspection.measurements.map((m) => (
                <View style={styles.tr} key={m.id}>
                  <Text style={styles.td}>{m.unitWeightG ?? ""}</Text>
                  <Text style={styles.td}>{m.widthCm ?? ""}</Text>
                  <Text style={styles.td}>{m.lengthCm ?? ""}</Text>
                  <Text style={styles.td}>{pdfSafe(m.color)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {inspection.findings.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>פירוט ממצאי הבדיקה</Text>
            <View style={styles.table}>
              <View style={styles.tr}>
                <Text style={[styles.th, { flex: 3 }]}>ממצא</Text>
                <Text style={styles.th}>דרגת חומרה</Text>
              </View>
              {inspection.findings.map((f) => (
                <View style={styles.tr} key={f.id}>
                  <Text style={[styles.td, { flex: 3 }]}>{pdfSafe(f.text)}</Text>
                  <Text style={styles.td}>{SEVERITY_LABELS_HE[f.severity as keyof typeof SEVERITY_LABELS_HE]}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>מסקנות</Text>
        <Text style={styles.conclusions}>{inspection.conclusions ? pdfSafe(inspection.conclusions) : "—"}</Text>

        {photos.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>תמונות</Text>
            <View style={styles.photoGrid}>
              {photos.map((p) => (
                <View key={p.id} style={styles.photoBox}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image src={p.absPath} style={styles.photo} />
                  {p.note && <Text style={styles.photoNote}>{pdfSafe(p.note)}</Text>}
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.footer} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>

      {/* ---------------- English page ---------------- */}
      <Page size="A4" style={styles.pageEn} wrap>
        <View style={[styles.headerRow, { flexDirection: "row-reverse" }]}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={logoPath} style={styles.logo} />
          <View>
            <Text style={styles.title}>Quality Control Report</Text>
            <Text style={styles.metaEn}>Serial number: {inspection.serialNumber}</Text>
            <Text style={styles.metaEn}>Date: {formatDate(inspection.createdAt)}</Text>
          </View>
        </View>
        <Text style={{ fontSize: 8, color: "#888", marginBottom: 8 }}>
          Labels below are translated; free-text fields are shown as entered (Hebrew) until
          machine translation is configured.
        </Text>

        <Text style={styles.sectionTitle}>General Details</Text>
        <View style={styles.kvGrid}>
          <KV label="Product description" value={inspection.productDescription} ltr />
          <KV label="Sadovsky item code" value={inspection.itemCodeSadovsky} ltr />
          <KV label="Spec dimensions" value={inspection.specDimensions} ltr />
          <KV label="Spec weight" value={inspection.specWeight} ltr />
          <KV label="Order / container number" value={inspection.orderOrContainer} ltr />
          <KV label="Inspector" value={inspection.inspector.name} ltr />
        </View>

        <Text style={styles.sectionTitle}>Sample Details</Text>
        <View style={styles.kvGrid}>
          <KV label="Qty to inspect" value={inspection.qtyToInspect?.toString()} ltr />
          <KV label="Cartons to inspect" value={inspection.cartonsToInspect?.toString()} ltr />
          <KV label="Qty in order" value={inspection.qtyInOrder?.toString()} ltr />
          <KV label="Customer item code" value={inspection.customerItemCode} ltr />
        </View>

        {CHECK_SECTIONS.map((section) => {
          const rows = inspection.checkItems.filter((c) => c.section === section);
          if (rows.length === 0) return null;
          const titleEn = { PACKAGING: "Packaging", VISUAL: "Carton Visual Check", PRODUCT: "Product Results" }[section];
          return (
            <View key={section}>
              <Text style={styles.sectionTitle}>{titleEn}</Text>
              <View style={styles.table}>
                <View style={styles.tr}>
                  <Text style={[styles.th, styles.tdLabel]}></Text>
                  <Text style={styles.th}>OK</Text>
                  <Text style={styles.th}>Not OK</Text>
                  <Text style={[styles.th, { flex: 2 }]}>Notes</Text>
                </View>
                {rows.map((row) => (
                  <View style={styles.tr} key={row.id}>
                    <Text style={[styles.td, styles.tdLabel]}>
                      {CHECK_ROW_LABELS_EN[row.label] ?? row.label}
                    </Text>
                    <Text style={[styles.td, row.result === "OK" ? styles.tdOk : {}]}>
                      {row.result === "OK" ? "V" : ""}
                    </Text>
                    <Text style={[styles.td, row.result === "NOT_OK" ? styles.tdNotOk : {}]}>
                      {row.result === "NOT_OK" ? "X" : ""}
                    </Text>
                    <Text style={[styles.td, { flex: 2 }]}>{pdfSafe(row.note)}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        {inspection.measurements.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Measurements</Text>
            <View style={styles.table}>
              <View style={styles.tr}>
                <Text style={styles.th}>Unit weight (g)</Text>
                <Text style={styles.th}>Width (cm)</Text>
                <Text style={styles.th}>Length (cm)</Text>
                <Text style={styles.th}>Color</Text>
              </View>
              {inspection.measurements.map((m) => (
                <View style={styles.tr} key={m.id}>
                  <Text style={styles.td}>{m.unitWeightG ?? ""}</Text>
                  <Text style={styles.td}>{m.widthCm ?? ""}</Text>
                  <Text style={styles.td}>{m.lengthCm ?? ""}</Text>
                  <Text style={styles.td}>{pdfSafe(m.color)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {inspection.findings.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Findings</Text>
            <View style={styles.table}>
              <View style={styles.tr}>
                <Text style={[styles.th, { flex: 3 }]}>Finding</Text>
                <Text style={styles.th}>Severity</Text>
              </View>
              {inspection.findings.map((f) => (
                <View style={styles.tr} key={f.id}>
                  <Text style={[styles.td, { flex: 3 }]}>{pdfSafe(f.text)}</Text>
                  <Text style={styles.td}>{SEVERITY_LABELS_EN[f.severity as keyof typeof SEVERITY_LABELS_EN]}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Conclusions</Text>
        <Text style={styles.conclusions}>{inspection.conclusions ? pdfSafe(inspection.conclusions) : "—"}</Text>

        {photos.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Photos</Text>
            <View style={styles.photoGrid}>
              {photos.map((p) => (
                <View key={p.id} style={styles.photoBox}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image src={p.absPath} style={styles.photo} />
                  {p.note && <Text style={styles.photoNote}>{pdfSafe(p.note)}</Text>}
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.footer} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}

function KV({ label, value, ltr }: { label: string; value?: string | null; ltr?: boolean }) {
  return (
    <View style={styles.kvItem}>
      <Text style={styles.kvLabel}>{label}:</Text>
      <Text style={[styles.kvValue, ltr ? { textAlign: "left" } : { textAlign: "right" }]}>
        {value ? pdfSafe(value) : "—"}
      </Text>
    </View>
  );
}
