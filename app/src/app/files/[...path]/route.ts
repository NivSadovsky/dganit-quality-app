import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { getCurrentUser } from "@/lib/auth";
import { storageAbsPath } from "@/lib/storage";

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(req: NextRequest, ctx: RouteContext<"/files/[...path]">) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { path: segments } = await ctx.params;
  if (segments.some((s) => s === ".." || s.includes("/") || s.includes("\\"))) {
    return new NextResponse("Invalid path", { status: 400 });
  }

  const relPath = segments.join("/");
  const ext = relPath.split(".").pop()?.toLowerCase() ?? "";
  const downloadName = req.nextUrl.searchParams.get("download");

  try {
    const data = await readFile(storageAbsPath(relPath));
    const headers: Record<string, string> = {
      "Content-Type": MIME_BY_EXT[ext] ?? "application/octet-stream",
      "Cache-Control": "private, max-age=31536000, immutable",
    };
    if (downloadName) {
      // Forces a real download instead of the browser opening the PDF
      // in-tab — plain <a href> alone isn't reliable for this, especially
      // on mobile browsers.
      headers["Content-Disposition"] = `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`;
    }
    return new NextResponse(new Uint8Array(data), { headers });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
