import { mkdir, writeFile } from "fs/promises";
import { join, dirname } from "path";

const STORAGE_ROOT = process.env.STORAGE_DIR
  ? join(process.cwd(), process.env.STORAGE_DIR)
  : join(process.cwd(), "storage");

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
