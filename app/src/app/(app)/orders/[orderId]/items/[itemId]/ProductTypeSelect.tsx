import { PRODUCT_TYPES, PRODUCT_TYPE_LABELS_HE } from "@/lib/constants";
import { startInspectionAction } from "./actions";

export function ProductTypeSelect({ itemId, description }: { itemId: string; description: string }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
        <h1 className="mb-1 text-lg font-bold text-brand">התחלת בדיקה</h1>
        <p className="mb-4 text-sm text-zinc-500">{description}</p>
        <p className="mb-3 text-sm font-medium">בחרו את סוג המוצר לבדיקה:</p>
        <div className="flex flex-col gap-2">
          {PRODUCT_TYPES.map((type) => (
            <form key={type} action={startInspectionAction}>
              <input type="hidden" name="itemId" value={itemId} />
              <input type="hidden" name="productType" value={type} />
              <button
                type="submit"
                className="w-full rounded-xl bg-brand px-4 py-3 text-right font-semibold text-white"
              >
                {PRODUCT_TYPE_LABELS_HE[type]}
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
