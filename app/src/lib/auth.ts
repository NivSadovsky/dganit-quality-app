import "server-only";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function getCurrentUser() {
  const session = await getSession();
  if (!session.userId) return null;
  return db.user.findUnique({ where: { id: session.userId } });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
