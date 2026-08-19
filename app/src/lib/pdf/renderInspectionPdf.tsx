import {
  Document,
  Page,
  View,
  Text,
  Image,
  Font,
  StyleSheet,
  Svg,
  Path,
  renderToBuffer,
} from "@react-pdf/renderer";
import { join } from "path";
import type { InspectionFull } from "@/lib/inspections";
import { storageAbsPath } from "@/lib/storage";
import {
  CHECK_SECTION_LABELS_HE,
  CHECK_ROW_LABELS_EN,
  CHECK_RESULT_LABELS_EN,
  CHECK_RESULT_LABELS_HE,
  SEVERITY_LABELS_HE,
  SEVERITY_LABELS_EN,
  colorLabelEn,
  MEASUREMENT_COLUMNS,
  type CheckSection,
  type ProductType,
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
  page: { padding: 28, fontFamily: "Heebo", fontSize: 9, direction: "rtl", textAlign: "right" },
  pageEn: { padding: 28, fontFamily: "Heebo", fontSize: 9, direction: "ltr", textAlign: "left" },
  headerRow: {
    // react-pdf's Yoga layout mirrors flexDirection based on the page's
    // `direction` — plain "row" on an rtl page puts the first JSX child
    // (the logo) on the right and the second (title block) on the left,
    // which is backwards for a Hebrew report. row-reverse corrects it here
    // and, by the same mirroring, also gives the desired logo-right /
    // title-left layout on the ltr English page — see renderInspectionEnglishPdf.
    flexDirection: "row-reverse",
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
    textAlign: "right",
  },
  sectionTitleEn: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0b2f6b",
    backgroundColor: "#eef2fb",
    padding: 4,
    marginTop: 10,
    marginBottom: 4,
    textAlign: "left",
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
    textAlign: "right",
  },
  thEn: {
    flex: 1,
    borderRight: "0.5pt solid #ccc",
    borderBottom: "0.5pt solid #ccc",
    backgroundColor: "#f4f6fb",
    padding: 4,
    fontWeight: "bold",
    textAlign: "left",
  },
  tdOk: { backgroundColor: "#e8f5e9", textAlign: "center", fontWeight: "bold", color: "#2e7d32" },
  tdNotOk: { backgroundColor: "#ffebee", textAlign: "center", fontWeight: "bold", color: "#c62828" },
  tdNa: { backgroundColor: "#f4f4f5", textAlign: "center", fontWeight: "bold", color: "#71717a" },
  td: {
    flex: 1,
    borderRight: "0.5pt solid #ccc",
    borderBottom: "0.5pt solid #ccc",
    padding: 4,
    textAlign: "right",
  },
  tdEn: {
    flex: 1,
    borderRight: "0.5pt solid #ccc",
    borderBottom: "0.5pt solid #ccc",
    padding: 4,
    textAlign: "left",
  },
  tdLabel: { flex: 2 },
  conclusions: { marginTop: 4, lineHeight: 1.4, textAlign: "right" },
  conclusionsEn: { marginTop: 4, lineHeight: 1.4, textAlign: "left" },
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
  signatureBlock: { marginTop: 28, alignItems: "center" },
  signatureName: { fontSize: 9, fontWeight: "bold", color: "#222", textAlign: "center" },
  signatureTitle: { fontSize: 8, color: "#555", textAlign: "center" },
  signatureLogo: { width: 90, height: 28, marginTop: 6 },
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

function SignatureBlock() {
  const logoPath = join(process.cwd(), "public", "logo.png");
  return (
    <View style={styles.signatureBlock}>
      <Svg width={140} height={36} viewBox="0 0 140 36">
        <Path
          d="M6,26 C14,6 20,32 28,16 C34,4 40,30 48,14 C54,4 58,26 66,18 C72,12 76,24 84,14 C90,6 94,22 102,16 C108,12 112,20 120,10 C124,6 128,14 134,8"
          stroke="#1a2a5e"
          strokeWidth={1.4}
          fill="none"
        />
      </Svg>
      <Text style={styles.signatureName}>דגנית חגי</Text>
      <Text style={styles.signatureTitle}>מנהלת איכות, סדובסקי בע&quot;מ</Text>
      <Text style={styles.signatureTitle}>חוצות היוצר 13ב&#39;, אשקלון</Text>
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image src={logoPath} style={styles.signatureLogo} />
    </View>
  );
}

