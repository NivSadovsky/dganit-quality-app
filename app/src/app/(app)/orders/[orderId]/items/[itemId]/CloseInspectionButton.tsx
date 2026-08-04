"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { closeInspection } from "./actions";

export function CloseInspectionButton({
  inspectionId,
  uncheckedCount,
}: {
  inspectionId: string;
  uncheckedCount: number;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  const onConfirm = () => {
    startTransition(async () => {
      await closeInspection(inspectionId);
      router.refresh();
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-200 bg-white p-3">
      <div className="mx-auto flex max-w-2xl flex-col gap-2">
        {confirming && (
          <div className="text-center text-sm text-zinc-600">
            {uncheckedCount > 0 && (
              <p className="mb-1 font-medium text-amber-700">
                לא כל השורות מולאו ({uncheckedCount} ללא סימון תקין/לא תקין) — האם את/ה בטוח/ה?
              </p>
            )}
            <p>לסגור את הבדיקה וליצור דוח PDF? לא ניתן יהיה לערוך לאחר הסגירה.</p>
          </div>
        )}
        <div className="flex gap-2">
          {confirming && (
            <button
              disabled={pending}
              onClick={() => setConfirming(false)}
              className="rounded-xl bg-zinc-100 px-4 py-3 font-semibold text-zinc-700 disabled:opacity-60"
            >
              ביטול
            </button>
          )}
          <button
            disabled={pending}
            onClick={() => (confirming ? onConfirm() : setConfirming(true))}
            className="flex-1 rounded-xl bg-brand px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {pending ? "סוגר וממיר ל-PDF..." : confirming ? "אישור סגירה" : "סגירת בדיקה"}
          </button>
        </div>
      </div>
    </div>
  );
}
