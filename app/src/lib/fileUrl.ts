// Pure string helper — safe to import from client components, unlike
// storage.ts (which touches the filesystem and must stay server-only).
//
// Pass `downloadName` to force a real download (Content-Disposition:
// attachment) instead of the browser opening the file inline — needed
// because a plain <a href> to a PDF just opens it in-tab, especially on
// mobile browsers. Leave it out for things meant to display inline, like
// photo thumbnails.
export function fileUrl(relPath: string, downloadName?: string): string {
  const path = `/files/${relPath.split("/").map(encodeURIComponent).join("/")}`;
  return downloadName ? `${path}?download=${encodeURIComponent(downloadName)}` : path;
}