export async function renderInspectionPdf(inspection: InspectionFull): Promise<Buffer> {
  const logoPath = join(process.cwd(), "public", "logo.png");
  const photos = inspection.photos.map((p) => ({
    ...p,
    absPath: storageAbsPath(p.url),
  }));
  const measurementColumns = MEASUREMENT_COLUMNS[inspection.productType as ProductType];

  const doc = (
    <Document title={`דוח בקרת איכות ${inspection.serialNumber}`} author="Sadovsky Ltd">
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.headerRow}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={logoPath} style={styles.logo} />
          <View>
            <Text style={styles.title}>דוח בקרת איכות</Text>
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
          <KV label="שם ספק" value={inspection.supplierName} />
          <KV label="שם הבודק/ת" value={inspection.inspector.name} />
          <KV
            label="תאריך בדיקה"
            value={inspection.inspectionDate ? formatDate(inspection.inspectionDate) : null}
          />
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
                  <Text style={styles.th}>{CHECK_RESULT_LABELS_HE.OK}</Text>
                  <Text style={styles.th}>{CHECK_RESULT_LABELS_HE.NOT_OK}</Text>
                  <Text style={styles.th}>{CHECK_RESULT_LABELS_HE.NOT_RELEVANT}</Text>
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
                    <Text style={[styles.td, row.result === "NOT_RELEVANT" ? styles.tdNa : {}]}>
                      {row.result === "NOT_RELEVANT" ? "—" : ""}
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
                {measurementColumns.map((col) => (
                  <Text style={styles.th} key={col.key}>
                    {col.labelHe}
                  </Text>
                ))}
              </View>
              {inspection.measurements.map((m) => (
                <View style={styles.tr} key={m.id}>
                  {measurementColumns.map((col) => (
                    <Text style={styles.td} key={col.key}>
                      {pdfSafe(String(m[col.key] ?? ""))}
                    </Text>
                  ))}
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
                  <Text style={styles.td}>
                    {SEVERITY_LABELS_HE[f.severity as keyof typeof SEVERITY_LABELS_HE]}
                  </Text>
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

        <SignatureBlock />

        <Text style={styles.footer} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}

export async function renderInspectionEnglishPdf(inspection: InspectionFull): Promise<Buffer> {
  const logoPath = join(process.cwd(), "public", "logo.png");
  const photos = inspection.photos.map((p) => ({
    ...p,
    absPath: storageAbsPath(p.url),
  }));
  const measurementColumns = MEASUREMENT_COLUMNS[inspection.productType as ProductType];

  const doc = (
    <Document title={`Quality Control Report ${inspection.serialNumber}`} author="Sadovsky Ltd">
      <Page size="A4" style={styles.pageEn} wrap>
        <View style={styles.headerRow}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={logoPath} style={styles.logo} />
          <View>
            <Text style={styles.title}>Quality Control Report</Text>
            <Text style={styles.metaEn}>Serial number: {inspection.serialNumber}</Text>
            <Text style={styles.metaEn}>Date: {formatDate(inspection.createdAt)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitleEn}>General Details</Text>
        <View style={styles.kvGrid}>
          <KV
            label="Product description"
            value={inspection.productDescriptionEn || inspection.productDescription}
            ltr
          />
          <KV label="SKU" value={inspection.itemCodeSadovsky} ltr />
          <KV label="Spec dimensions" value={inspection.specDimensions} ltr />
          <KV label="Spec weight" value={inspection.specWeight} ltr />
          <KV label="Order / container number" value={inspection.orderOrContainer} ltr />
          <KV label="Supplier" value={inspection.supplierName} ltr />
          <KV label="Inspector" value={inspection.inspectorNameEn || inspection.inspector.name} ltr />
          <KV
            label="Inspection date"
            value={inspection.inspectionDate ? formatDate(inspection.inspectionDate) : null}
            ltr
          />
        </View>

        <Text style={styles.sectionTitleEn}>Sample Details</Text>
        <View style={styles.kvGrid}>
          <KV label="Qty to inspect" value={inspection.qtyToInspect?.toString()} ltr />
          <KV label="Cartons to inspect" value={inspection.cartonsToInspect?.toString()} ltr />
          <KV label="Qty in order" value={inspection.qtyInOrder?.toString()} ltr />
          <KV label="Customer item code" value={inspection.customerItemCode} ltr />
        </View>

        {CHECK_SECTIONS.map((section) => {
          const rows = inspection.checkItems.filter((c) => c.section === section);
          if (rows.length === 0) return null;
          const titleEn = {
            PACKAGING: "Packaging",
            VISUAL: "Carton Visual Check",
            PRODUCT: "Product Results",
          }[section];
          return (
            <View key={section}>
              <Text style={styles.sectionTitleEn}>{titleEn}</Text>
              <View style={styles.table}>
                <View style={styles.tr}>
                  <Text style={[styles.thEn, styles.tdLabel]}></Text>
                  <Text style={styles.thEn}>{CHECK_RESULT_LABELS_EN.OK}</Text>
                  <Text style={styles.thEn}>{CHECK_RESULT_LABELS_EN.NOT_OK}</Text>
                  <Text style={styles.thEn}>{CHECK_RESULT_LABELS_EN.NOT_RELEVANT}</Text>
                  <Text style={[styles.thEn, { flex: 2 }]}>Notes</Text>
                </View>
                {rows.map((row) => (
                  <View style={styles.tr} key={row.id}>
                    <Text style={[styles.tdEn, styles.tdLabel]}>
                      {CHECK_ROW_LABELS_EN[row.label] ?? row.label}
                    </Text>
                    <Text style={[styles.tdEn, row.result === "OK" ? styles.tdOk : {}]}>
                      {row.result === "OK" ? "V" : ""}
                    </Text>
                    <Text style={[styles.tdEn, row.result === "NOT_OK" ? styles.tdNotOk : {}]}>
                      {row.result === "NOT_OK" ? "X" : ""}
                    </Text>
                    <Text style={[styles.tdEn, row.result === "NOT_RELEVANT" ? styles.tdNa : {}]}>
                      {row.result === "NOT_RELEVANT" ? "—" : ""}
                    </Text>
                    <Text style={[styles.tdEn, { flex: 2 }]}>{pdfSafe(row.noteEn || row.note)}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        {inspection.measurements.length > 0 && (
          <View>
            <Text style={styles.sectionTitleEn}>Measurements</Text>
            <View style={styles.table}>
              <View style={styles.tr}>
                {measurementColumns.map((col) => (
                  <Text style={styles.thEn} key={col.key}>
                    {col.labelEn}
                  </Text>
                ))}
              </View>
              {inspection.measurements.map((m) => (
                <View style={styles.tr} key={m.id}>
                  {measurementColumns.map((col) => (
                    <Text style={styles.tdEn} key={col.key}>
                      {col.kind === "color"
                        ? colorLabelEn(m[col.key] as string | null)
                        : pdfSafe(String(m[col.key] ?? ""))}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </View>
        )}

        {inspection.findings.length > 0 && (
          <View>
            <Text style={styles.sectionTitleEn}>Findings</Text>
            <View style={styles.table}>
              <View style={styles.tr}>
                <Text style={[styles.thEn, { flex: 3 }]}>Finding</Text>
                <Text style={styles.thEn}>Severity</Text>
              </View>
              {inspection.findings.map((f) => (
                <View style={styles.tr} key={f.id}>
                  <Text style={[styles.tdEn, { flex: 3 }]}>{pdfSafe(f.textEn || f.text)}</Text>
                  <Text style={styles.tdEn}>
                    {SEVERITY_LABELS_EN[f.severity as keyof typeof SEVERITY_LABELS_EN]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.sectionTitleEn}>Conclusions</Text>
        <Text style={styles.conclusionsEn}>
          {inspection.conclusionsEn || inspection.conclusions || "—"}
        </Text>

        {photos.length > 0 && (
          <View>
            <Text style={styles.sectionTitleEn}>Photos</Text>
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

        <SignatureBlock />

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
