import { mkdir, writeFile } from "fs/promises";
import { join, dirname, resolve } from "path";

// resolve() (not join()) so an absolute STORAGE_DIR — e.g. "/data" for the
// Railway volume mount — is used as-is instead of being nested under cwd
// (join("/app", "/data") silently produces "/app/data", not "/data").
const STORAGE_ROOT = resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.STORAGE_DIR ?? "storage");

export async function saveFile(relPath: string, data: Buffer): Promise<string> {
  const absPath = join(STORAGE_ROOT, relPath);
  await mkdir(dirname(absPath), { recursive: true });
  await writeFile(absPath, data);
  return relPath;
}

export function storageAbsPath(relPath: string): string {
  return join(STORAGE_ROOT, relPath);
}

export { fileUrl } from "@/lib/fileUrl";
