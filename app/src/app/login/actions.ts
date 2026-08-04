"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const codeSchema = z.string().regex(/^\d{9}$/, "יש להזין קוד בן 9 ספרות");

export async function login(_prevState: { error?: string } | undefined, formData: FormData) {
  const parsed = codeSchema.safeParse(formData.get("code"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "קוד לא תקין" };
  }

  const user = await db.user.findUnique({ where: { code: parsed.data } });
  if (!user) {
    return { error: "קוד לא מוכר. יש לפנות למנהל/ת המערכת" };
  }

  const session = await getSession();
  session.userId = user.id;
  await session.save();

  redirect("/orders");
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}
