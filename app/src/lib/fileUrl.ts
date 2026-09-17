// Pure string helper — safe to import from client components, unlike
// storage.ts (which touches the filesystem and must stay server-only).
//
// Pass `downloadName` to force a real download (Content-Disposition:
// attachment) instead of the browser opening the file inline — needed
// because a plain <a href> to a PDF just opens it in-tab, especially on
// mobile browsers. Leave it out for things meant to display inline, like
// photo thumbnails.
//
// Pass `version` (e.g. a regenerated-at timestamp) for a file that can be
// overwritten in place at the same relPath, like a re-rendered inspection
// PDF — the route serves it with a year-long immutable Cache-Control, so
// without a version query param a browser that already fetched the old
// content would never see the new file.
export function fileUrl(relPath: string, downloadName?: string, version?: string | number): string {
  const path = `/files/${relPath.split("/").map(encodeURIComponent).join("/")}`;
  const params = new URLSearchParams();
  if (downloadName) params.set("download", downloadName);
  if (version !== undefined) params.set("v", String(version));
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}
