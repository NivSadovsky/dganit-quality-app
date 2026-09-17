"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { regenerateInspectionPdf } from "./actions";

export function RegenerateReportButton({ inspectionId }: { inspectionId: string }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const router = useRouter();

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        disabled={pending}
        onClick={() => {
          setDone(false);
          startTransition(async () => {
            await regenerateInspectionPdf(inspectionId);
            router.refresh();
            setDone(true);
          });
        }}
        className="text-sm text-zinc-500 underline disabled:opacity-60"
      >
        {pending ? "מייצר מחדש..." : "יצירת הדוח מחדש"}
      </button>
      {done && <p className="text-xs text-green-700">הדוח עודכן.</p>}
    </div>
  );
}
