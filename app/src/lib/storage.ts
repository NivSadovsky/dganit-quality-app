import { mkdir, writeFile, unlink } from "fs/promises";
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

// Best-effort — used when deleting a whole order so old files don't pile up
// forever on the volume. Never throws: a file that's already gone (or was
// never written) shouldn't block the DB deletion it's cleaning up after.
export async function deleteFile(relPath: string): Promise<void> {
  try {
    await unlink(storageAbsPath(relPath));
  } catch {
    // ignore
  }
}

export { fileUrl } from "@/lib/fileUrl";
