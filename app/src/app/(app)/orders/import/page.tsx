import Link from "next/link";
import { ImportForm } from "./ImportForm";

export default function ImportOrderPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 p-4">
      <Link href="/orders" className="text-sm text-brand underline">
        חזרה לרשימת ההזמנות
      </Link>
      <h1 className="text-xl font-bold text-brand">ייבוא הזמנת רכש</h1>
      <p className="text-sm text-zinc-500">
        יש לבחור את קובץ ה-PDF של הזמנת הרכש. המערכת תזהה אוטומטית את הפריטים,
        ותעביר אתכם לרשימת הפריטים — שם אפשר לבדוק ולתקן כל שורה לפני שממשיכים.
      </p>
      <ImportForm />
    </div>
  );
}
