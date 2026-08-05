"use client";

import { useState, useTransition } from "react";
import type { InspectionFull } from "@/lib/inspections";
import {
  updateInspectionTranslation,
  updateCheckItem,
  updateFinding,
  generateEnglishPdf,
} from "../actions";

function Row({
  heLabel,
  heValue,
  defaultValue,
  onSave,
  multiline,
}: {
  heLabel: string;
  heValue: string;
  defaultValue: string;
  onSave: (v: string) => void;
  multiline?: boolean;
}) {
  const [, startTransition] = useTransition();
  const commonProps = {
    dir: "ltr" as const,
    placeholder: "English translation",
    defaultValue,
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      startTransition(() => onSave(e.target.value)),
    className: "rounded-lg border border-zinc-300 px-3 py-2 text-sm",
  };

  return (
    <div className="flex flex-col gap-1.5 border-b border-zinc-100 py-3 last:border-0">
      <span className="text-xs font-medium text-zinc-400">{heLabel}</span>
      <p className="text-sm">{heValue}</p>
      {multiline ? (
        <textarea rows={3} {...commonProps} />
      ) : (
        <input {...commonProps} />
      )}
    </div>
  );
}

export function TranslateForm({ inspection }: { inspection: InspectionFull }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const notedCheckItems = inspection.checkItems.filter((c) => c.note && c.note.trim());

  const onGenerate = () => {
    setDone(false);
    startTransition(async () => {
      await generateEnglishPdf(inspection.id);
      setDone(true);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
        <h2 className="mb-1 font-bold text-brand">שם הבודק/ת</h2>
        <Row
          heLabel="עברית"
          heValue={inspection.inspector.name}
          defaultValue={inspection.inspectorNameEn ?? ""}
          onSave={(v) => updateInspectionTranslation(inspection.id, { inspectorNameEn: v })}
        />
      </div>

      {inspection.conclusions && (
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
          <h2 className="mb-1 font-bold text-brand">מסקנות</h2>
          <Row
            heLabel="עברית"
            heValue={inspection.conclusions}
            defaultValue={inspection.conclusionsEn ?? ""}
            multiline
            onSave={(v) => updateInspectionTranslation(inspection.id, { conclusionsEn: v })}
          />
        </div>
      )}

      {notedCheckItems.length > 0 && (
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
          <h2 className="mb-1 font-bold text-brand">הערות בדיקה</h2>
          {notedCheckItems.map((c) => (
            <Row
              key={c.id}
              heLabel={c.label}
              heValue={c.note!}
              defaultValue={c.noteEn ?? ""}
              onSave={(v) => updateCheckItem(c.id, { noteEn: v })}
            />
          ))}
        </div>
      )}

      {inspection.findings.length > 0 && (
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
          <h2 className="mb-1 font-bold text-brand">פירוט ממצאי הבדיקה</h2>
          {inspection.findings.map((f) => (
            <Row
              key={f.id}
              heLabel="ממצא"
              heValue={f.text}
              defaultValue={f.textEn ?? ""}
              onSave={(v) => updateFinding(f.id, { textEn: v })}
            />
          ))}
        </div>
      )}

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
        <p className="mb-3 text-sm text-zinc-500">
          צבעים במידות ומשקלים מתורגמים אוטומטית ואינם צריכים תרגום ידני.
        </p>
        <button
          disabled={pending}
          onClick={onGenerate}
          className="w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white disabled:opacity-60"
        >
          {pending ? "יוצר PDF..." : "יצירת דוח באנגלית"}
        </button>
        {done && (
          <p className="mt-2 text-center text-sm text-green-700">
            הדוח נוצר! ניתן להוריד אותו מדף הבדיקה.
          </p>
        )}
      </div>
    </div>
  );
}
